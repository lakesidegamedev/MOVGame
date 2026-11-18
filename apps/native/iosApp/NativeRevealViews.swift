import SwiftUI
import shared

struct NativeElectionNightView: View {
    @ObservedObject var session: GameSession
    let night: NativeElectionNight
    private let data: NativeRevealData
    private let timeline: ElectionNightTimeline
    @Environment(\.accessibilityReduceMotion) private var systemReducedMotion
    @Environment(\.sizeCategory) private var sizeCategory
    @Environment(\.scenePhase) private var scenePhase
    @AppStorage("mov_reduce_motion") private var reducedMotion = false
    @State private var minute: Int
    @State private var speed = 1
    @State private var paused = false
    @State private var counties: CountySelection?

    private struct CountySelection: Identifiable {
        let id: String
        let name: String
        let returns: [ElectionCountyReturns.Return]
        let closes: Int
    }

    init(session: GameSession, night: NativeElectionNight) {
        self.session = session
        self.night = night
        let data = night.data()
        self.data = data
        let timeline = ElectionNightTimeline(country: night.countryCode().lowercased(), contests: data.units.map {
            ElectionNightTimeline.Contest(id: $0.id, margin: $0.margin)
        })
        self.timeline = timeline
        _minute = State(initialValue: timeline.start)
    }

    private var finished: Bool { minute >= timeline.end }
    private var willTick: Bool { !paused && !finished && scenePhase == .active }
    private var stateChoices: [NativeRevealUnit] {
        data.units.filter { !$0.id.contains("-") || $0.id.hasSuffix("-AL") }.sorted { $0.name < $1.name }
    }

    var body: some View {
        let calls = timeline.calls.prefix { $0.minute <= minute }
        let board = night.reportingBoard(calledIds: calls.map(\.id), finished: finished)
        ScrollView {
            VStack(alignment: .leading, spacing: 16) {
                header
                tally(board)
                mapPanel(board)
                callFeed(Array(calls.suffix(8).reversed()), board: board)
            }
            .frame(maxWidth: 760)
            .padding(18)
            .frame(maxWidth: .infinity)
        }
        .background(CampaignStyle.background)
        .preferredColorScheme(.dark)
        .safeAreaInset(edge: .bottom, spacing: 0) { playback }
        .task(id: willTick) {
            while willTick && !Task.isCancelled {
                do { try await Task.sleep(for: .milliseconds(400)) } catch { return }
                guard !Task.isCancelled else { return }
                minute = min(timeline.end, minute + speed * 5)
            }
        }
        .onAppear(perform: prepare)
        .sheet(item: $counties) { selection in
            ElectionCountyView(name: selection.name, returns: selection.returns,
                               demName: board.rows.first { $0.id == "dem" }?.name ?? "Democrat",
                               repName: board.rows.first { $0.id == "rep" }?.name ?? "Republican",
                               demColor: partyColor("dem"), repColor: partyColor("rep"),
                               minute: $minute, closes: selection.closes)
                .environment(\.sizeCategory, sizeCategory)
        }
        .interactiveDismissDisabled()
    }

    private var header: some View {
        ViewThatFits(in: .horizontal) {
            HStack(alignment: .top) {
                electionTitle
                Spacer(minLength: 16)
                clock
            }
            VStack(alignment: .leading, spacing: 10) {
                electionTitle
                clock
            }
        }
    }

    private var electionTitle: some View {
        VStack(alignment: .leading, spacing: 5) {
            Text("Election night")
                .font(.title.bold())
                .accessibilityAddTraits(.isHeader)
            Text(data.title.replacingOccurrences(of: "Election Night · ", with: ""))
                .font(.subheadline).foregroundStyle(CampaignStyle.muted)
        }
        .fixedSize(horizontal: false, vertical: true)
    }

    private var clock: some View {
        VStack(alignment: .leading, spacing: 4) {
            Text(ElectionNightTimeline.clock(minute))
                .font(.title3.monospacedDigit().weight(.semibold))
            Text(timeline.clockNote)
                .font(.caption).foregroundStyle(CampaignStyle.muted)
        }
        .accessibilityElement(children: .combine)
    }

