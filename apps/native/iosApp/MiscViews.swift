import SwiftUI
import Security
import CryptoKit
import shared

/// Why a pack counts as owned, in the player's words, or nil when it does not.
func nativeOwnershipReason(packId: String, owned: Set<String>) -> String? {
    let list = Array(owned)
    if owned.contains(packId) { return "On your Lakeside account" }
    if packId != "complete" && owned.contains("complete") && NativeAccess.shared.covers(packId: packId, ownedPacks: ["complete"]) { return "Included in the Complete Collection" }
    if packId != "global" && owned.contains("global") && NativeAccess.shared.covers(packId: packId, ownedPacks: ["global"]) { return "Included in your Global Elections Pack" }
    if NativeAccess.shared.covers(packId: packId, ownedPacks: list) { return "Covered by the packs you own" }
    return nil
}

/// Every pack in the catalog bundle, Complete Collection first. Prices come
/// from the App Store product when one exists; a pack without a purchasable
/// product says "Coming soon" and has no Buy button. Presentation only:
/// buying, receipts and entitlements stay in StoreKitAdapter and the wallet.
struct StoreView: View {
    @ObservedObject var session: GameSession
    @Environment(\.dismiss) private var dismiss
    @ObservedObject private var store: StoreKitAdapter
    @State private var showingAccount = false
    @State private var expanded: String?
    init(session: GameSession) { self.session = session; self.store = session.store }

    private let countries = MobileCampaign.companion.countries()
    private var elections: [NativeElection] { countries.flatMap { MobileCampaign.companion.elections(countryId: $0.id) } }

    var body: some View {
        let all = elections
        let byScenario = Dictionary(all.map { ($0.scenarioId, $0) }, uniquingKeysWith: { first, _ in first })
        let packs = NativeCatalog.shared.packs()
        let linked = session.account.user?.ahdLinked == true
        ScrollView {
            VStack(alignment: .leading, spacing: 14) {
                Text("STORE").font(.caption.bold()).tracking(2).foregroundStyle(CampaignStyle.gold)
                Text("Election packs").font(.title2.bold())
                Text("\(countries.count) countries and \(all.count) elections. \(all.filter { $0.free }.count) elections, one in every country, are free for everyone.")
                    .font(.subheadline).foregroundStyle(CampaignStyle.muted).fixedSize(horizontal: false, vertical: true)
                if !store.gating {
                    Text("Packs are not on sale in the app yet, so every election is open to play.")
                        .font(.caption).foregroundStyle(CampaignStyle.muted)
                }
                if let notice = store.notice {
                    Text(notice).font(.caption).foregroundStyle(CampaignStyle.gold)
                }
                if !linked {
                    VStack(alignment: .leading, spacing: 8) {
                        Text("Sign in to buy").font(.headline)
                        Text("Packs belong to your Lakeside account, so they work on the web, iPhone and Android.")
                            .font(.subheadline).foregroundStyle(CampaignStyle.muted).fixedSize(horizontal: false, vertical: true)
                        Button("Sign in with Lakeside Games") { showingAccount = true }
                            .buttonStyle(.bordered).tint(CampaignStyle.gold)
                    }
                    .padding(16).frame(maxWidth: .infinity, alignment: .leading)
                    .background(CampaignStyle.card, in: RoundedRectangle(cornerRadius: 14))
                }
                if let complete = packs.first(where: { $0.id == "complete" }) {
                    let list = complete.scenarios.compactMap { byScenario[$0] }
                    packCard(complete, flag: nil, featured: true, linked: linked,
                             summary: "Every paid election: \(complete.scenarios.count) elections across \(Set(list.map { $0.country }).count) countries.",
                             elections: list)
                }
                let countryPacks = packs.filter { $0.id != "complete" && !$0.legacy }
                Text("COUNTRY PACKS · \(countryPacks.count)").font(.caption.bold()).tracking(1).foregroundStyle(CampaignStyle.gold)
                    .padding(.top, 4)
                ForEach(countryPacks, id: \.id) { pack in
                    let country = countries.first { NativeCatalog.shared.country(id: $0.id)?.packId == pack.id }
                    let list = country.map { MobileCampaign.companion.elections(countryId: $0.id) } ?? pack.scenarios.compactMap { byScenario[$0] }
                    let years = list.map { Int($0.year) }
                    let free = list.filter { $0.free }.count
                    packCard(pack, flag: country?.flag, featured: false, linked: linked,
                             summary: "\(pack.scenarios.count) elections, \(String(years.min() ?? 0)) to \(String(years.max() ?? 0))" + (free > 0 ? ". Plus \(free) free to everyone" : ""),
                             elections: list)
                }
                let legacy = packs.filter { $0.legacy && nativeOwnershipReason(packId: $0.id, owned: store.owned) != nil }
                if !legacy.isEmpty {
                    Text("RETIRED PACKS YOU OWN").font(.caption.bold()).tracking(1).foregroundStyle(CampaignStyle.gold)
                    ForEach(legacy, id: \.id) { pack in
                        packCard(pack, flag: nil, featured: false, linked: linked,
                                 summary: "\(pack.scenarios.count) elections. No longer sold; it stays on your account.",
                                 elections: pack.scenarios.compactMap { byScenario[$0] })
                    }
                }
                Button(action: browse) {
                    Text("Browse the campaign library").font(.headline).frame(maxWidth: .infinity).padding(14)
                }
                .buttonStyle(.plain).foregroundStyle(.white)
                .background(CampaignStyle.card, in: RoundedRectangle(cornerRadius: 14))
                if linked {
                    Button("Restore purchases") { Task { await store.restore() } }
                        .font(.subheadline.bold()).foregroundStyle(CampaignStyle.gold)
                        .frame(maxWidth: .infinity, minHeight: 44)
                }
            }
            .padding(20)
        }
        .background(CampaignStyle.background).preferredColorScheme(.dark)
        .sheet(isPresented: $showingAccount) {
            NavigationStack {
                AccountView(session: session)
                    .toolbar { ToolbarItem(placement: .topBarTrailing) { Button("Done") { showingAccount = false } } }
            }
        }
        .onAppear { store.refresh() }
    }

