import Foundation
import Combine

/// ViewModel for search functionality with suggestions
@MainActor
final class SearchViewModel: ObservableObject {
    @Published var query: String = ""
    @Published var suggestions: [SearchSuggestion] = []
    @Published var isShowingSuggestions = false
    @Published var recentSearches: [String] = []

    private let recentSearchesKey = "recentSearches"
    private let maxRecentSearches = 10
    private var cancellables = Set<AnyCancellable>()

    init() {
        loadRecentSearches()
        setupQueryObserver()
    }

    // MARK: - Query Observer

    private func setupQueryObserver() {
        $query
            .debounce(for: .milliseconds(150), scheduler: RunLoop.main)
            .removeDuplicates()
            .sink { [weak self] newQuery in
                self?.updateSuggestions(for: newQuery)
            }
            .store(in: &cancellables)
    }

    // MARK: - Suggestions

    private func updateSuggestions(for query: String) {
        guard !query.isEmpty else {
            suggestions = []
            isShowingSuggestions = false
            return
        }

        var newSuggestions: [SearchSuggestion] = []

        // Add type suggestions
        let typeKeywords = ["project", "task", "note"]
        for keyword in typeKeywords where keyword.hasPrefix(query.lowercased()) {
            newSuggestions.append(SearchSuggestion(
                text: keyword,
                type: .type,
                description: "Filter by \(keyword) type"
            ))
        }

        // Add operator suggestions
        let operators = ["and", "or", "not"]
        let lastWord = query.split(separator: " ").last.map(String.init) ?? query
        for op in operators where op.hasPrefix(lastWord.lowercased()) && lastWord != op {
            let suggestion = query.dropLast(lastWord.count) + op
            newSuggestions.append(SearchSuggestion(
                text: String(suggestion),
                type: .operator,
                description: "Boolean operator"
            ))
        }

        // Add tag suggestions if user is typing @
        if query.hasSuffix("@") || lastWord.hasPrefix("@") {
            let commonTags = ["done", "today", "priority", "due", "waiting", "next", "started"]
            for tag in commonTags {
                let tagQuery = lastWord.hasPrefix("@") ?
                    query.dropLast(lastWord.count) + "@\(tag)" :
                    query + tag
                newSuggestions.append(SearchSuggestion(
                    text: String(tagQuery),
                    type: .tag,
                    description: "Filter by @\(tag) tag"
                ))
            }
        }

        // Add recent searches that match
        for recent in recentSearches where recent.lowercased().contains(query.lowercased()) && recent != query {
            newSuggestions.append(SearchSuggestion(
                text: recent,
                type: .recent,
                description: "Recent search"
            ))
        }

        suggestions = Array(newSuggestions.prefix(8))
        isShowingSuggestions = !suggestions.isEmpty
    }

    // MARK: - Recent Searches

    private func loadRecentSearches() {
        recentSearches = UserDefaults.standard.stringArray(forKey: recentSearchesKey) ?? []
    }

    func addToRecentSearches(_ search: String) {
        let trimmed = search.trimmingCharacters(in: .whitespaces)
        guard !trimmed.isEmpty else { return }

        // Remove if already exists
        recentSearches.removeAll { $0 == trimmed }

        // Add at beginning
        recentSearches.insert(trimmed, at: 0)

        // Limit count
        if recentSearches.count > maxRecentSearches {
            recentSearches = Array(recentSearches.prefix(maxRecentSearches))
        }

        // Persist
        UserDefaults.standard.set(recentSearches, forKey: recentSearchesKey)
    }

    func clearRecentSearches() {
        recentSearches = []
        UserDefaults.standard.removeObject(forKey: recentSearchesKey)
    }

    // MARK: - Selection

    func selectSuggestion(_ suggestion: SearchSuggestion) {
        query = suggestion.text
        isShowingSuggestions = false
    }

    func clearQuery() {
        query = ""
        suggestions = []
        isShowingSuggestions = false
    }

    func submitSearch() {
        addToRecentSearches(query)
        isShowingSuggestions = false
    }
}

// MARK: - Search Suggestion

/// A search suggestion displayed to the user
struct SearchSuggestion: Identifiable, Equatable {
    let id = UUID()
    let text: String
    let type: SuggestionType
    let description: String

    enum SuggestionType {
        case tag
        case type
        case `operator`
        case recent
    }

    var icon: String {
        switch type {
        case .tag: return "tag"
        case .type: return "doc.text"
        case .operator: return "function"
        case .recent: return "clock"
        }
    }
}