    private func tally(_ board: NativeRevealBoard) -> some View {
        VStack(alignment: .leading, spacing: 10) {
            Text(timeline.isUS ? "Electoral votes" : "Seat count").font(.headline)
                .accessibilityAddTraits(.isHeader)
            ForEach(board.rows, id: \.id) { row in
                let tint = Color(hex: row.color)
                VStack(spacing: 5) {
                    HStack(alignment: .firstTextBaseline) {
                        Text(row.name).fontWeight(.medium)
                        Spacer()
                        Text(String(row.units)).fontWeight(.semibold).monospacedDigit()
                    }
                    .accessibilityElement(children: .combine)
                    ProgressView(value: Double(row.units), total: Double(max(1, data.totalUnits)))
                        .tint(tint).accessibilityHidden(true)
                }
                .font(.subheadline)
            }
            Divider()
            Text("\(board.calledUnits) of \(data.totalUnits) \(data.unitLabel) called · \(data.goalLabel())")
                .font(.footnote).foregroundStyle(CampaignStyle.muted)
            if let projection = board.projection {
                Text(projection.replacingOccurrences(of: "PROJECTED: ", with: "Projected winner: "))
                    .font(.subheadline.weight(.semibold))
            } else if let next = timeline.nextClosingTimes.first(where: { $0 > minute }) {
                Text("Next poll close \(ElectionNightTimeline.clock(next))")
                    .font(.footnote).foregroundStyle(CampaignStyle.muted)
            }
        }
        .padding(14)
        .background(CampaignStyle.card, in: RoundedRectangle(cornerRadius: 12))
    }

    private func mapPanel(_ board: NativeRevealBoard) -> some View {
        VStack(alignment: .leading, spacing: 8) {
            ViewThatFits(in: .horizontal) {
                HStack {
                    mapTitle
                    Spacer()
                    if timeline.isUS { countyPicker }
                }
                VStack(alignment: .leading, spacing: 6) {
                    mapTitle
                    if timeline.isUS { countyPicker }
                }
            }
            RevealMapView(map: night.map(), called: board.called, isUS: timeline.isUS)
            ViewThatFits(in: .horizontal) {
                HStack(spacing: 12) { legend(board.rows) }
                VStack(alignment: .leading, spacing: 5) { legend(board.rows) }
            }
            .font(.caption)
        }
        .padding(14)
        .background(CampaignStyle.card, in: RoundedRectangle(cornerRadius: 12))
    }

    private var mapTitle: some View {
        Text(timeline.isUS ? "Electoral map" : "Results map")
            .font(.headline).accessibilityAddTraits(.isHeader)
    }

    private var countyPicker: some View {
        Menu {
            ForEach(stateChoices, id: \.id) { state in
                Button(state.name) { openCounties(state) }
            }
        } label: {
            Label("County returns", systemImage: "map")
                .font(.subheadline.weight(.semibold))
                .frame(minHeight: 44)
        }
        .tint(.primary)
    }

    private func callFeed(_ calls: [ElectionNightTimeline.Call], board: NativeRevealBoard) -> some View {
        let units = Dictionary(uniqueKeysWithValues: board.called.map { ($0.id, $0) })
        return VStack(alignment: .leading, spacing: 8) {
            Text("Latest calls").font(.headline).accessibilityAddTraits(.isHeader)
            if calls.isEmpty {
                Text("Waiting for the first results.").font(.subheadline).foregroundStyle(CampaignStyle.muted)
            }
            ForEach(calls, id: \.id) { call in
                if let unit = units[call.id] {
                    if timeline.isUS, let state = stateChoices.first(where: {
                        ElectionNightTimeline.stateID($0.id) == ElectionNightTimeline.stateID(unit.id)
                    }) {
                        Button { openCounties(state) } label: {
                            HStack {
                                callRow(call, unit: unit)
                                Image(systemName: "chevron.right").font(.caption).accessibilityHidden(true)
                            }
                            .frame(minHeight: 44)
                            .contentShape(Rectangle())
                        }
                        .buttonStyle(.plain)
                        .accessibilityHint("Opens county returns")
                    } else {
                        callRow(call, unit: unit)
                    }
                    Divider()
                }
            }
        }
        .padding(14)
        .background(CampaignStyle.card, in: RoundedRectangle(cornerRadius: 12))
    }

    private func callRow(_ call: ElectionNightTimeline.Call, unit: NativeRevealUnit) -> some View {
        HStack(alignment: .firstTextBaseline, spacing: 10) {
            Text(ElectionNightTimeline.clock(call.minute)).font(.caption.monospacedDigit())
                .foregroundStyle(CampaignStyle.muted)
            VStack(alignment: .leading, spacing: 3) {
                Text(unit.name).font(.subheadline.weight(.semibold))
                Text(unit.winnerShort).font(.footnote).foregroundStyle(CampaignStyle.muted)
            }
            Spacer(minLength: 0)
        }
        .accessibilityElement(children: .combine)
    }

