import Foundation
import StoreKit
import Security
import Combine
import shared

struct StoreProduct: Identifiable {
    var id: String { packId }
    let packId: String
    let sku: String
    let title: String
    let price: String
}
private struct StoreMapping: Decodable { let packId: String; let appleSku: String? }
private struct StoreAvailability: Decodable { let apple: Bool? }
private struct StoreBinding: Decodable {
    let owner: String
    let appAccountToken: String
    let purchasesEnabled: Bool
    let products: [StoreMapping]
    // Per-store readiness; older servers only send purchasesEnabled.
    let stores: StoreAvailability?
    var applePurchasable: Bool { stores?.apple ?? purchasesEnabled }
}
private struct StoreDelivery: Decodable { let verified: Bool; let status: String; let environment: String }
private struct StoreOwnership: Decodable { let owner: String }

@MainActor
final class StoreKitAdapter: ObservableObject {
    @Published var products: [StoreProduct] = []
    @Published var owned: Set<String> = []
    @Published var notice: String?
    /// Which paid elections lock on this device, decided by the shared
    /// StoreGate rule Android also uses: the server has native gating on, the
    /// App Store is ready, and the election's own pack is listed there and
    /// loaded on this device. Any failure leaves it open (nothing locks).
    @Published private(set) var gate = StoreGate.companion.OPEN
    var gating: Bool { gate.gating }
    /// Scenarios unlocked on the game account (activation codes and web
    /// unlocks, also on accounts not linked to Lakeside). They never lock.
    @Published private(set) var accountScenarios: Set<String> = []
    private var gateGeneration = 0
    #if targetEnvironment(simulator)
    private var pinnedGate: StoreGate?
    /// Simulator captures only: show the locked state without a live store.
    func pinGateForCapture(_ value: StoreGate) { pinnedGate = value; gate = value }
    #endif
    private let account: CampaignAccount
    private let wallet: NativeStoreWallet
    private var updatesTask: Task<Void, Never>?
    private var accountChanges: AnyCancellable?
    private var unlockChanges: AnyCancellable?
    private var skuToPack: [String: String] = [:]
    private var binding: StoreBinding?
    private var bindingSession: String?
    private static let cacheService = "net.lakesidegames.marginofvictory.store-wallet"

