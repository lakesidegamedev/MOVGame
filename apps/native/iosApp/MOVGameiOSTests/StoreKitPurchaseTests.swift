import XCTest
import StoreKit
import StoreKitTest
@testable import MOVGameiOS

// App Store purchases through the real StoreKitAdapter, on the simulator, with
// Xcode's StoreKit testing (Products.storekit lists all 15 products). The game
// server is replaced by FakeBridge, which answers the four store calls the way
// the live server does and records what the app sends.
//
// What this proves: the app loads every product, buys with the Lakeside
// account token attached, hands the signed transaction to the server bridge,
// unlocks the right pack only after the server confirms, keeps a transaction
// unfinished when delivery fails, and Restore delivers it again. What it
// cannot prove: that Apple's servers accept the receipt. StoreKit testing
// transactions are signed by Xcode, not Apple, and the account service
// refuses them (server/__tests__/apple-transaction.test.ts shows why).
final class StoreKitPurchaseTests: XCTestCase {
    private var session: SKTestSession!

    static let packIds = ["complete", "us-historical", "uk-elections", "canada", "germany", "france", "australia",
                          "new-zealand", "india", "japan", "brazil", "ireland", "spain", "italy", "mexico"]
    static func sku(_ packId: String) -> String { "com.lakesidegames.electioneer." + packId.replacingOccurrences(of: "-", with: "_") }

    override func setUpWithError() throws {
        let url = try XCTUnwrap(Bundle(for: Self.self).url(forResource: "Products", withExtension: "storekit"),
                                "Products.storekit is missing from the test bundle")
        session = try SKTestSession(contentsOf: url)
        session.resetToDefaultState()
        session.disableDialogs = true
        session.clearTransactions()
        FakeBridge.reset()
        URLProtocol.registerClass(FakeBridge.self)
    }

    override func tearDownWithError() throws {
        URLProtocol.unregisterClass(FakeBridge.self)
        session?.clearTransactions()
    }

    // MARK: Helpers

    @MainActor
    private func signedIn() async throws -> CampaignAccount {
        let account = CampaignAccount()
        await account.authenticate(email: "reviewer@example.com", password: "fixture", username: nil)
        XCTAssertEqual(account.user?.id, FakeBridge.userId, account.message ?? "sign in failed")
        XCTAssertEqual(account.user?.ahdLinked, true)
        XCTAssertNotNil(account.storeSessionKey(), "the session token was not stored")
        return account
    }

    /// StoreKit testing must be active, or product lookups return nothing and
    /// AppStore.sync() waits for a real App Store sign-in that never comes.
    /// Fails (never skips) so a broken setup cannot pass as green.
    private func requireStoreKitTesting() async throws {
        let found = try await Product.products(for: [Self.sku("canada")])
        guard !found.isEmpty else { throw StoreKitTestingUnavailable() }
    }

    /// Runs Restore purchases with a deadline, so a stuck AppStore.sync() fails
    /// this test instead of hanging the job. A stuck call is left behind.
    @MainActor
    private func restore(_ store: StoreKitAdapter, timeout: TimeInterval = 45) async throws {
        let done = Flag()
        Task { @MainActor in await store.restore(); done.value = true }
        try await waitFor("Restore purchases to finish", timeout: timeout) { done.value }
    }

    @MainActor
    private func waitFor(_ what: String, timeout: TimeInterval = 30, _ condition: () -> Bool) async throws {
        let deadline = Date().addingTimeInterval(timeout)
        while !condition() {
            if Date() > deadline { XCTFail("Timed out waiting for \(what)"); return }
            try await Task.sleep(nanoseconds: 100_000_000)
        }
    }

    private func payload(of jws: String) throws -> [String: Any] {
        let parts = jws.split(separator: ".")
        XCTAssertEqual(parts.count, 3, "signed transaction is not a JWS")
        var base64 = String(parts[1]).replacingOccurrences(of: "-", with: "+").replacingOccurrences(of: "_", with: "/")
        while base64.count % 4 != 0 { base64 += "=" }
        let data = try XCTUnwrap(Data(base64Encoded: base64))
        return try XCTUnwrap(JSONSerialization.jsonObject(with: data) as? [String: Any])
    }

    private func unfinishedCount() async -> Int {
        var count = 0
        for await _ in Transaction.unfinished { count += 1 }
        return count
    }

    // MARK: Tests

    func testConfigurationListsAll15ProductsAsNonConsumables() async throws {
        let products = try await Product.products(for: Self.packIds.map(Self.sku))
        XCTAssertEqual(products.count, 15)
        for product in products {
            XCTAssertEqual(product.type, .nonConsumable, product.id)
            XCTAssertEqual(product.price, product.id.hasSuffix(".complete") ? Decimal(string: "3.99") : Decimal(string: "0.99"), product.id)
        }
    }

