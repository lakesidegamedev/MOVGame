import SwiftUI
import shared

private func nativePartyColor(_ hex: String) -> Color {
    let value = UInt32(hex.trimmingCharacters(in: CharacterSet(charactersIn: "#")), radix: 16) ?? 0x94a3b8
    return Color(red: Double((value >> 16) & 255) / 255,
                 green: Double((value >> 8) & 255) / 255, blue: Double(value & 255) / 255)
}

private func nativeActionName(_ serial: String) -> String { serial.replacingOccurrences(of: "_", with: " ").capitalized }

struct PlanBonusHints: View {
    let active: [PlanBonus]

    var body: some View {
        VStack(alignment: .leading, spacing: 6) {
            ForEach(active, id: \.id) { bonus in
                Text("\(bonus.name) +\(bonus.percent)%").font(.caption.bold()).foregroundStyle(CampaignStyle.gold)
            }
            DisclosureGroup("How to combine moves") {
                ForEach(MobileGame.companion.planBonusRecipes(), id: \.id) { bonus in
                    VStack(alignment: .leading, spacing: 3) {
                        Text("\(bonus.recipe) · +\(bonus.percent)%").font(.caption.bold())
                        Text(bonus.blurb).font(.caption).foregroundStyle(CampaignStyle.muted)
                    }.padding(.vertical, 4)
                }
            }.font(.caption)
        }
    }
}

private struct NativeCountryMapView: View {
    let map: NativeMap
    let regions: [NativeRegion]
    let selectedId: String
    let onSelect: (String) -> Void

    var body: some View {
        GeometryReader { geometry in
            let factor = min(geometry.size.width / map.width, geometry.size.height / map.height)
            let offsetX = (geometry.size.width - map.width * factor) / 2
            let offsetY = (geometry.size.height - map.height * factor) / 2
            let byId = Dictionary(uniqueKeysWithValues: regions.map { ($0.id, $0) })
            ZStack {
                ForEach(map.shapes, id: \.id) { shape in
                    let path = Path { path in
                        for polygon in shape.polygons {
                            guard let first = polygon.points.first else { continue }
                            path.move(to: CGPoint(x: first.x * factor + offsetX, y: first.y * factor + offsetY))
                            for point in polygon.points.dropFirst() {
                                path.addLine(to: CGPoint(x: point.x * factor + offsetX, y: point.y * factor + offsetY))
                            }
                            path.closeSubpath()
                        }
                    }
                    path.fill(nativePartyColor(byId[shape.id]?.color ?? "#94a3b8"))
                        .overlay(path.stroke(shape.id == selectedId ? Color.white : CampaignStyle.background,
                                             lineWidth: shape.id == selectedId ? 3 : 1))
                        .contentShape(path)
                        .onTapGesture { onSelect(shape.id) }
                        .accessibilityElement()
                        .accessibilityAddTraits(.isButton)
                        .accessibilityLabel("\(byId[shape.id]?.name ?? shape.id), \(byId[shape.id]?.winner ?? "") leads")
                        .accessibilityAction { onSelect(shape.id) }
                }
            }
        }
        .frame(height: 300)
    }
}

/// Election title without the leading "2024 · " year prefix.
/// "1 seat", "2 seats": singular when the count is one.
func nativeUnits(_ count: Int, _ plural: String) -> String {
    "\(count) \(count == 1 && plural.hasSuffix("s") ? String(plural.dropLast()) : plural)"
}

func nativeElectionTitle(_ label: String) -> String {
    guard let range = label.range(of: " · ") else { return label }
    return String(label[range.upperBound...])
}

/// Registry challenge rating colour: easy, medium, hard.
/// One line per difficulty, the same ladder the web setup describes.
func nativeDifficultyBlurb(_ difficulty: String) -> String {
    switch difficulty {
    case "easy": return "A head start sized to the race, a bigger war chest, and a sloppy opponent. Landslides are still a fight."
    case "hard": return "The real map, a lighter campaign, a ruthless opponent. Close races need a near-perfect run."
    default: return "The real map and a slightly stronger campaign than your rival's. Skill decides close races."
    }
}

func nativeChallengeColor(_ difficulty: String) -> Color {
    difficulty == "easy" ? Color(red: 0.37, green: 0.80, blue: 0.55) : difficulty == "hard" ? CampaignStyle.coral : CampaignStyle.gold
}

struct NativeBadge: View {
    let text: String
    let color: Color
    var body: some View {
        Text(text).font(.caption2.bold()).lineLimit(1)
            .padding(.horizontal, 7).padding(.vertical, 3)
            .foregroundStyle(color)
            .background(color.opacity(0.16), in: Capsule())
            .overlay(Capsule().strokeBorder(color.opacity(0.5), lineWidth: 1))
    }
}

/// One election the player opened from the library (or the daily challenge).
struct LibraryPick: Identifiable, Equatable {
    let countryId: String
    let electionId: String
    var role: String? = nil
    var seed: String? = nil
    var id: String { "\(countryId)-\(electionId)" }
}

private struct LibraryGroup: Identifiable {
    let country: NativeCountry
    let elections: [NativeElection]
    var id: String { country.id }
}

private enum LibraryEra: String, CaseIterable {
    case any, early, late20, early21, recent
    var title: String {
        switch self {
        case .any: return "Any era"
        case .early: return "1932 to 1979"
        case .late20: return "1980 to 1999"
        case .early21: return "2000 to 2014"
        case .recent: return "2015 on"
        }
    }
    func contains(_ year: Int) -> Bool {
        switch self {
        case .any: return true
        case .early: return year < 1980
        case .late20: return (1980...1999).contains(year)
        case .early21: return (2000...2014).contains(year)
        case .recent: return year >= 2015
        }
    }
}