    private func packCard(_ pack: CatalogPack, flag: String?, featured: Bool, linked: Bool, summary: String, elections: [NativeElection]) -> some View {
        let reason = nativeOwnershipReason(packId: pack.id, owned: store.owned)
        let product = store.products.first { $0.packId == pack.id }
        let open = expanded == pack.id
        return VStack(alignment: .leading, spacing: 10) {
            HStack(alignment: .top, spacing: 12) {
                VStack(alignment: .leading, spacing: 4) {
                    if featured { Text("BEST VALUE").font(.caption2.bold()).tracking(1).foregroundStyle(CampaignStyle.gold) }
                    Text([flag, pack.name].compactMap { $0 }.joined(separator: " "))
                        .font(featured ? .title3.bold() : .headline).fixedSize(horizontal: false, vertical: true)
                    Text(summary).font(.caption).foregroundStyle(CampaignStyle.muted).fixedSize(horizontal: false, vertical: true)
                }
                Spacer(minLength: 6)
                if reason != nil { NativeBadge(text: "Owned", color: Color(red: 0.37, green: 0.80, blue: 0.55)) }
                else if let product { Text(product.price).font(.headline).monospacedDigit() }
                else if !linked { NativeBadge(text: "Sign in to buy", color: CampaignStyle.muted) }
                else { NativeBadge(text: "Coming soon", color: CampaignStyle.gold) }
            }
            if let reason {
                Label(reason, systemImage: "checkmark.circle.fill").font(.caption.bold())
                    .foregroundStyle(Color(red: 0.37, green: 0.80, blue: 0.55))
            } else if let product {
                Button { Task { await store.purchase(packId: pack.id) } } label: {
                    Text("Buy \(pack.name) · \(product.price)").font(.subheadline.bold())
                        .multilineTextAlignment(.center).frame(maxWidth: .infinity).padding(12)
                }
                .buttonStyle(.plain).foregroundStyle(CampaignStyle.background)
                .background(CampaignStyle.coral, in: RoundedRectangle(cornerRadius: 12))
            }
            Button { expanded = open ? nil : pack.id } label: {
                HStack {
                    Text(open ? "Hide elections" : "Show \(elections.count) elections").font(.subheadline.bold())
                    Image(systemName: open ? "chevron.up" : "chevron.down").font(.caption.bold())
                }
                .foregroundStyle(CampaignStyle.muted).frame(minHeight: 32)
            }
            .buttonStyle(.plain)
            if open {
                VStack(spacing: 0) {
                    ForEach(elections, id: \.scenarioId) { election in
                        Button { play(election) } label: {
                            HStack(alignment: .firstTextBaseline, spacing: 10) {
                                Text("\(election.flag) \(String(election.year))").font(.subheadline).monospacedDigit()
                                    .foregroundStyle(CampaignStyle.muted)
                                Text(nativeElectionTitle(election.label)).font(.subheadline).foregroundStyle(.white)
                                    .multilineTextAlignment(.leading)
                                Spacer(minLength: 4)
                                if election.free { NativeBadge(text: "Free", color: Color(red: 0.37, green: 0.80, blue: 0.55)) }
                            }
                            .frame(minHeight: 40).contentShape(Rectangle())
                        }
                        .buttonStyle(.plain)
                        .accessibilityHint("Opens the election in the library")
                    }
                }
            }
        }
        .padding(16).frame(maxWidth: .infinity, alignment: .leading)
        .background(featured ? Color(red: 26/255, green: 38/255, blue: 52/255) : CampaignStyle.card, in: RoundedRectangle(cornerRadius: 14))
        .overlay(RoundedRectangle(cornerRadius: 14).strokeBorder(featured && reason == nil ? CampaignStyle.gold.opacity(0.7) : .clear, lineWidth: 1.5))
    }