    init(account: CampaignAccount) {
        self.account = account
        wallet = NativeStoreWallet.companion.restore(json: Self.readCache())
        owned = Set(wallet.packs(sessionKey: account.storeSessionKey(), nowMillis: Self.now()))
        updatesTask = Task { [weak self] in
            for await update in Transaction.updates {
                guard !Task.isCancelled else { return }
                await self?.deliver(update)
            }
        }
        accountChanges = account.$user.sink { [weak self] _ in
            // @Published sends before assignment. Clear displayed products and
            // rights immediately, then read the new authenticated session.
            self?.products = []; self?.owned = []; self?.setGate(nil)
            Task { [weak self] in await self?.refreshAll() }
        }
        unlockChanges = account.$unlocked.sink { [weak self] ids in self?.accountScenarios = Set(ids) }
    }
    deinit { updatesTask?.cancel() }
    private static func now() -> Int64 { Int64(Date().timeIntervalSince1970 * 1000) }
    func refresh() { Task { await refreshAll() } }
    private func refreshAll() async {
        owned = Set(wallet.packs(sessionKey: account.storeSessionKey(), nowMillis: Self.now()))
        Task { [weak self] in await self?.refreshGate() }
        guard account.user?.ahdLinked == true else { products = []; return }
        do {
            try await configure()
            try await refreshOwnership()
            await loadProducts()
            guard !skuToPack.isEmpty else { return }
            for await result in Transaction.currentEntitlements { await deliver(result, refresh: false) }
            try await refreshOwnership()
        } catch { notice = error.localizedDescription }
    }
    private func configure() async throws {
        guard account.user?.ahdLinked == true, let owner = account.user?.id,
              let session = account.storeSessionKey() else { throw AccountError("Sign in with your Lakeside account to manage shared purchases.") }
        let data = try await account.call(path: "/api/store/binding", method: "POST", body: Data("{}".utf8))
        let value = try JSONDecoder().decode(StoreBinding.self, from: data)
        guard value.owner == owner, account.user?.id == owner, session == account.storeSessionKey(),
              UUID(uuidString: value.appAccountToken) != nil else { throw AccountError("Shared account setup could not be verified.") }
        binding = value; bindingSession = session
        skuToPack = Dictionary(value.products.compactMap { p in p.appleSku.map { ($0, p.packId) } }, uniquingKeysWith: { first, _ in first })
    }
    /// Nil opens everything; a pinned simulator capture gate always wins.
    private func setGate(_ value: StoreGate?) {
        gateGeneration += 1
        #if targetEnvironment(simulator)
        if let pinnedGate { gate = pinnedGate; return }
        #endif
        gate = value ?? StoreGate.companion.OPEN
    }
    /// Re-reads the lock switch from the public catalog. Signed-out, unlinked
    /// and linked players follow the same switch, so a lock never depends on
    /// sign-in. A pack locks only once the App Store returns its product here.
    private func refreshGate() async {
        gateGeneration += 1
        let generation = gateGeneration
        var next = StoreGate.companion.OPEN
        if let data = try? await account.call(path: "/api/store/catalog"), let json = String(data: data, encoding: .utf8) {
            let server = StoreGate.companion.fromServer(json: json, store: StoreGate.companion.APPLE)
            if server.gate.gating, let found = try? await Product.products(for: Array(server.skus.keys)) {
                next = server.gate.onDevice(loadedPacks: Set(found.compactMap { server.skus[$0.id] }))
            }
        }
        guard generation == gateGeneration else { return }
        setGate(next)
    }
    private func loadProducts() async {
        guard binding?.applePurchasable == true, !skuToPack.isEmpty else { products = []; return }
        let session = bindingSession
        do {
            let result = try await Product.products(for: Array(skuToPack.keys))
            guard session == account.storeSessionKey() else { products = []; return }
            products = result.compactMap { p in
                guard let pack = skuToPack[p.id] else { return nil }
                return StoreProduct(packId: pack, sku: p.id, title: p.displayName, price: p.displayPrice)
            }
        } catch { products = []; notice = "Product lookup failed." }
    }
    func purchase(packId: String) async {
        do {
            try await configure()
            try await refreshOwnership()
            guard !owned.contains(packId), !owned.contains("complete") else { throw AccountError("You already own this pack on your Lakeside account.") }
            guard binding?.applePurchasable == true, let value = binding,
                  let token = UUID(uuidString: value.appAccountToken),
                  let sku = skuToPack.first(where: { $0.value == packId })?.key else { throw AccountError("Paid packs are not available yet.") }
            let found = try await Product.products(for: [sku])
            guard let product = found.first, bindingSession == account.storeSessionKey() else { throw AccountError("Refresh your Lakeside account before purchasing.") }
            switch try await product.purchase(options: [.appAccountToken(token)]) {
            case .success(let verification): await deliver(verification)
            case .userCancelled: notice = "Purchase canceled."
            case .pending: notice = "Purchase pending."
            @unknown default: notice = "Purchase failed."
            }
        } catch { notice = error.localizedDescription }
    }
    func restore() async {
        do {
            try await configure()
            try await refreshOwnership()
            guard !skuToPack.isEmpty else { notice = "Shared purchases refreshed."; return }
            try await AppStore.sync()
            for await result in Transaction.currentEntitlements { await deliver(result, refresh: false) }
            try await refreshOwnership()
        } catch { notice = error.localizedDescription }
    }
    private func deliver(_ verification: VerificationResult<Transaction>, refresh: Bool = true) async {
        guard case .verified(let transaction) = verification, skuToPack[transaction.productID] != nil else { return }
        do {
            let fields = ["store": "apple", "signedTransaction": verification.jwsRepresentation]
            let data = try await account.call(path: "/api/store/verify", method: "POST", body: JSONSerialization.data(withJSONObject: fields))
            let result = try JSONDecoder().decode(StoreDelivery.self, from: data)
            guard result.verified else { throw AccountError("Purchase delivery could not be verified.") }
            // Interrupted or rejected delivery stays unfinished for StoreKit
            // to redeliver. Finish only after the server's durable receipt.
            await transaction.finish()
            notice = result.status != "paid" ? "Purchase is not active." : result.environment == "Sandbox"
                ? "Test purchase verified. Production ownership is unchanged." : "Purchase delivered to your Lakeside account."
            if refresh { try await refreshOwnership() }
        } catch { notice = error.localizedDescription }
    }
    private func refreshOwnership() async throws {
        guard let session = account.storeSessionKey() else { owned = []; throw AccountError("Sign in to refresh shared purchases.") }
        let data = try await account.call(path: "/api/store/ownership", method: "POST", body: Data("{}".utf8))
        let owner = try JSONDecoder().decode(StoreOwnership.self, from: data).owner
        guard session == account.storeSessionKey(), account.user?.id == owner,
              let json = String(data: data, encoding: .utf8),
              wallet.accept(responseJson: json, sessionKey: session, expectedOwner: owner, nowMillis: Self.now()) else {
            throw AccountError("Shared account ownership could not be read.")
        }
        try Self.saveCache(wallet.json())
        owned = Set(wallet.packs(sessionKey: session, nowMillis: Self.now()))
    }
    private static func cacheQuery() -> [String: Any] {
        [kSecClass as String: kSecClassGenericPassword, kSecAttrService as String: cacheService, kSecAttrAccount as String: "wallet"]
    }
    private static func readCache() -> String? {
        var query = cacheQuery(); query[kSecReturnData as String] = true; query[kSecMatchLimit as String] = kSecMatchLimitOne
        var result: CFTypeRef?
        guard SecItemCopyMatching(query as CFDictionary, &result) == errSecSuccess, let data = result as? Data else { return nil }
        return String(data: data, encoding: .utf8)
    }
    private static func saveCache(_ json: String?) throws {
        guard let json else { return }
        let query = cacheQuery()
        let update = [kSecValueData as String: Data(json.utf8)]
        let status = SecItemUpdate(query as CFDictionary, update as CFDictionary)
        if status == errSecItemNotFound {
            var add = query; add[kSecValueData as String] = Data(json.utf8)
            add[kSecAttrAccessible as String] = kSecAttrAccessibleAfterFirstUnlockThisDeviceOnly
            guard SecItemAdd(add as CFDictionary, nil) == errSecSuccess else { throw AccountError("Purchase cache could not be saved.") }
        } else if status != errSecSuccess { throw AccountError("Purchase cache could not be saved.") }
    }
}