/// Every country and election from the exported catalog, grouped by country,
/// with search and filters. Choosing an election opens its briefing.
struct NativeCampaignLibrary: View {
    @ObservedObject var session: GameSession
    @ObservedObject private var store: StoreKitAdapter
    @State private var query = ""
    @State private var access = "all"
    @State private var challenge = "any"
    @State private var era = LibraryEra.any
    @State private var expanded: Set<String> = []
    @State private var pick: LibraryPick?
    @Environment(\.dynamicTypeSize) private var dynamicTypeSize
    private let pendingPick: LibraryPick?
    private let catalog: [LibraryGroup] =
        MobileCampaign.companion.countries().map { LibraryGroup(country: $0, elections: MobileCampaign.companion.elections(countryId: $0.id)) }

    init(session: GameSession) {
        self.session = session
        self.store = session.store
        pendingPick = session.dailySetup.map { LibraryPick(countryId: $0.countryId, electionId: $0.electionId, role: $0.role, seed: $0.seed) }
            ?? session.libraryRequest
    }

    private var filtering: Bool { !query.trimmingCharacters(in: .whitespaces).isEmpty || access != "all" || challenge != "any" || era != .any }
    private var ownedScenarios: Set<String> {
        NativeCatalog.shared.ownedScenarios(ownedPacks: Array(store.owned)).union(store.accountScenarios)
    }

    private func matches(_ election: NativeElection, country: NativeCountry) -> Bool {
        if access == "free" && !election.free { return false }
        if access == "owned" && !ownedScenarios.contains(election.scenarioId) { return false }
        if challenge != "any" && election.difficulty != challenge { return false }
        if !era.contains(Int(election.year)) { return false }
        let words = query.lowercased().split(separator: " ").map(String.init)
        let haystack = "\(country.name) \(country.id) \(election.label) \(election.blurb)".lowercased()
        return words.allSatisfy { haystack.contains($0) }
    }

    var body: some View {
        let groups = catalog.compactMap { group -> LibraryGroup? in
            let shown = group.elections.filter { matches($0, country: group.country) }
            return shown.isEmpty ? nil : LibraryGroup(country: group.country, elections: shown)
        }
        let total = catalog.reduce(0) { $0 + $1.elections.count }
        let shownCount = groups.reduce(0) { $0 + $1.elections.count }
        let freeCount = catalog.flatMap { $0.elections }.filter { $0.free }.count
        ScrollView {
            LazyVStack(alignment: .leading, spacing: 12) {
                Text("CAMPAIGN LIBRARY").font(.caption.bold()).tracking(2).foregroundStyle(CampaignStyle.gold)
                if !dynamicTypeSize.isAccessibilitySize {
                    Text("Choose your election").font(.largeTitle.bold())
                }
                (Text("\(catalog.count) countries · \(total) elections · ").foregroundColor(CampaignStyle.muted)
                    + Text("\(freeCount) free").foregroundColor(CampaignStyle.gold))
                    .font(.subheadline)
                filters
                if filtering || !dynamicTypeSize.isAccessibilitySize {
                    Text(filtering ? "\(shownCount) of \(total) elections match" : "Tap a country to see its elections")
                        .font(.caption).foregroundStyle(CampaignStyle.muted)
                }
                if groups.isEmpty {
                    VStack(alignment: .leading, spacing: 8) {
                        Text(access == "owned" && ownedScenarios.isEmpty ? "You do not own a pack yet" : "No elections match").font(.headline)
                        Text(access == "owned" && ownedScenarios.isEmpty ? "Packs you buy on your Lakeside account show here. Every country has a free election under Free." : "Try another search or clear the filters.")
                            .font(.subheadline).foregroundStyle(CampaignStyle.muted)
                        Button("Clear filters") { query = ""; access = "all"; challenge = "any"; era = .any }
                            .font(.subheadline.bold()).foregroundStyle(CampaignStyle.gold)
                    }
                    .padding(16).frame(maxWidth: .infinity, alignment: .leading)
                    .background(CampaignStyle.card, in: RoundedRectangle(cornerRadius: 14))
                }
                ForEach(groups) { group in
                    countrySection(group.country, elections: group.elections,
                                   all: catalog.first { $0.country.id == group.country.id }?.elections ?? group.elections)
                }
            }
            .padding(20)
        }
        .scrollDismissesKeyboard(.interactively)
        .background(CampaignStyle.background).preferredColorScheme(.dark)
        .sheet(item: $pick) { chosen in
            NavigationStack {
                NativeElectionBriefing(session: session, store: store, pick: chosen) { pick = nil }
                    .toolbar { ToolbarItem(placement: .topBarTrailing) { Button("Close") { pick = nil } } }
                    .navigationBarTitleDisplayMode(.inline)
            }
            .dynamicTypeSize(dynamicTypeSize)
        }
        .onChange(of: session.libraryRequest) { request in
            guard let request else { return }
            session.libraryRequest = nil
            pick = request
        }
        .onAppear {
            session.dailySetup = nil
            session.libraryRequest = nil
            store.refresh()
            if let pendingPick {
                DispatchQueue.main.async { pick = pendingPick }
            }
            #if targetEnvironment(simulator)
            let arguments = ProcessInfo.processInfo.arguments
            if arguments.contains("--mov-capture-library-free") { access = "free" }
            if arguments.contains("--mov-capture-library-search") { query = "1948" }
            if arguments.contains("--mov-capture-library") { expanded = ["US"] }
            if arguments.contains("--mov-capture-locked-library") { expanded = ["UK"] }
            if arguments.contains("--mov-capture-locked-uk") {
                DispatchQueue.main.async { pick = LibraryPick(countryId: "UK", electionId: "1997") }
            }
            for (argument, countryId, party) in [("--mov-capture-briefing-es", "ES", "erc"), ("--mov-capture-briefing-in", "IN", ""), ("--mov-capture-briefing-us1948", "US", "")]
                where arguments.contains(argument) {
                let election = countryId == "US" ? "1948" : MobileCampaign.companion.elections(countryId: countryId).first?.nativeId ?? ""
                DispatchQueue.main.async { pick = LibraryPick(countryId: countryId, electionId: election, role: party.isEmpty ? nil : party) }
            }
            #endif
        }
    }