    private func play(_ election: NativeElection) {
        session.dailySetup = nil
        session.libraryRequest = LibraryPick(countryId: election.country, electionId: election.nativeId)
        session.playScreen = .library
        dismiss()
    }

    private func browse() {
        session.dailySetup = nil
        session.playScreen = .library
        dismiss()
    }
}

struct AccountView: View {
    @ObservedObject var session: GameSession
    @ObservedObject private var account: CampaignAccount
    @State private var email = ""
    @State private var password = ""
    @State private var username = ""
    @State private var registering = false
    @State private var showingLakeside = false
    @State private var confirmingDelete = false

    init(session: GameSession) { self.session = session; self.account = session.account }

    var body: some View {
        ScrollView {
            VStack(alignment: .leading, spacing: 16) {
                Text("YOUR ACCOUNT").font(.caption.bold()).tracking(1.5).foregroundStyle(CampaignStyle.gold)
                if let user = account.user {
                    Text("Welcome, \(user.username)").font(.title2.bold())
                    Text(user.email).foregroundStyle(CampaignStyle.muted)
                    Text(user.ahdLinked == true ? "Lakeside Games account linked" : "Lakeside Games account not linked").font(.caption)
                    if user.ahdLinked != true { Button("Sign in with Lakeside Games") { showingLakeside = true }.disabled(account.busy) }
                    Button("Refresh account") { Task { await account.refresh() } }.disabled(account.busy)
                    AccountPurchaseHistory(account: account)
                    Button("Sign out") { account.signOut() }.disabled(account.busy)
                        .foregroundStyle(CampaignStyle.coral)
                    Button("Delete account", role: .destructive) { confirmingDelete = true }.disabled(account.busy)
                    Text("Deleting removes this Margin of Victory account, its cloud saves, scores and achievements. Bundles bought on your Lakeside account stay with that account.")
                        .font(.caption).foregroundStyle(CampaignStyle.muted)
                } else {
                    Text(registering ? "Create an account" : "Sign in")
                        .font(.title2.bold())
                    Text("Use the same Margin of Victory account as the web game.")
                        .font(.subheadline).foregroundStyle(CampaignStyle.muted)
                    Button("Sign in with Lakeside Games") { showingLakeside = true }.disabled(account.busy)
                    Text("Or use email").font(.caption).foregroundStyle(CampaignStyle.muted)
                    if registering {
                        TextField("Username", text: $username)
                            .textContentType(.username)
                    }
                    TextField("Email", text: $email)
                        .textContentType(.emailAddress).keyboardType(.emailAddress)
                        .textInputAutocapitalization(.never)
                    SecureField("Password", text: $password)
                        .textContentType(registering ? .newPassword : .password)
                    Button(account.busy ? "Please wait…" : registering ? "Create account" : "Sign in") {
                        Task {
                            await account.authenticate(email: email, password: password,
                                                       username: registering ? username : nil)
                            if account.user != nil { password = "" }
                        }
                    }
                    .font(.headline).frame(maxWidth: .infinity).padding(15)
                    .foregroundStyle(CampaignStyle.background)
                    .background(CampaignStyle.coral, in: RoundedRectangle(cornerRadius: 12))
                    .disabled(account.busy || email.isEmpty || password.isEmpty || (registering && username.isEmpty))
                    Button(registering ? "Already have an account? Sign in" : "New here? Create an account") {
                        registering.toggle()
                        account.message = nil
                    }
                    .foregroundStyle(CampaignStyle.gold)
                }
                if let message = account.message {
                    Text(message).font(.subheadline).foregroundStyle(CampaignStyle.coral)
                }
                VStack(alignment: .leading, spacing: 6) {
                    Text("CAMPAIGN SAVE").font(.caption.bold()).tracking(1).foregroundStyle(CampaignStyle.gold)
                    Text(session.hasGame ? session.savedCampaignLabel : "No campaign on this device")
                        .font(.headline)
                    Text("Daily challenges play on this device. Sign in to post finished campaigns to the shared leaderboard.")
                        .font(.subheadline).foregroundStyle(CampaignStyle.muted)
                }
                .frame(maxWidth: .infinity, alignment: .leading)
                .padding(16).background(CampaignStyle.card, in: RoundedRectangle(cornerRadius: 14))
                NavigationLink("Manage saved campaigns") { CampaignSavesView(session: session) }
                AccountAchievements(account: account)
                if account.user != nil && !account.rankings.isEmpty {
                    DisclosureGroup("Your personal bests") {
                        ForEach(account.rankings, id: \.scenarioId) { rank in
                            Text("\(rank.scenarioId) · #\(rank.rank) · \(rank.score) · \(rank.difficulty)").font(.caption)
                        }
                    }
                }
                NavigationLink("Leaderboards and daily champions") { AccountBoardsView(account: account) }
            }
            .padding(20)
        }
        .textFieldStyle(.roundedBorder)
        .sheet(isPresented: $showingLakeside) {
            NativeLakesideLoginView { code in
                showingLakeside = false
                Task { await account.exchangeLakeside(code: code) }
            }
        }
        .onAppear {
            #if targetEnvironment(simulator)
            if ProcessInfo.processInfo.arguments.contains("--mov-capture-lakeside-login") { showingLakeside = true }
            #endif
        }
        .confirmationDialog("Delete your Margin of Victory account?", isPresented: $confirmingDelete, titleVisibility: .visible) {
            Button("Delete account", role: .destructive) { Task { await account.deleteAccount() } }
            Button("Cancel", role: .cancel) {}
        } message: {
            Text("This permanently removes the account, its cloud saves, scores and achievements. It cannot be undone.")
        }
        .background(CampaignStyle.background).preferredColorScheme(.dark)
    }
}