    @MainActor
    func testStoreShowsEveryPackWithItsAppStorePrice() async throws {
        try await requireStoreKitTesting()
        let account = try await signedIn()
        let store = StoreKitAdapter(account: account)
        try await waitFor("15 products") { store.products.count == 15 }
        XCTAssertEqual(Set(store.products.map(\.packId)), Set(Self.packIds))
        for product in store.products {
            XCTAssertEqual(product.sku, Self.sku(product.packId))
            XCTAssertEqual(product.price, product.packId == "complete" ? "$3.99" : "$0.99", product.packId)
        }
        account.signOut()
    }

    @MainActor
    func testBuyingAPackHandsTheSignedTransactionToTheServerBridge() async throws {
        try await requireStoreKitTesting()
        let account = try await signedIn()
        let store = StoreKitAdapter(account: account)
        try await waitFor("products") { store.products.count == 15 }
        XCTAssertFalse(store.owned.contains("canada"))

        await store.purchase(packId: "canada")

        let posts = FakeBridge.verifyBodies
        XCTAssertFalse(posts.isEmpty, "no transaction reached /api/store/verify; notice: \(store.notice ?? "none")")
        for body in posts {
            XCTAssertEqual(body["store"], "apple")
            let jws = try XCTUnwrap(body["signedTransaction"])
            let fields = try payload(of: jws)
            XCTAssertEqual(fields["productId"] as? String, Self.sku("canada"))
            XCTAssertEqual(fields["bundleId"] as? String, "com.lakesidegames.electioneer")
            XCTAssertEqual(fields["type"] as? String, "Non-Consumable")
            // The Lakeside account binding the server checks before it records the pack.
            XCTAssertEqual((fields["appAccountToken"] as? String)?.lowercased(), FakeBridge.appAccountToken.uuidString.lowercased())
        }
        XCTAssertEqual(FakeBridge.deliveredPacks, ["canada"])
        XCTAssertTrue(store.owned.contains("canada"))
        XCTAssertFalse(store.owned.contains("complete"))
        XCTAssertEqual(store.notice, "Test purchase verified and unlocked in the app. Web ownership is unchanged.")
        let left = await unfinishedCount()
        XCTAssertEqual(left, 0, "a delivered transaction must be finished")
        account.signOut()
    }

    @MainActor
    func testBuyingTheCompleteCollection() async throws {
        try await requireStoreKitTesting()
        let account = try await signedIn()
        let store = StoreKitAdapter(account: account)
        try await waitFor("products") { store.products.count == 15 }
        await store.purchase(packId: "complete")
        XCTAssertEqual(FakeBridge.deliveredPacks, ["complete"], store.notice ?? "")
        XCTAssertTrue(store.owned.contains("complete"))
        account.signOut()
    }

    @MainActor
    func testFailedDeliveryStaysUnfinishedAndRestoreDeliversIt() async throws {
        try await requireStoreKitTesting()
        let account = try await signedIn()
        let store = StoreKitAdapter(account: account)
        try await waitFor("products") { store.products.count == 15 }

        // The server cannot reach the account service while the player pays.
        FakeBridge.verifyStatus = 503
        await store.purchase(packId: "japan")
        XCTAssertFalse(store.owned.contains("japan"))
        XCTAssertEqual(store.notice, "Store verification is temporarily unavailable. Try again.")
        XCTAssertTrue(FakeBridge.deliveredPacks.isEmpty)
        let pending = await unfinishedCount()
        XCTAssertEqual(pending, 1, "an undelivered purchase must stay unfinished so it is not lost")

        // Back online: Store > Restore purchases.
        FakeBridge.verifyStatus = 200
        try await restore(store)
        XCTAssertEqual(FakeBridge.deliveredPacks, ["japan"], store.notice ?? "")
        XCTAssertTrue(store.owned.contains("japan"))
        let left = await unfinishedCount()
        XCTAssertEqual(left, 0)
        account.signOut()
    }

    @MainActor
    func testRestoreOnAFreshInstallReadsOwnershipFromTheAccount() async throws {
        try await requireStoreKitTesting()
        // Bought earlier on another device: the account already owns the pack.
        FakeBridge.serverOwned = ["brazil"]
        let account = try await signedIn()
        let store = StoreKitAdapter(account: account)
        try await waitFor("products") { store.products.count == 15 }
        try await restore(store)
        XCTAssertTrue(store.owned.contains("brazil"), store.notice ?? "")
        account.signOut()
    }
}

struct StoreKitTestingUnavailable: LocalizedError {
    var errorDescription: String? { "StoreKit testing is not active: Products.storekit returned no products" }
}

@MainActor
final class Flag { var value = false }

/// Stands in for the game server's account and store routes.
final class FakeBridge: URLProtocol {
    static let userId = "user-storekit-test"
    static let appAccountToken = UUID(uuidString: "6F1C2A4E-8B3D-4C5E-9A7F-0D1E2F3A4B5C")!
    private static let lock = NSLock()
    private static var _verifyBodies: [[String: String]] = []
    private static var _delivered: [String] = []
    private static var _owned: Set<String> = []
    private static var _verifyStatus = 200
    private static var _lastVerifiedAt: Int64 = 0