    private var filters: some View {
        VStack(alignment: .leading, spacing: 10) {
            HStack(spacing: 8) {
                Image(systemName: "magnifyingglass").foregroundStyle(CampaignStyle.muted).accessibilityHidden(true)
                TextField("Search country, year or candidate", text: $query)
                    .textInputAutocapitalization(.never).autocorrectionDisabled()
                    .submitLabel(.search)
                if !query.isEmpty {
                    Button { query = "" } label: { Image(systemName: "xmark.circle.fill").foregroundStyle(CampaignStyle.muted) }
                        .buttonStyle(.plain).accessibilityLabel("Clear search")
                }
            }
            .padding(12)
            .background(CampaignStyle.card, in: RoundedRectangle(cornerRadius: 12))
            Picker("Show", selection: $access) {
                Text("All").tag("all")
                Text("Free").tag("free")
                Text("Owned").tag("owned")
            }
            .pickerStyle(.segmented)
            .accessibilityLabel("Show elections")
            if dynamicTypeSize.isAccessibilitySize {
                Menu {
                    Picker("Challenge", selection: $challenge) {
                        Text("Any challenge").tag("any")
                        Text("Easy").tag("easy")
                        Text("Medium").tag("medium")
                        Text("Hard").tag("hard")
                    }
                    Picker("Era", selection: $era) {
                        ForEach(LibraryEra.allCases, id: \.self) { Text($0.title).tag($0) }
                    }
                } label: {
                    filterLabel(challenge == "any" && era == .any ? "Filters" : "Filters on", active: challenge != "any" || era != .any)
                }
                .accessibilityLabel("Challenge and era filters")
                .accessibilityValue("\(challenge == "any" ? "Any challenge" : challenge.capitalized), \(era.title)")
            } else {
                HStack(spacing: 8) { challengeMenu; eraMenu; Spacer(minLength: 0) }
            }
        }
    }

    private var challengeMenu: some View {
        Menu {
            Picker("Challenge", selection: $challenge) {
                Text("Any challenge").tag("any")
                Text("Easy").tag("easy")
                Text("Medium").tag("medium")
                Text("Hard").tag("hard")
            }
        } label: {
            filterLabel(challenge == "any" ? "Any challenge" : "\(challenge.capitalized) challenge", active: challenge != "any")
        }
        .accessibilityLabel("Challenge filter")
        .accessibilityValue(challenge == "any" ? "Any" : challenge.capitalized)
    }

    private var eraMenu: some View {
        Menu {
            Picker("Era", selection: $era) {
                ForEach(LibraryEra.allCases, id: \.self) { Text($0.title).tag($0) }
            }
        } label: {
            filterLabel(era.title, active: era != .any)
        }
        .accessibilityLabel("Era filter")
        .accessibilityValue(era.title)
    }

    private func filterLabel(_ title: String, active: Bool) -> some View {
        HStack(spacing: 6) {
            Text(title).font(.subheadline.bold()).lineLimit(1)
            Image(systemName: "chevron.down").font(.caption2.bold())
        }
        .foregroundStyle(active ? CampaignStyle.background : .white)
        .padding(.horizontal, 12).padding(.vertical, 9)
        .background(active ? CampaignStyle.gold : CampaignStyle.card, in: Capsule())
    }