struct AccountUser: Decodable {
    let id: String
    let username: String
    let email: String
    let ahdLinked: Bool?
}

private struct LoginResponse: Decodable {
    let token: String
    let user: AccountUser
}

private struct ProfileResponse: Decodable {
    let user: AccountUser
    let unlocked: AccountUnlocked?
}
private struct AccountUnlocked: Decodable { let scenarioIds: [String] }
struct BoardEntry: Decodable { let rank: Int; let username: String; let score: Int }
struct PersonalDailyRank: Decodable { let rank: Int; let score: Int }
private struct BoardResponse: Decodable { let entries: [BoardEntry]; let me: PersonalDailyRank? }
struct AccountPurchase: Decodable { let packName: String?; let packId: String?; let amountCents: Int?; let currency: String?; let provider: String?; let status: String; let createdAt: Double }
private struct PurchasesResponse: Decodable { let purchases: [AccountPurchase] }
private struct ScorePostResponse: Decodable { let rank: Int; let posted: Bool; let personalBest: Int }

private struct APIError: Decodable {
    let error: String
}

@MainActor
final class CampaignAccount: ObservableObject {
    @Published var user: AccountUser?
    @Published var busy = false
    @Published var message: String?
    @Published var board: [BoardEntry] = []
    @Published var unlocked: [String] = []
    @Published var cloudSaves: [CloudSaveMeta] = []
    @Published var dailyRank: PersonalDailyRank?
    @Published var boardKey = ""
    @Published var champions: NativeDailyChampions?
    @Published var rankings: [NativePlayerRanking] = []
    @Published var purchases: [AccountPurchase] = []
    @Published var purchasesLoaded = false
    @Published var awards: [NativeCollectedAward] = []
    private let progress = NativeAccountProgress.companion.restore(json: UserDefaults.standard.string(forKey: "mov_account_achievements_v1"))
    private var boardGeneration = 0