    private var playback: some View {
        HStack(spacing: 10) {
            if finished {
                Button("View full results") { session.finishReveal() }
                    .buttonStyle(.borderedProminent)
            } else {
                Button {
                    paused.toggle()
                } label: {
                    Image(systemName: paused ? "play.fill" : "pause.fill")
                        .frame(minWidth: 30, minHeight: 36)
                }
                .accessibilityLabel(paused ? "Resume election night" : "Pause election night")

                Menu {
                    ForEach([1, 2, 4], id: \.self) { rate in
                        Button {
                            speed = rate
                        } label: {
                            if speed == rate { Label("\(rate)×", systemImage: "checkmark") }
                            else { Text("\(rate)×") }
                        }
                    }
                } label: {
                    Text("\(speed)×").monospacedDigit().frame(minWidth: 32, minHeight: 36)
                }
                .accessibilityLabel("Playback speed")
                .accessibilityValue("\(speed) times")
                Spacer()
                Button("Show all") { minute = timeline.end }
                    .accessibilityLabel("Show all returns")
            }
        }
        .buttonStyle(.bordered)
        .tint(.primary)
        .frame(maxWidth: 760)
        .padding(.horizontal, 18)
        .padding(.vertical, 8)
        .frame(maxWidth: .infinity)
        .background(CampaignStyle.background)
        .overlay(alignment: .top) { Divider() }
    }

    private func prepare() {
        #if targetEnvironment(simulator)
        let arguments = ProcessInfo.processInfo.arguments
        if arguments.contains(where: { $0.hasPrefix("--mov-capture-") && $0.contains("reveal") }) {
            paused = true
            minute = timeline.isUS ? 21 * 60 + 5 : timeline.start + (timeline.end - timeline.start) / 2
            if arguments.contains("--mov-capture-reveal-counties"), let pa = stateChoices.first(where: { $0.id == "PA" }) {
                openCounties(pa)
                if counties != nil { NSLog("MOV_COUNTY_RETURNS_READY") }
            }
            return
        }
        #endif
        if reducedMotion || systemReducedMotion { minute = timeline.end }
    }

    private func openCounties(_ state: NativeRevealUnit) {
        let stateID = ElectionNightTimeline.stateID(state.id)
        let close = timeline.closure(for: state.id)
        let finish = min(timeline.end, max(close + 105, timeline.callMinute(for: state.id) + 25))
        let share = 0.5 + (state.winnerId == "dem" ? state.margin : -state.margin) / 200
        let returns = ElectionCountyReturns.model(state: stateID, demShare: share, closes: close, finishes: finish,
                                                  seed: data.storageKey)
        guard !returns.isEmpty else { return }
        counties = CountySelection(id: stateID, name: state.id.hasSuffix("-AL") ? (stateID == "ME" ? "Maine" : "Nebraska") : state.name,
                                   returns: returns, closes: close)
    }

    private func partyColor(_ id: String) -> Color {
        data.parties.first { $0.id == id }.map { Color(hex: $0.color) } ?? .gray
    }

    @ViewBuilder
    private func legend(_ rows: [NativeRevealTally]) -> some View {
        ForEach(Array(rows.prefix(5)), id: \.id) { row in legendDot(row.name, color: Color(hex: row.color)) }
        legendDot("Uncalled", color: Color(hex: "#283649"))
    }

    private func legendDot(_ label: String, color: Color) -> some View {
        HStack(spacing: 5) {
            Circle().fill(color).frame(width: 8, height: 8).accessibilityHidden(true)
            Text(label).foregroundStyle(CampaignStyle.muted)
        }
    }
}

private struct RevealMapView: View {
    let map: NativeMap
    let called: [NativeRevealUnit]
    let isUS: Bool

    var body: some View {
        Canvas { context, size in
            let factor = min(size.width / map.width, size.height / map.height)
            let left = (size.width - map.width * factor) / 2
            let top = (size.height - map.height * factor) / 2
            let byId = Dictionary(uniqueKeysWithValues: called.map { ($0.id, $0) })
            for shape in map.shapes {
                var path = Path()
                for polygon in shape.polygons {
                    for (index, point) in polygon.points.enumerated() {
                        let at = CGPoint(x: left + point.x * factor, y: top + point.y * factor)
                        if index == 0 { path.move(to: at) } else { path.addLine(to: at) }
                    }
                    path.closeSubpath()
                }
                let color = byId[shape.id].map { Color(hex: $0.winnerColor) } ?? Color(hex: "#283649")
                context.fill(path, with: .color(color))
                context.stroke(path, with: .color(CampaignStyle.background), lineWidth: 1)
                if isUS {
                    let label = shape.id.replacingOccurrences(of: "-AL", with: "")
                    let text = Text(label).font(.system(size: 9, weight: .semibold)).foregroundStyle(.white)
                    context.draw(text, at: CGPoint(x: path.boundingRect.midX, y: path.boundingRect.midY))
                }
            }
        }
        .frame(height: 210)
        .accessibilityLabel("Election map, \(called.count) races called")
    }
}