    @ViewBuilder
    private func countrySection(_ country: NativeCountry, elections: [NativeElection], all: [NativeElection]) -> some View {
        let open = filtering || expanded.contains(country.id)
        let years = all.map { Int($0.year) }
        let packId = NativeCatalog.shared.country(id: country.id)?.packId ?? ""
        let owned = !packId.isEmpty && NativeAccess.shared.covers(packId: packId, ownedPacks: Array(store.owned))
        VStack(alignment: .leading, spacing: 0) {
            Button {
                if expanded.contains(country.id) { expanded.remove(country.id) } else { expanded.insert(country.id) }
            } label: {
                let badge = Group {
                    if owned { NativeBadge(text: "Owned", color: Color(red: 0.37, green: 0.80, blue: 0.55)) }
                    else if all.contains(where: { $0.free }) { NativeBadge(text: "\(all.filter { $0.free }.count) free", color: CampaignStyle.gold) }
                }
                let chevron = Image(systemName: open ? "chevron.up" : "chevron.down").font(.caption.bold()).foregroundStyle(CampaignStyle.muted)
                    .opacity(filtering ? 0 : 1)
                Group {
                    if dynamicTypeSize.isAccessibilitySize {
                        VStack(alignment: .leading, spacing: 6) {
                            HStack(spacing: 8) { badge; Spacer(minLength: 4); chevron }
                            Text("\(country.flag) \(country.name)").font(.headline).foregroundStyle(.white)
                            Text("\(all.count) elections · \(String(years.min() ?? 0)) to \(String(years.max() ?? 0))")
                                .font(.caption).foregroundStyle(CampaignStyle.muted)
                        }
                        .frame(maxWidth: .infinity, alignment: .leading)
                    } else {
                        HStack(alignment: .center, spacing: 12) {
                            Text(country.flag).font(.title2).accessibilityHidden(true)
                            VStack(alignment: .leading, spacing: 3) {
                                Text(country.name).font(.headline).foregroundStyle(.white)
                                Text("\(all.count) elections · \(String(years.min() ?? 0)) to \(String(years.max() ?? 0))")
                                    .font(.caption).foregroundStyle(CampaignStyle.muted)
                            }
                            Spacer(minLength: 6)
                            badge
                            chevron
                        }
                    }
                }
                .padding(14)
                .contentShape(Rectangle())
            }
            .buttonStyle(.plain)
            .accessibilityLabel("\(country.name), \(all.count) elections, \(owned ? "owned" : "\(all.filter { $0.free }.count) free")")
            .accessibilityHint(filtering ? "" : open ? "Hides its elections" : "Shows its elections")
            if open {
                Divider().overlay(CampaignStyle.background)
                ForEach(elections, id: \.scenarioId) { election in
                    electionRow(election, countryId: country.id)
                    if election.scenarioId != elections.last?.scenarioId { Divider().overlay(CampaignStyle.background).padding(.leading, 14) }
                }
            }
        }
        .background(CampaignStyle.card, in: RoundedRectangle(cornerRadius: 14))
    }

    private func electionRow(_ election: NativeElection, countryId: String) -> some View {
        let locked = session.lockedPack(country: countryId, nativeId: election.nativeId)
        return Button { pick = LibraryPick(countryId: countryId, electionId: election.nativeId) } label: {
            HStack(alignment: .firstTextBaseline, spacing: 12) {
                Text(String(election.year)).font(.subheadline.bold()).monospacedDigit().foregroundStyle(CampaignStyle.gold)
                VStack(alignment: .leading, spacing: 5) {
                    Text(nativeElectionTitle(election.label)).font(.subheadline.bold()).foregroundStyle(.white)
                        .multilineTextAlignment(.leading).fixedSize(horizontal: false, vertical: true)
                    HStack(spacing: 6) {
                        if election.free { NativeBadge(text: "Free", color: Color(red: 0.37, green: 0.80, blue: 0.55)) }
                        NativeBadge(text: election.difficulty.capitalized, color: nativeChallengeColor(election.difficulty))
                        if locked != nil { NativeBadge(text: "Locked", color: CampaignStyle.muted) }
                    }
                }
                Spacer(minLength: 4)
                Image(systemName: locked == nil ? "chevron.right" : "lock.fill").font(.caption.bold()).foregroundStyle(CampaignStyle.muted)
            }
            .padding(.horizontal, 14).padding(.vertical, 11)
            .frame(minHeight: 44)
            .contentShape(Rectangle())
        }
        .buttonStyle(.plain)
        .accessibilityElement(children: .ignore)
        .accessibilityLabel("\(election.year), \(nativeElectionTitle(election.label))\(election.free ? ", free" : ""), \(election.difficulty) challenge\(locked != nil ? ", locked" : "")")
        .accessibilityAddTraits(.isButton)
        .accessibilityHint("Opens the election briefing")
    }
}

/// The briefing for one election: what it is, how it is won, the side to
/// play and the campaign settings, with a single launch action.
struct NativeElectionBriefing: View {
    @ObservedObject var session: GameSession
    @ObservedObject var store: StoreKitAdapter
    let pick: LibraryPick
    let close: () -> Void
    @State private var partyId = ""
    @State private var difficulty = "normal"
    @State private var seed = String(Int(Date().timeIntervalSince1970))

    private var isUS: Bool { pick.countryId == "US" }
    private var election: NativeElection? {
        MobileCampaign.companion.elections(countryId: pick.countryId).first { $0.nativeId == pick.electionId }
    }
    private var country: NativeCountry? { MobileCampaign.companion.countries().first { $0.id == pick.countryId } }
    private var parties: [NativeParty] {
        isUS ? [] : MobileCampaign.companion.parties(countryId: pick.countryId, electionId: pick.electionId)
    }
    private var goalLine: String {
        if isUS {
            let rule = MobileGame.companion.electoralRule(scenarioId: pick.electionId)
            return "\(rule.majority) of \(rule.total) electoral votes to win"
        }
        return MobileCampaign.companion.goalLine(countryId: pick.countryId, electionId: pick.electionId) ?? ""
    }
    private var reach: NativeRegionalReach? {
        partyId.isEmpty ? nil : MobileCampaign.companion.regionalReach(countryId: pick.countryId, electionId: pick.electionId, partyId: partyId)
    }
    private var locked: String? { session.lockedPack(country: pick.countryId, nativeId: pick.electionId) }
    private var canLaunch: Bool { isUS || (!partyId.isEmpty && !seed.trimmingCharacters(in: .whitespaces).isEmpty) }