    private let service = "net.lakesidegames.marginofvictory.account"
    private let account = "session-token"

    init() {
        awards = progress.awards()
        if readToken() != nil { Task { await refresh() } }
    }

    func authenticate(email: String, password: String, username: String?) async {
        busy = true
        message = nil
        defer { busy = false }
        do {
            let path = username == nil ? "login" : "register"
            var fields = ["email": email.trimmingCharacters(in: .whitespacesAndNewlines), "password": password]
            if let username { fields["username"] = username.trimmingCharacters(in: .whitespacesAndNewlines) }
            let payload = try await request(path: path, fields: fields)
            let response = try JSONDecoder().decode(LoginResponse.self, from: payload)
            try saveToken(response.token)
            user = response.user
            await refresh()
        } catch {
            message = error.localizedDescription
        }
    }

    func refresh() async {
        guard let token = readToken(),
              let url = URL(string: "https://sim.ahousedividedgame.com/api/auth/me") else { return }
        busy = true
        defer { busy = false }
        do {
            var request = URLRequest(url: url)
            request.setValue("Bearer \(token)", forHTTPHeaderField: "Authorization")
            let (data, response) = try await URLSession.shared.data(for: request)
            guard let http = response as? HTTPURLResponse else { throw AccountError("Could not reach account server") }
            if http.statusCode == 401 {
                if token == readToken() { signOut() }
                return
            }
            guard (200..<300).contains(http.statusCode) else { throw AccountError(serverMessage(data)) }
            let profile = try JSONDecoder().decode(ProfileResponse.self, from: data)
            guard token == readToken() else { return }
            user = profile.user
            unlocked = profile.unlocked?.scenarioIds ?? []
            await readDetails()
        } catch {
            message = "Account could not be refreshed: \(error.localizedDescription)"
        }
    }

    /// Permanently deletes the game account on the server, then clears this device.
    func deleteAccount() async {
        busy = true
        defer { busy = false }
        do {
            _ = try await call(path: "/api/auth/account", method: "DELETE")
            signOut()
            message = "Your account was deleted."
        } catch { message = error.localizedDescription }
    }

    func signOut() {
        let query = tokenQuery()
        SecItemDelete(query as CFDictionary)
        user = nil
        unlocked = []
        cloudSaves = []
        purchases = []; purchasesLoaded = false; dailyRank = nil
        boardGeneration += 1; board = []; boardKey = ""; rankings = []
        message = nil
    }

    func storeSessionKey() -> String? {
        readToken().map { SHA256.hash(data: Data($0.utf8)).map { String(format: "%02x", $0) }.joined() }
    }