    static var verifyBodies: [[String: String]] { lock.withLock { _verifyBodies } }
    static var deliveredPacks: [String] { lock.withLock { _delivered } }
    static var serverOwned: Set<String> {
        get { lock.withLock { _owned } }
        set { lock.withLock { _owned = newValue } }
    }
    static var verifyStatus: Int {
        get { lock.withLock { _verifyStatus } }
        set { lock.withLock { _verifyStatus = newValue } }
    }
    static func reset() {
        lock.withLock { _verifyBodies = []; _delivered = []; _owned = []; _verifyStatus = 200 }
    }

    override class func canInit(with request: URLRequest) -> Bool { request.url?.host == "sim.ahousedividedgame.com" }
    override class func canonicalRequest(for request: URLRequest) -> URLRequest { request }
    override func stopLoading() {}

    override func startLoading() {
        let path = request.url?.path ?? ""
        let (status, body) = Self.answer(method: request.httpMethod ?? "GET", path: path, body: Self.bodyData(request))
        let response = HTTPURLResponse(url: request.url!, statusCode: status, httpVersion: "HTTP/1.1",
                                       headerFields: ["Content-Type": "application/json"])!
        client?.urlProtocol(self, didReceive: response, cacheStoragePolicy: .notAllowed)
        client?.urlProtocol(self, didLoad: (try? JSONSerialization.data(withJSONObject: body)) ?? Data("{}".utf8))
        client?.urlProtocolDidFinishLoading(self)
    }

    private static func bodyData(_ request: URLRequest) -> Data {
        if let data = request.httpBody { return data }
        guard let stream = request.httpBodyStream else { return Data() }
        stream.open(); defer { stream.close() }
        var data = Data()
        var buffer = [UInt8](repeating: 0, count: 16_384)
        while stream.hasBytesAvailable {
            let read = stream.read(&buffer, maxLength: buffer.count)
            if read <= 0 { break }
            data.append(buffer, count: read)
        }
        return data
    }

    private static func sku(_ packId: String) -> String { StoreKitPurchaseTests.sku(packId) }

    private static func answer(method: String, path: String, body: Data) -> (Int, [String: Any]) {
        let user: [String: Any] = ["id": userId, "username": "storekit_tester", "email": "reviewer@example.com", "ahdLinked": true]
        switch (method, path) {
        case ("POST", "/api/auth/login"):
            return (200, ["token": "storekit-test-token", "user": user])
        case ("GET", "/api/auth/me"):
            return (200, ["user": user, "unlocked": ["scenarioIds": [String](), "packIds": [String]()]])
        case ("POST", "/api/store/binding"):
            return (200, ["owner": userId, "appAccountToken": appAccountToken.uuidString.lowercased(), "purchasesEnabled": true,
                          "stores": ["apple": true, "google": true],
                          "products": StoreKitPurchaseTests.packIds.map { ["packId": $0, "appleSku": sku($0)] }])
        case ("POST", "/api/store/verify"):
            let fields = ((try? JSONSerialization.jsonObject(with: body)) as? [String: String]) ?? [:]
            return lock.withLock { () -> (Int, [String: Any]) in
                _verifyBodies.append(fields)
                guard _verifyStatus == 200 else {
                    return (_verifyStatus, ["error": "Store verification is temporarily unavailable. Try again."])
                }
                // Map the signed product id to its pack, as the account service does.
                let productId = productIdOf(fields["signedTransaction"] ?? "")
                guard let pack = StoreKitPurchaseTests.packIds.first(where: { sku($0) == productId }) else {
                    return (400, ["error": "This store product is not a MOV pack."])
                }
                if !_delivered.contains(pack) { _delivered.append(pack) }
                _owned.insert(pack)
                return (200, ["verified": true, "status": "paid", "packId": pack, "environment": "Sandbox"])
            }
        case ("POST", "/api/store/ownership"):
            return lock.withLock { () -> (Int, [String: Any]) in
                // Strictly increasing, as the wallet ignores a snapshot no newer than the last.
                _lastVerifiedAt = max(Int64(Date().timeIntervalSince1970 * 1000), _lastVerifiedAt + 1)
                return (200, ["owner": userId, "packIds": Array(_owned).sorted(), "verifiedAt": _lastVerifiedAt])
            }
        case ("GET", "/api/store/catalog"):
            return (200, ["sharedOwnership": true, "purchasesEnabled": false, "products": [Any]()])
        default:
            return (404, ["error": "Not used by the store tests"])
        }
    }

    private static func productIdOf(_ jws: String) -> String? {
        let parts = jws.split(separator: ".")
        guard parts.count == 3 else { return nil }
        var base64 = String(parts[1]).replacingOccurrences(of: "-", with: "+").replacingOccurrences(of: "_", with: "/")
        while base64.count % 4 != 0 { base64 += "=" }
        guard let data = Data(base64Encoded: base64),
              let json = try? JSONSerialization.jsonObject(with: data) as? [String: Any] else { return nil }
        return json["productId"] as? String
    }
}