    var body: some View {
        ScrollView {
            if let election {
                VStack(alignment: .leading, spacing: 14) {
                    Text("\(country?.flag ?? "") \(country?.name.uppercased() ?? "")").font(.caption.bold()).tracking(1.5).foregroundStyle(CampaignStyle.gold)
                    Text(election.label).font(.title2.bold()).fixedSize(horizontal: false, vertical: true)
                    HStack(spacing: 6) {
                        if election.free { NativeBadge(text: "Free", color: Color(red: 0.37, green: 0.80, blue: 0.55)) }
                        else { NativeBadge(text: "\(nativePackName(election.packId)) pack", color: CampaignStyle.muted) }
                        NativeBadge(text: "\(election.difficulty.capitalized) challenge", color: nativeChallengeColor(election.difficulty))
                    }
                    Text(election.blurb).font(.subheadline).foregroundStyle(CampaignStyle.muted)
                        .fixedSize(horizontal: false, vertical: true)
                    HStack(alignment: .firstTextBaseline, spacing: 10) {
                        Image(systemName: "flag.checkered").foregroundStyle(CampaignStyle.gold).accessibilityHidden(true)
                        Text(goalLine).font(.subheadline.bold()).fixedSize(horizontal: false, vertical: true)
                    }
                    .padding(12).frame(maxWidth: .infinity, alignment: .leading)
                    .background(CampaignStyle.card, in: RoundedRectangle(cornerRadius: 12))
                    .accessibilityElement(children: .combine)
                    if !isUS {
                        Text("CHOOSE YOUR PARTY · \(parties.count)").font(.caption.bold()).tracking(1).foregroundStyle(CampaignStyle.gold)
                        VStack(spacing: 6) {
                            ForEach(parties, id: \.id) { party in partyRow(party) }
                        }
                        if let reach, let party = parties.first(where: { $0.id == partyId }) {
                            NativeRegionalPartyNote(party: party.name, reach: reach, unitName: "seats")
                        }
                        Text("DIFFICULTY").font(.caption.bold()).tracking(1).foregroundStyle(CampaignStyle.gold)
                        Picker("Difficulty", selection: $difficulty) {
                            ForEach(["easy", "normal", "hard"], id: \.self) { Text($0.capitalized).tag($0) }
                        }
                        .pickerStyle(.segmented)
                        Text(nativeDifficultyBlurb(difficulty)).font(.caption).foregroundStyle(CampaignStyle.muted)
                            .fixedSize(horizontal: false, vertical: true)
                        TextField("Campaign seed", text: $seed).textFieldStyle(.roundedBorder)
                            .textInputAutocapitalization(.never).autocorrectionDisabled()
                        Text("Use the same seed to replay the same campaign").font(.caption).foregroundStyle(CampaignStyle.muted)
                    } else {
                        Text("You choose the ticket, running mate and advisers on the next screen.")
                            .font(.subheadline).foregroundStyle(CampaignStyle.muted)
                    }
                }
                .padding(20)
            }
        }
        .safeAreaInset(edge: .bottom, spacing: 0) {
            Button(action: launch) {
                Text(locked != nil ? "Unlock with \(nativePackName(locked))" : isUS ? "Choose your presidential ticket" : canLaunch ? "Launch campaign" : "Choose a party")
                    .font(.headline).multilineTextAlignment(.center)
                    .frame(maxWidth: .infinity).padding(16)
            }
            .buttonStyle(.plain)
            .foregroundStyle(canLaunch || locked != nil ? CampaignStyle.background : CampaignStyle.muted)
            .background(canLaunch || locked != nil ? CampaignStyle.coral : CampaignStyle.card, in: RoundedRectangle(cornerRadius: 14))
            .disabled(!canLaunch && locked == nil)
            .padding(.horizontal, 20).padding(.vertical, 10)
            .background(CampaignStyle.background)
        }
        .background(CampaignStyle.background).preferredColorScheme(.dark)
        .onAppear {
            if let seed = pick.seed { self.seed = seed }
            if let role = pick.role, parties.contains(where: { $0.id == role }) { partyId = role }
            else if partyId.isEmpty { partyId = parties.first?.id ?? "" }
        }
    }

    private func partyRow(_ party: NativeParty) -> some View {
        let selected = party.id == partyId
        let regional = MobileCampaign.companion.regionalReach(countryId: pick.countryId, electionId: pick.electionId, partyId: party.id) != nil
        return Button { partyId = party.id } label: {
            HStack(spacing: 10) {
                RoundedRectangle(cornerRadius: 3).fill(nativePartyColor(party.color)).frame(width: 6, height: 34).accessibilityHidden(true)
                VStack(alignment: .leading, spacing: 2) {
                    Text(party.name).font(.subheadline.bold()).foregroundStyle(.white)
                    Text(party.leader).font(.caption).foregroundStyle(CampaignStyle.muted)
                }
                Spacer(minLength: 4)
                if regional { NativeBadge(text: "Regional", color: CampaignStyle.gold) }
                Image(systemName: selected ? "checkmark.circle.fill" : "circle")
                    .foregroundStyle(selected ? CampaignStyle.gold : CampaignStyle.muted).accessibilityHidden(true)
            }
            .padding(.horizontal, 12).padding(.vertical, 8)
            .frame(minHeight: 44)
            .background(selected ? CampaignStyle.gold.opacity(0.14) : CampaignStyle.card, in: RoundedRectangle(cornerRadius: 12))
            .overlay(RoundedRectangle(cornerRadius: 12).strokeBorder(selected ? CampaignStyle.gold : .clear, lineWidth: 1.5))
            .contentShape(Rectangle())
        }
        .buttonStyle(.plain)
        .accessibilityElement(children: .ignore)
        .accessibilityLabel("\(party.name), led by \(party.leader)\(regional ? ", regional party" : "")")
        .accessibilityValue("Charisma \(Int(party.charisma)), energy \(Int(party.energy)), competence \(Int(party.competence)), machine \(Int(party.machine))")
        .accessibilityAddTraits(.isButton)
        .accessibilityAddTraits(selected ? .isSelected : [])
    }