    func call(path: String, method: String = "GET", body: Data? = nil) async throws -> Data {
        guard let url = URL(string: "https://sim.ahousedividedgame.com\(path)") else { throw AccountError("Account service is unavailable") }
        var request = URLRequest(url: url)
        request.httpMethod = method
        request.httpBody = body
        request.timeoutInterval = path.hasPrefix("/api/store/") ? 75 : 20
        request.setValue("application/json", forHTTPHeaderField: "Content-Type")
        let credential = readToken()
        if let token = credential { request.setValue("Bearer \(token)", forHTTPHeaderField: "Authorization") }
        let (data, response) = try await URLSession.shared.data(for: request)
        guard let http = response as? HTTPURLResponse else { throw AccountError("Could not reach account server") }
        guard credential == readToken() else { throw AccountError("Account changed during the request. Try again.") }
        if http.statusCode == 401, credential != nil, path != "/api/lakeside/exchange" { signOut() }
        guard (200..<300).contains(http.statusCode) else { throw AccountError(serverMessage(data), status: http.statusCode, conflict: ((try? JSONSerialization.jsonObject(with: data)) as? [String: Any])?["conflict"] as? Bool == true) }
        return data
    }

    func mirrorSave(id: String, payload: String, owner: String) async -> NativeCloudOutcome {
        guard user?.id == owner, !busy else { return NativeCloudOutcome(status: "retry", version: -1, message: "Sign in to resume cloud sync.") }
        busy = true
        defer { busy = false }
        do {
            let list = try await call(path: "/api/saves")
            guard let capabilities = try JSONSerialization.jsonObject(with: list) as? [String: Any], capabilities["versionPreconditions"] as? Bool == true else {
                return NativeCloudOutcome(status: "unsupported", version: -1, message: "Cloud save service needs an update.")
            }
            let data = try await call(path: "/api/saves/\(id)", method: "PUT", body: Data(payload.utf8))
            guard user?.id == owner, let response = try JSONSerialization.jsonObject(with: data) as? [String: Any], let version = response["updatedAt"] as? NSNumber else {
                return NativeCloudOutcome(status: "retry", version: -1, message: "Account changed during sync.")
            }
            if let record = try JSONSerialization.jsonObject(with: Data(payload.utf8)) as? [String: Any], let name = record["name"] as? String, let turn = record["turn"] as? NSNumber {
                cloudSaves = (cloudSaves.filter { $0.id != id } + [CloudSaveMeta(id: id, name: name, turn: turn.intValue, updatedAt: version.int64Value)]).sorted { $0.updatedAt > $1.updatedAt }
            }
            return NativeCloudOutcome(status: "synced", version: version.int64Value, message: "")
        } catch {
            let code = (error as? AccountError)?.status
            let rejected = code.map { (400..<500).contains($0) && ![401, 408, 429].contains($0) } ?? false
            return NativeCloudOutcome(status: (error as? AccountError)?.conflict == true ? "conflict" : rejected ? "rejected" : "retry", version: -1, message: error.localizedDescription)
        }
    }

    func activate(code: String) async {
        guard !busy else { return }
        busy = true; message = nil
        defer { busy = false }
        do {
            let body = try JSONSerialization.data(withJSONObject: ["code": code.trimmingCharacters(in: .whitespaces)])
            _ = try await call(path: "/api/auth/activate", method: "POST", body: body)
            await refresh()
            message = "Campaign code activated."
        } catch { message = error.localizedDescription }
    }

    func loadBoard(date: String, scenarioId: String? = nil) async {
        boardGeneration += 1
        let generation = boardGeneration
        boardKey = scenarioId ?? "daily:\(date)"
        board = []; dailyRank = nil
        do {
            let data = try await call(path: scenarioId.map { "/api/leaderboard?scenario=\($0)&limit=20" } ?? "/api/daily/board?date=\(date)")
            guard generation == boardGeneration else { return }
            let response = try JSONDecoder().decode(BoardResponse.self, from: data)
            board = response.entries; dailyRank = response.me
        } catch { if generation == boardGeneration { message = "Leaderboard unavailable. You can keep playing offline." } }
    }

