import SwiftUI

struct ElectionCountyReturns {
    struct County: Decodable, Identifiable {
        let id: String
        let name: String
        let population: Int
        let rings: [[Int]]
    }

    struct Return: Identifiable {
        let county: County
        let minute: Int
        let demShare: Double
        var id: String { county.id }
    }

    static let countiesByState: [String: [County]] = {
        guard let url = Bundle.main.url(forResource: "usCounties", withExtension: "json"),
              let data = try? Data(contentsOf: url) else { return [:] }
        return (try? JSONDecoder().decode([String: [County]].self, from: data)) ?? [:]
    }()

    static func model(state: String, demShare: Double, closes: Int, finishes: Int, seed: String) -> [Return] {
        guard let counties = countiesByState[state], let largest = counties.map(\.population).max() else { return [] }
        let weight = Double(counties.reduce(0) { $0 + $1.population })
        // Center local variation so the population-weighted returns reconcile to the game result.
        let offsets = counties.map { county in
            let population = Double(county.population) / Double(largest)
            let noise = Double(jitter(seed, county.id, "share") % 1001) / 1000 - 0.5
            return 0.24 * sqrt(population) + 0.22 * noise
        }
        let average = zip(counties, offsets).reduce(0.0) { $0 + Double($1.0.population) * $1.1 } / weight
        let low = abs((offsets.min() ?? average) - average)
        let high = abs((offsets.max() ?? average) - average)
        let spread = min(1, low > 0 ? demShare / low : 1, high > 0 ? (1 - demShare) / high : 1)
        return zip(counties, offsets).map { county, offset in
            let fraction = Double(jitter(seed, county.id, "time") % 101) / 100
            return Return(county: county, minute: closes + 3 + Int(Double(finishes - closes - 3) * fraction),
                          demShare: min(1, max(0, demShare + spread * (offset - average))))
        }.sorted { ($0.minute, $0.county.name) < ($1.minute, $1.county.name) }
    }

    private static func jitter(_ seed: String, _ id: String, _ salt: String) -> Int {
        let key = "\(seed)|\(id)|\(salt)"
        return ElectionNightTimeline.stableNumber(key) ^ ElectionNightTimeline.stableNumber(String(key.reversed()))
    }
}

struct ElectionCountyView: View {
    let name: String
    let returns: [ElectionCountyReturns.Return]
    let demName: String
    let repName: String
    let demColor: Color
    let repColor: Color
    @Binding var minute: Int
    let closes: Int

    @Environment(\.dismiss) private var dismiss
    @State private var search = ""

    private var reporting: [ElectionCountyReturns.Return] { returns.filter { $0.minute <= minute } }

    var body: some View {
        NavigationStack {
            ScrollView {
                VStack(alignment: .leading, spacing: 14) {
                    Text(minute < closes ? "Polls close at \(ElectionNightTimeline.clock(closes)) ET" :
                            "\(reporting.count) of \(returns.count) reporting · \(ElectionNightTimeline.clock(minute)) ET")
                        .font(.headline.monospacedDigit())
                    countyMap
                    Text("Simulated returns on 2025 county boundaries.")
                        .font(.footnote).foregroundStyle(CampaignStyle.muted)
                    TextField("Find a county", text: $search)
                        .textFieldStyle(.roundedBorder)
                        .autocorrectionDisabled()
                    countyList
                }
                .frame(maxWidth: 660)
                .padding(18)
                .frame(maxWidth: .infinity)
            }
            .background(CampaignStyle.background)
            .navigationTitle(name)
            .navigationBarTitleDisplayMode(.inline)
            .toolbar {
                ToolbarItem(placement: .topBarTrailing) { Button("Done") { dismiss() } }
            }
        }
    }

    private var countyMap: some View {
        Canvas { context, size in
            let xMax = returns.flatMap { $0.county.rings }.compactMap { ring in
                stride(from: 0, to: ring.count, by: 2).map { ring[$0] }.max()
            }.max() ?? 10000
            let yMax = returns.flatMap { $0.county.rings }.compactMap { ring in
                stride(from: 1, to: ring.count, by: 2).map { ring[$0] }.max()
            }.max() ?? 10000
            let scale = min((size.width - 20) / Double(max(1, xMax)), (size.height - 20) / Double(max(1, yMax)))
            let left = (size.width - Double(xMax) * scale) / 2
            let top = (size.height - Double(yMax) * scale) / 2
            for row in returns {
                var path = Path()
                for ring in row.county.rings {
                    for idx in stride(from: 0, to: ring.count - 1, by: 2) {
                        let point = CGPoint(x: left + Double(ring[idx]) * scale, y: top + Double(ring[idx + 1]) * scale)
                        if idx == 0 { path.move(to: point) } else { path.addLine(to: point) }
                    }
                    path.closeSubpath()
                }
                let color = row.minute > minute
                    ? Color(hex: "#2a394b") : row.demShare >= 0.5 ? demColor : repColor
                context.fill(path, with: .color(color), style: FillStyle(eoFill: true))
                context.stroke(path, with: .color(CampaignStyle.background), lineWidth: 0.6)
            }
        }
        .frame(height: 210)
        .background(CampaignStyle.card, in: RoundedRectangle(cornerRadius: 12))
        .accessibilityLabel("County map of \(name)")
    }

    private var countyList: some View {
        let filtered = returns.filter { search.isEmpty || $0.county.name.localizedCaseInsensitiveContains(search) }
        return LazyVStack(alignment: .leading, spacing: 0) {
            if filtered.isEmpty { Text("No matching counties").foregroundStyle(CampaignStyle.muted) }
            ForEach(filtered) { row in
                HStack(alignment: .firstTextBaseline) {
                    Text(row.county.name)
                    Spacer(minLength: 8)
                    if row.minute <= minute {
                        let leader = row.demShare >= 0.5 ? demName : repName
                        let share = max(row.demShare, 1 - row.demShare)
                        Text("\(leader) \(share.formatted(.percent.precision(.fractionLength(1))))")
                            .multilineTextAlignment(.trailing)
                    } else {
                        Text("Awaiting return").foregroundStyle(CampaignStyle.muted)
                    }
                }
                .font(.subheadline.monospacedDigit())
                .padding(.vertical, 10)
                .accessibilityElement(children: .combine)
                Divider()
            }
        }
    }
}