    private func launch() {
        if let pack = locked {
            close()
            DispatchQueue.main.asyncAfter(deadline: .now() + 0.4) { session.paywallPack = pack }
            return
        }
        guard canLaunch else { return }
        close()
        if isUS {
            session.setupScenarioId = pick.electionId
            session.playScreen = .setup
        } else {
            session.newCampaign(countryId: pick.countryId, electionId: pick.electionId, partyId: partyId,
                                difficulty: difficulty, seed: seed)
        }
    }
}

/// Regional party callout (web RegionalPartyBanner): where it stands, why it
/// cannot win, and what counts as success.
struct NativeRegionalPartyNote: View {
    let party: String
    let reach: NativeRegionalReach
    let unitName: String
    var body: some View {
        let names = reach.regionNames
        let where_ = names.count <= 1 ? names.joined() : names.dropLast().joined(separator: ", ") + " and " + (names.last ?? "")
        let one = unitName.hasSuffix("s") ? String(unitName.dropLast()) : unitName
        VStack(alignment: .leading, spacing: 6) {
            Text("REGIONAL PARTY").font(.caption.bold()).tracking(1).foregroundStyle(CampaignStyle.gold)
            Text("\(party) stands only in \(where_): \(reach.units) of \(reach.total) \(unitName), so it cannot win a majority or the most \(unitName). Success is beating its real result of \(reach.historical) \(reach.historical == 1 ? one : unitName) and ending with the votes a government needs.")
                .font(.subheadline).fixedSize(horizontal: false, vertical: true)
        }
        .padding(14).frame(maxWidth: .infinity, alignment: .leading)
        .background(CampaignStyle.gold.opacity(0.10), in: RoundedRectangle(cornerRadius: 12))
        .overlay(RoundedRectangle(cornerRadius: 12).strokeBorder(CampaignStyle.gold.opacity(0.5)))
        .accessibilityElement(children: .combine)
    }
}

private struct NativeStandingRows: View {
    let rows: [NativeStanding]
    let units: String
    var body: some View {
        ForEach(rows, id: \.partyId) { row in
            HStack(spacing: 8) {
                RoundedRectangle(cornerRadius: 3).fill(nativePartyColor(row.color)).frame(width: 14, height: 14)
                Text(row.name).font(.subheadline.bold())
                Spacer(minLength: 4)
                Text("\(nativeUnits(Int(row.units), units)) · \(String(format: "%.1f", row.voteShare * 100))%")
                    .font(.caption).monospacedDigit()
            }
            .padding(.vertical, 4)
        }
    }
}

struct NativeWorldCampaign: View {
    @ObservedObject var session: GameSession
    @State private var regionId = ""
    @State private var type = "broadcast"
    @State private var mode = "positive"
    @State private var spend = 1.5
    @State private var issueId = ""
    @State private var rival = ""
    @State private var day = 1
    @State private var confirmEmptyWeek = false
    @State private var showRecap = false
    @State private var notice: String?
    private let columns = [GridItem(.flexible()), GridItem(.flexible())]