    func loadChampions() async {
        boardGeneration += 1
        let generation = boardGeneration
        boardKey = "champions"; champions = nil
        do {
            let data = try await call(path: "/api/daily/champions")
            guard generation == boardGeneration, let json = String(data: data, encoding: .utf8),
                  let result = NativeDailyChampions.companion.parse(json: json) else { return }
            champions = result
        } catch { if generation == boardGeneration { message = "Daily champions unavailable. You can keep playing offline." } }
    }

    func postScore(payload: String, daily: Bool) async {
        guard !busy else { return }
        busy = true; message = nil
        defer { busy = false }
        do {
            let data = try await call(path: daily ? "/api/daily" : "/api/leaderboard", method: "POST", body: Data(payload.utf8))
            let posted = try JSONDecoder().decode(ScorePostResponse.self, from: data)
            if daily { await loadBoard(date: nativeUTCDay()) }
            message = posted.posted ? "Score posted. Rank #\(posted.rank)." : "Kept your personal best (\(posted.personalBest)). Rank #\(posted.rank)."
        } catch { message = error.localizedDescription }
    }

    func exchangeLakeside(code: String) async {
        guard !busy else { return }
        busy = true; message = nil
        defer { busy = false }
        do {
            let body = try JSONSerialization.data(withJSONObject: ["code": code])
            let data = try await call(path: "/api/lakeside/exchange", method: "POST", body: body)
            let response = try JSONDecoder().decode(LoginResponse.self, from: data)
            try saveToken(response.token)
            user = response.user
            await refresh()
        } catch { message = error.localizedDescription }
    }

    private func persistProgress() {
        UserDefaults.standard.set(progress.json(), forKey: "mov_account_achievements_v1")
        awards = progress.awards()
    }
    func recordAchievementSnapshot(_ snapshot: String) {
        guard progress.recordSnapshot(snapshot: snapshot) else { return }
        persistProgress()
        if user != nil && !busy { Task { await syncAchievements() } }
    }
    private func syncProgress() async throws {
        guard let owner = user?.id else { return }
        let data = try await call(path: "/api/achievements")
        guard user?.id == owner else { throw AccountError("Account changed during achievement sync.") }
        guard let json = String(data: data, encoding: .utf8) else { throw AccountError("Achievement response unreadable.") }
        guard let uploads = progress.uploads(serverJson: json) else { throw AccountError("Achievement response unreadable.") }
        persistProgress()
        for upload in uploads {
            guard user?.id == owner else { throw AccountError("Account changed during achievement sync.") }
            _ = try await call(path: "/api/achievements", method: "POST", body: Data(upload.payload.utf8))
        }
    }
    func syncAchievements() async {
        guard !busy else { return }
        busy = true; message = nil
        defer { busy = false }
        do { try await syncProgress(); message = "Achievements synced." }
        catch { message = "Achievements are saved on this device. Refresh your account to retry sync." }
    }
    private func readDetails() async {
        do {
            let data = try await call(path: "/api/leaderboard/me")
            guard let json = String(data: data, encoding: .utf8), let result = NativePlayerRankings.companion.parse(json: json) else { throw AccountError("Rankings unreadable.") }
            rankings = result.rankings
        } catch { message = "Personal rankings unavailable. Refresh your account to try again." }
        do {
            let data = try await call(path: "/api/my-entitlements")
            purchases = try JSONDecoder().decode(PurchasesResponse.self, from: data).purchases
            purchasesLoaded = true
        } catch { message = "Purchase history unavailable. Refresh your account to try again." }
        if user != nil {
            do { try await syncProgress() }
            catch { message = "Achievements are saved on this device. Refresh your account to retry sync." }
        }
    }

    private func request(path: String, fields: [String: String]) async throws -> Data {
        guard let url = URL(string: "https://sim.ahousedividedgame.com/api/auth/\(path)") else {
            throw AccountError("Account service is unavailable")
        }
        var request = URLRequest(url: url)
        request.httpMethod = "POST"
        request.setValue("application/json", forHTTPHeaderField: "Content-Type")
        request.timeoutInterval = path.hasPrefix("/api/store/") ? 75 : 20
        request.httpBody = try JSONSerialization.data(withJSONObject: fields)
        let (data, response) = try await URLSession.shared.data(for: request)
        guard let http = response as? HTTPURLResponse else { throw AccountError("Could not reach account server") }
        guard (200..<300).contains(http.statusCode) else { throw AccountError(serverMessage(data)) }
        return data
    }

