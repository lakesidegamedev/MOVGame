import Foundation

struct ElectionNightTimeline {
    struct Contest {
        let id: String
        let margin: Double
    }

    struct Call {
        let id: String
        let minute: Int
    }

    let country: String
    let start: Int
    let end: Int
    let calls: [Call]
    private let closures: [String: Int]

    var isUS: Bool { country == "us" }
    var clockNote: String {
        switch country {
        case "us": "Eastern time · 2024 poll schedule"
        case "uk": "UK local time · Polls close at 10 PM"
        default: "Simulated local time"
        }
    }

    init(country: String, contests: [Contest]) {
        self.country = country
        let closeMinutes = contests.map { contest -> (String, Int) in
            let minute: Int
            switch country {
            case "us": minute = Self.usClosures[Self.stateID(contest.id)] ?? 20 * 60
            case "uk": minute = 22 * 60
            default: minute = 20 * 60
            }
            return (contest.id, minute)
        }
        let byID = Dictionary(uniqueKeysWithValues: closeMinutes)
        closures = byID
        start = (country == "us" ? 18 * 60 : (closeMinutes.map(\.1).min() ?? 20 * 60)) - 5
        let scheduled = contests.map { contest in
            let close = byID[contest.id] ?? 20 * 60
            let jitter = Self.stableNumber(contest.id) % 25
            let competitiveness = max(0, 18 - contest.margin)
            let delay = 4 + Int(competitiveness * competitiveness / 2.6) + jitter
            return Call(id: contest.id, minute: close + delay)
        }.sorted { ($0.minute, $0.id) < ($1.minute, $1.id) }
        calls = scheduled
        end = max((scheduled.last?.minute ?? start) + 5,
                  (closeMinutes.map(\.1).max() ?? start) + (country == "us" ? 115 : 10))
    }

    func closure(for id: String) -> Int { closures[id] ?? start }

    func callMinute(for id: String) -> Int { calls.first { $0.id == id }?.minute ?? end }

    var nextClosingTimes: [Int] { Set(closures.values).sorted() }

    static func stateID(_ id: String) -> String { String(id.prefix(2)).uppercased() }

    static func stableNumber(_ value: String) -> Int {
        value.utf8.reduce(0) { ($0 * 31 + Int($1)) % 1_000_003 }
    }

    static func clock(_ minute: Int) -> String {
        let time = minute % (24 * 60)
        let hour = time / 60
        return String(format: "%d:%02d %@", hour % 12 == 0 ? 12 : hour % 12, time % 60, hour < 12 ? "AM" : "PM")
    }

    // Latest scheduled statewide poll closure in the 2024 U.S. general election.
    // https://www.thegreenpapers.com/G24/closing.phtml?format=ec
    private static let usClosures: [String: Int] = {
        let byMinute = [
            19 * 60: "GA IN KY SC VA VT",
            19 * 60 + 30: "NC OH WV",
            20 * 60: "AL CT DC DE FL IL MA MD ME MO MS NH NJ OK PA RI TN",
            20 * 60 + 30: "AR",
            21 * 60: "AZ CO IA KS LA MI MN NE NM NY SD TX WI WY",
            22 * 60: "MT NV UT",
            23 * 60: "CA ID ND OR WA",
            24 * 60: "HI",
            25 * 60: "AK"
        ]
        return Dictionary(uniqueKeysWithValues: byMinute.flatMap { minute, states in
            states.split(separator: " ").map { (String($0), minute) }
        })
    }()
}