    var body: some View {
        let _ = session.version
        if let game = session.campaign {
            ScrollView {
                VStack(alignment: .leading, spacing: 16) {
                    NativeCampaignCoach(country: game.countryId(), goal: game.goalText(), turn: Int(game.turn()), selected: regionId.isEmpty ? nil : regionId, queued: game.plan().count, settings: session.settings)
                    Text(game.label()).font(.title2.bold())
                    Text(game.isOver() ? "ELECTION RESULT" : "WEEK \(game.turn() + 1) OF \(game.totalTurns())")
                        .font(.caption.bold()).tracking(1).foregroundStyle(CampaignStyle.gold)
                    Text(game.goalText()).font(.subheadline).foregroundStyle(CampaignStyle.muted)
                    if let reach = game.regionalReach(), let me = game.standings().first(where: { $0.partyId == game.playerParty() }) {
                        if game.isOver() {
                            Text("\(me.name): \(me.units) \(game.unitName()) against \(reach.historical) in the real election")
                                .font(.headline).foregroundStyle(me.units > reach.historical ? Color(red: 0.37, green: 0.80, blue: 0.55) : me.units == reach.historical ? .white : CampaignStyle.coral)
                        }
                        NativeRegionalPartyNote(party: me.name, reach: reach, unitName: game.unitName())
                    }
                    if !game.isOver() { Button("Undo week", action: session.undo).disabled(!session.canUndo()) }
                    VStack(alignment: .leading, spacing: 8) {
                        Text(game.isOver() ? game.outcome() : "Projected standings").font(.headline)
                        NativeStandingRows(rows: game.standings(), units: game.unitName())
                        Text(game.goalLine())
                            .font(.caption).foregroundStyle(CampaignStyle.muted)
                    }.nativeCampaignCard()
                    if game.hasPendingEvent() { eventCard(game) }
                    if let notice { Text(notice).font(.subheadline).foregroundStyle(CampaignStyle.gold) }
                    Text(game.isOver() ? "REGIONAL RESULTS" : "REGIONAL PROJECTIONS")
                        .font(.caption.bold()).tracking(1).foregroundStyle(CampaignStyle.gold)
                    NativeCountryMapView(map: game.map(), regions: game.regions(), selectedId: regionId) { regionId = $0 }
                    LazyVGrid(columns: columns, spacing: 10) {
                        ForEach(game.regions(), id: \.id) { region in
                            Button { regionId = regionId == region.id ? "" : region.id } label: {
                                VStack(alignment: .leading, spacing: 6) {
                                    Text(region.name).font(.subheadline.bold()).foregroundStyle(.white)
                                    Text("\(region.winner) leads").font(.caption.bold()).foregroundStyle(nativePartyColor(region.color))
                                    Text("\(nativeUnits(Int(region.totalUnits), game.unitName())) in region").font(.caption)
                                    Text("You: \(region.playerUnits) · \(String(format: "%.1f", region.playerShare * 100))%")
                                        .font(.caption).monospacedDigit()
                                }
                                .frame(maxWidth: .infinity, minHeight: 96, alignment: .leading)
                                .padding(12).foregroundStyle(CampaignStyle.muted)
                                .background(CampaignStyle.card, in: RoundedRectangle(cornerRadius: 12))
                                .overlay(RoundedRectangle(cornerRadius: 12).stroke(regionId == region.id ? CampaignStyle.gold : .clear, lineWidth: 2))
                            }.buttonStyle(.plain)
                        }
                    }
                    if !regionId.isEmpty, let region = game.regions().first(where: { $0.id == regionId }) {
                        VStack(alignment: .leading, spacing: 8) {
                            Text(region.name).font(.headline)
                            NativeStandingRows(rows: game.regionStandings(regionId: regionId), units: game.unitName())
                        }.nativeCampaignCard()
                    }
                    if game.isOver() {
                        ScorePosting(session: session)
                        if game.isCustom() { Text("CUSTOM CAMPAIGN · CASUAL ONLY").font(.caption.bold()).foregroundStyle(CampaignStyle.gold) }
                        if let summary = game.resultSummary() {
                            VStack(alignment: .leading, spacing: 7) {
                                Text("CAMPAIGN SCORE \(summary.score) / 1000").font(.headline).foregroundStyle(CampaignStyle.gold)
                                Text("\(summary.difficulty.capitalized) difficulty · \(game.isPlurality() ? "Lead over the runner-up" : "\(game.unitName().capitalized) above majority"): \(summary.unitMargin)").font(.subheadline)
                                Text(String(format: "Vote margin vs. leading rival: %+.1f points", summary.popularMargin)).font(.subheadline)
                            }.nativeCampaignCard()
                        }
                        DisclosureGroup("Compare with history") {
                            ForEach(game.historicalRegions(), id: \.id) { region in
                                VStack(alignment: .leading, spacing: 3) {
                                    Text(region.name).font(.subheadline.bold())
                                    Text("\(region.units) \(game.unitName()) now · \(region.historicalUnits) historically")
                                    Text(String(format: "Vote share swing %+.1f points", region.shareSwing))
                                }.font(.caption).frame(maxWidth: .infinity, alignment: .leading).padding(.vertical, 4)
                            }
                        }
                        Text("WHAT DECIDED IT").font(.caption.bold()).foregroundStyle(CampaignStyle.gold)
                        ForEach(Array(game.resultCauses().enumerated()), id: \.offset) { _, cause in Text(cause).font(.subheadline) }
                        Button("Choose another campaign") { session.playScreen = .library }.buttonStyle(.borderedProminent)
                    } else {
                        planner(game)
                        ForEach(game.plan(), id: \.index) { action in
                            HStack(alignment: .top) {
                                VStack(alignment: .leading, spacing: 4) {
                                    Text("Day \(action.day) · \(action.title)").font(.subheadline.bold())
                                    Text("\(action.detail) · \(game.currency())\(String(format: "%.1f", action.cost))M")
                                        .font(.caption).foregroundStyle(CampaignStyle.muted)
                                }
                                Spacer(minLength: 4)
                                Button("Remove") { game.removeAction(index: action.index); session.touch() }.font(.caption)
                            }.nativeCampaignCard()
                        }
                        Button {
                            if game.plan().isEmpty { confirmEmptyWeek = true }
                            else if session.endWorldWeek() { showRecap = !game.recap().isEmpty }
                        } label: { Text("End week").font(.headline).frame(maxWidth: .infinity).padding(16) }
                            .buttonStyle(.plain).foregroundStyle(CampaignStyle.background)
                            .background(CampaignStyle.coral, in: RoundedRectangle(cornerRadius: 14))
                            .disabled(game.hasPendingEvent())
                    }
                    Text("CAMPAIGN NEWS").font(.caption.bold()).foregroundStyle(CampaignStyle.gold)
                    ForEach(Array(game.news().enumerated()), id: \.offset) { _, item in
                        Text("Week \(item.turn + 1) · \(item.text)").font(.caption).foregroundStyle(CampaignStyle.muted)
                    }
                }
                .padding(20)
            }
            .background(CampaignStyle.background).preferredColorScheme(.dark)
            .onChange(of: session.shortcutSequence) { _ in
                if session.shortcut == UIKeyCommand.inputEscape { showRecap = false; regionId = "" }
                guard !game.hasPendingEvent() && !game.isOver() && !showRecap else { return }
                if let number = Int(session.shortcut), number > 0 && number <= min(9, game.actionTypes().count) { type = game.actionTypes()[number - 1] }
                if ["\r", " "].contains(session.shortcut) {
                    if game.plan().isEmpty { confirmEmptyWeek = true }
                    else if session.endWorldWeek() { showRecap = !game.recap().isEmpty }
                }
            }
            .alert("End week without moves?", isPresented: $confirmEmptyWeek) {
                Button("End week", role: .destructive) { if session.endWorldWeek() { showRecap = !game.recap().isEmpty } }
                Button("Keep planning", role: .cancel) { }
            } message: { Text("You have no actions queued this week. Unspent slots win nothing. End the week anyway?") }
            .onAppear { if issueId.isEmpty { issueId = game.issues().first?.id ?? "" } }
            .sheet(isPresented: $showRecap) {
                NavigationStack {
                    ScrollView {
                        VStack(alignment: .leading, spacing: 14) {
                            ForEach(Array(game.recap().enumerated()), id: \.offset) { _, item in
                                VStack(alignment: .leading, spacing: 5) {
                                    Text(item.label).font(.headline)
                                    Text(item.detail).font(.subheadline).foregroundStyle(CampaignStyle.muted)
                                }.nativeCampaignCard()
                            }
                        }.padding(20)
                    }
                    .background(CampaignStyle.background).preferredColorScheme(.dark)
                    .navigationTitle("Week in review")
                    .toolbar { ToolbarItem(placement: .topBarTrailing) { Button("Continue") { showRecap = false } } }
                }
            }
        }
    }