    private func serverMessage(_ data: Data) -> String {
        (try? JSONDecoder().decode(APIError.self, from: data).error) ?? "Account request failed"
    }

    private func tokenQuery() -> [String: Any] {
        [kSecClass as String: kSecClassGenericPassword,
         kSecAttrService as String: service,
         kSecAttrAccount as String: account]
    }

    private func readToken() -> String? {
        var query = tokenQuery()
        query[kSecReturnData as String] = true
        query[kSecMatchLimit as String] = kSecMatchLimitOne
        var result: CFTypeRef?
        guard SecItemCopyMatching(query as CFDictionary, &result) == errSecSuccess,
              let data = result as? Data else { return nil }
        return String(data: data, encoding: .utf8)
    }

    private func saveToken(_ token: String) throws {
        SecItemDelete(tokenQuery() as CFDictionary)
        var query = tokenQuery()
        query[kSecValueData as String] = Data(token.utf8)
        query[kSecAttrAccessible as String] = kSecAttrAccessibleAfterFirstUnlockThisDeviceOnly
        if SecItemAdd(query as CFDictionary, nil) != errSecSuccess {
            throw AccountError("Sign-in succeeded, but this device could not save the session.")
        }
    }
}

struct ScorePosting: View {
    @ObservedObject var session: GameSession
    @ObservedObject private var account: CampaignAccount
    @State private var showingAccount = false
    init(session: GameSession) { self.session = session; self.account = session.account }

    var body: some View {
        VStack(alignment: .leading, spacing: 10) {
        ResultJourneyCard(session: session)
        if let payload = session.scorePayload() {
            VStack(alignment: .leading, spacing: 8) {
                if session.isDaily() { Text("DAILY CHALLENGE · Best \(session.dailyBest() ?? 0) · \(session.dailyStreak())-day streak").font(.caption.bold()).foregroundStyle(CampaignStyle.gold) }
                if account.user == nil {
                    Button("Sign in to post your score") { showingAccount = true }
                } else {
                    Button(account.busy ? "Posting…" : session.isDaily() ? "Post daily score" : "Post to leaderboard") {
                        Task { await account.postScore(payload: payload, daily: session.isDaily()) }
                    }.disabled(account.busy)
                }
                if let message = account.message { Text(message).font(.caption).foregroundStyle(CampaignStyle.muted) }
                if session.isDaily() { Button("Replay today's challenge") { session.openDaily(restart: true) } }
            }
            .sheet(isPresented: $showingAccount) {
                NavigationStack { AccountView(session: session).toolbar { ToolbarItem(placement: .topBarTrailing) { Button("Done") { showingAccount = false } } } }
            }
        }
        }
    }
}

struct AccountError: LocalizedError {
    let detail: String
    let status: Int?
    let conflict: Bool
    init(_ detail: String, status: Int? = nil, conflict: Bool = false) { self.detail = detail; self.status = status; self.conflict = conflict }
    var errorDescription: String? { detail }
}

struct ImageCreditsView: View {
    var body: some View {
        ScrollView {
            VStack(alignment: .leading, spacing: 12) {
                Text("Campaign photography").font(.title2.bold())
                Text("The U.S. Capitol and most election photos are public domain or CC0 images. The 2016 election photo is by Gage Skidmore, licensed CC BY-SA 3.0.")
                Link("2016 photo source", destination: URL(string: "https://commons.wikimedia.org/wiki/File:Hillary_Clinton_by_Gage_Skidmore_2.jpg")!)
                Link("CC BY-SA 3.0 license", destination: URL(string: "https://creativecommons.org/licenses/by-sa/3.0/")!)
            }
            .frame(maxWidth: .infinity, alignment: .leading)
            .padding(22)
        }
        .background(CampaignStyle.background)
    }
}
