import SwiftUI
import shared

struct ResultJourneyCard: View {
    @ObservedObject var session: GameSession
    @ObservedObject private var account: CampaignAccount
    init(session: GameSession) { self.session = session; self.account = session.account }

    var body: some View {
        if let journey = session.resultJourney() {
            VStack(alignment: .leading, spacing: 10) {
                if journey.daily && journey.score >= 0 {
                    Text("DAILY · \(nativeUTCDay()) · \(journey.score) / 1000").font(.headline).foregroundStyle(CampaignStyle.gold)
                    if account.boardKey == "daily:\(nativeUTCDay())",
                       let percentile = NativeResultsJourney.companion.percentile(score: journey.score,
                        boardScores: account.board.map { KotlinInt(int: Int32($0.score)) }, rank: account.dailyRank.map { KotlinInt(int: Int32($0.rank)) }) {
                        Text("Top \(percentile)% vs today's board").font(.subheadline)
                        if let rank = account.dailyRank { Text("Rank #\(rank.rank)").font(.caption) }
                    }
                    Button("Refresh daily ranking") { Task { await account.loadBoard(date: nativeUTCDay()) } }
                }
                ShareLink(item: journey.shareText) { Label("Share campaign result", systemImage: "square.and.arrow.up") }
                if let next = journey.next {
                    Text("NEXT CAMPAIGN").font(.caption.bold()).foregroundStyle(CampaignStyle.gold)
                    Text(next.label).font(.headline)
                    Text(next.blurb).font(.caption).foregroundStyle(CampaignStyle.muted)
                    Button("Play \(next.electionId)") { session.playNextCampaign() }.buttonStyle(.borderedProminent)
                }
            }
            .padding(16).frame(maxWidth: .infinity, alignment: .leading)
            .background(CampaignStyle.card, in: RoundedRectangle(cornerRadius: 14))
            .task(id: "\(journey.shareText):\(account.user?.id ?? "guest")") {
                if journey.daily { await account.loadBoard(date: nativeUTCDay()) }
            }
        }
    }
}

struct AccountBoardsView: View {
    @ObservedObject var account: CampaignAccount
    @State private var selected = "champions"
    @State private var boardCountry = "US"
    private var kind: Binding<String> {
        Binding(get: { ["champions", "daily"].contains(selected) ? selected : "election" },
                set: { value in
                    selected = value == "election" ? (MobileCampaign.companion.elections(countryId: boardCountry).first?.scenarioId ?? "daily") : value
                })
    }
    @State private var date = nativeUTCDay()
    private var dateValid: Bool { date.range(of: "^[0-9]{4}-[0-9]{2}-[0-9]{2}$", options: .regularExpression) != nil }
    var body: some View {
        ScrollView {
            VStack(alignment: .leading, spacing: 14) {
                Picker("Board", selection: kind) {
                    Text("Daily champions").tag("champions")
                    Text("Daily challenge").tag("daily")
                    Text("One election").tag("election")
                }.pickerStyle(.menu)
                if kind.wrappedValue == "election" {
                    Picker("Country", selection: $boardCountry) {
                        ForEach(MobileCampaign.companion.countries(), id: \.id) { Text("\($0.flag) \($0.name)").tag($0.id) }
                    }.pickerStyle(.menu)
                    Picker("Election", selection: $selected) {
                        ForEach(MobileCampaign.companion.elections(countryId: boardCountry), id: \.scenarioId) { Text($0.label).tag($0.scenarioId) }
                    }.pickerStyle(.menu)
                }
                if selected == "daily" {
                    TextField("Daily date (YYYY-MM-DD, UTC)", text: $date).textInputAutocapitalization(.never).textFieldStyle(.roundedBorder)
                    if !dateValid { Text("Enter a UTC date as YYYY-MM-DD.").font(.caption).foregroundStyle(CampaignStyle.coral) }
                }
                if selected == "champions" {
                    if let table = account.champions {
                        Text("\(table.totalDays) days played").font(.subheadline)
                        if table.entries.isEmpty {
                            VStack(alignment: .leading, spacing: 6) {
                                Text("No daily champions yet.").font(.headline)
                                Text("Finish a daily challenge to join the board.").font(.caption).foregroundStyle(CampaignStyle.muted)
                            }
                            .padding(16).frame(maxWidth: .infinity, alignment: .leading)
                            .background(CampaignStyle.card, in: RoundedRectangle(cornerRadius: 12))
                        }
                        ForEach(table.entries, id: \.rank) { entry in
                            VStack(alignment: .leading, spacing: 4) {
                                Text("#\(entry.rank) \(entry.username)").font(.headline)
                                Text("\(entry.wins) wins · \(entry.podiums) podiums · \(entry.played) played · \(entry.totalScore) points").font(.caption)
                            }.padding(14).frame(maxWidth: .infinity, alignment: .leading)
                                .background(CampaignStyle.card, in: RoundedRectangle(cornerRadius: 12))
                        }
                    } else {
                        HStack(spacing: 10) {
                            ProgressView().tint(CampaignStyle.gold)
                            Text("Loading champions…").font(.subheadline).foregroundStyle(CampaignStyle.muted)
                        }
                        .frame(maxWidth: .infinity, alignment: .leading)
                    }
                } else {
                    if let rank = account.dailyRank { Text("Your daily rank: #\(rank.rank) · \(rank.score)").foregroundStyle(CampaignStyle.gold) }
                    if account.board.isEmpty { Text("No scores to show yet. You can keep playing offline.").font(.caption) }
                    ForEach(account.board, id: \.rank) { entry in Text("#\(entry.rank) \(entry.username) · \(entry.score)") }
                }
                Button("Refresh leaderboard") { Task { await refresh() } }
                if let message = account.message { Text(message).font(.caption).foregroundStyle(CampaignStyle.coral) }
            }.padding(20).frame(maxWidth: .infinity, alignment: .leading)
        }
        .task(id: "\(selected):\(date):\(account.user?.id ?? "guest")") { await refresh() }
        .onChange(of: boardCountry) { country in
            if kind.wrappedValue == "election" { selected = MobileCampaign.companion.elections(countryId: country).first?.scenarioId ?? "daily" }
        }
        .background(CampaignStyle.background).preferredColorScheme(.dark)
    }
    private func refresh() async {
        if selected == "champions" { await account.loadChampions() }
        else if dateValid { await account.loadBoard(date: date, scenarioId: selected == "daily" ? nil : selected) }
    }
}