    private func eventCard(_ game: MobileCampaign) -> some View {
        VStack(alignment: .leading, spacing: 12) {
            Text(game.eventTitle()).font(.headline)
            Text(game.eventPrompt()).font(.subheadline)
            ForEach(game.eventChoices(), id: \.id) { choice in
                Button {
                    if game.answerEvent(choiceId: choice.id) { notice = choice.resultText; session.touch() }
                } label: { Text(choice.text).frame(maxWidth: .infinity, alignment: .leading) }
                    .buttonStyle(.borderedProminent)
            }
        }.nativeCampaignCard()
    }

    private func planner(_ game: MobileCampaign) -> some View {
        let regional = ["rally", "surrogate", "ground_game", "gotv", "canvass"].contains(type)
        return VStack(alignment: .leading, spacing: 12) {
            Text("Plan your week").font(.title2.bold())
            Text("\(game.currency())\(String(format: "%.1f", game.funds()))M cash · \(game.slotsLeft()) moves left").font(.subheadline)
            Text("Planned \(game.currency())\(String(format: "%.1f", game.plannedSpend()))M · Available \(game.currency())\(String(format: "%.1f", game.availableFunds()))M")
                .font(.caption).foregroundStyle(CampaignStyle.muted)
            Text("Plan estimate: \(game.previewPlayerUnits()) \(game.unitName()) after your queued actions. Rival moves and events can change the result.")
                .font(.caption).foregroundStyle(CampaignStyle.gold)
            PlanBonusHints(active: game.planBonuses())
            Picker("Action", selection: $type) { ForEach(game.actionTypes(), id: \.self) { Text(nativeActionName($0)).tag($0) } }
            Picker("Target", selection: $regionId) {
                Text("National").tag("")
                ForEach(game.regions(), id: \.id) { Text($0.name).tag($0.id) }
            }
            if regional && regionId.isEmpty { Text("Choose a region for this action.").font(.caption).foregroundStyle(CampaignStyle.gold) }
            Picker("Day", selection: $day) { ForEach(1...7, id: \.self) { Text("Day \($0)").tag($0) } }
            if type == "broadcast" {
                Picker("Broadcast mode", selection: $mode) { ForEach(["positive", "contrast", "issue"], id: \.self) { Text($0.capitalized).tag($0) } }
                Text("Spend \(game.currency())\(String(format: "%.1f", spend))M").font(.subheadline)
                Slider(value: $spend, in: 0.5...10, step: 0.25)
                Text(regionId.isEmpty ? "National reaches every region where your party stands." : "Regional spending concentrates on this target.")
                    .font(.caption).foregroundStyle(CampaignStyle.muted)
            }
            if type == "issue_pivot" || (type == "broadcast" && mode == "issue") {
                Picker("Issue", selection: $issueId) {
                    ForEach(game.issues(), id: \.id) { Text("\($0.name) · \(String(format: "%.1f", $0.salience * 100))% salience").tag($0.id) }
                }
                if let issue = game.issues().first(where: { $0.id == issueId }) {
                    Text(issue.blurb).font(.caption).foregroundStyle(CampaignStyle.muted)
                }
            }
            if type == "oppo_research" || (type == "broadcast" && mode == "contrast") {
                Picker("Rival", selection: $rival) {
                    Text("Leading rival").tag("")
                    ForEach(game.rivals(), id: \.partyId) { Text($0.name).tag($0.partyId) }
                }
            }
            Button {
                let added = game.queue(type: type, regionId: regionId.isEmpty ? nil : regionId, day: Int32(day),
                    mode: type == "broadcast" ? mode : nil,
                    spend: type == "broadcast" ? KotlinDouble(double: spend) : nil,
                    issueId: type == "issue_pivot" || (type == "broadcast" && mode == "issue") ? issueId : nil,
                    targetParty: type == "oppo_research" || (type == "broadcast" && mode == "contrast") ? (rival.isEmpty ? nil : rival) : nil)
                if added { notice = nil; session.touch() }
                else { notice = "Check your target, cash, remaining moves, and the three-move daily limit." }
            } label: { Text("Add to plan").frame(maxWidth: .infinity) }
                .buttonStyle(.borderedProminent)
                .disabled(game.slotsLeft() == 0 || game.hasPendingEvent() || (regional && regionId.isEmpty))
        }
        .pickerStyle(.menu)
        .nativeCampaignCard()
    }
}

private extension View {
    func nativeCampaignCard() -> some View {
        self.padding(16).frame(maxWidth: .infinity, alignment: .leading)
            .background(CampaignStyle.card, in: RoundedRectangle(cornerRadius: 14))
    }
}
