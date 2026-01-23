import Foundation

/// Search engine for filtering TaskPaper items
/// Supports:
/// - Tag presence: @done
/// - Tag absence: not @done
/// - Tag value: @priority(1)
/// - Boolean: @work and not @done
/// - Type filters: project, task, note
enum SearchEngine {

    /// Filter items based on search query
    static func filter(items: [Item], query: String) -> [Item] {
        let trimmedQuery = query.trimmingCharacters(in: .whitespaces)
        guard !trimmedQuery.isEmpty else { return items }

        guard let predicate = parsePredicate(from: trimmedQuery) else {
            // Fall back to text search if parsing fails
            return filterByText(items: items, text: trimmedQuery)
        }

        return filterRecursively(items: items, predicate: predicate)
    }

    /// Filter items recursively, including children that match
    private static func filterRecursively(items: [Item], predicate: SearchPredicate) -> [Item] {
        items.compactMap { item -> Item? in
            let childMatches = filterRecursively(items: item.children, predicate: predicate)
            let selfMatches = predicate.matches(item)

            if selfMatches || !childMatches.isEmpty {
                let filteredItem = Item(
                    id: item.id,
                    text: item.text,
                    type: item.type,
                    indentLevel: item.indentLevel,
                    children: childMatches,
                    isExpanded: item.isExpanded
                )
                return filteredItem
            }

            return nil
        }
    }

    /// Simple text-based filter
    private static func filterByText(items: [Item], text: String) -> [Item] {
        let lowercasedText = text.lowercased()
        return items.compactMap { item -> Item? in
            let childMatches = filterByText(items: item.children, text: text)
            let selfMatches = item.text.lowercased().contains(lowercasedText)

            if selfMatches || !childMatches.isEmpty {
                let filteredItem = Item(
                    id: item.id,
                    text: item.text,
                    type: item.type,
                    indentLevel: item.indentLevel,
                    children: childMatches,
                    isExpanded: item.isExpanded
                )
                return filteredItem
            }

            return nil
        }
    }
}

// MARK: - Search Predicate

/// Represents a search condition
protocol SearchPredicate {
    func matches(_ item: Item) -> Bool
}

/// Tag presence predicate: @tagname
struct TagPresencePredicate: SearchPredicate {
    let tagName: String

    func matches(_ item: Item) -> Bool {
        item.hasTag(named: tagName)
    }
}

/// Tag value predicate: @tagname(value)
struct TagValuePredicate: SearchPredicate {
    let tagName: String
    let value: String

    func matches(_ item: Item) -> Bool {
        item.tagValue(for: tagName)?.lowercased() == value.lowercased()
    }
}

/// Type predicate: project, task, note
struct TypePredicate: SearchPredicate {
    let type: ItemType

    func matches(_ item: Item) -> Bool {
        item.type == type
    }
}

/// Text content predicate
struct TextPredicate: SearchPredicate {
    let text: String

    func matches(_ item: Item) -> Bool {
        item.text.lowercased().contains(text.lowercased())
    }
}

/// NOT predicate
struct NotPredicate: SearchPredicate {
    let inner: SearchPredicate

    func matches(_ item: Item) -> Bool {
        !inner.matches(item)
    }
}

/// AND predicate
struct AndPredicate: SearchPredicate {
    let left: SearchPredicate
    let right: SearchPredicate

    func matches(_ item: Item) -> Bool {
        left.matches(item) && right.matches(item)
    }
}

/// OR predicate
struct OrPredicate: SearchPredicate {
    let left: SearchPredicate
    let right: SearchPredicate

    func matches(_ item: Item) -> Bool {
        left.matches(item) || right.matches(item)
    }
}

// MARK: - Predicate Parsing

extension SearchEngine {

    /// Parse a search query into a predicate
    static func parsePredicate(from query: String) -> SearchPredicate? {
        var tokens = tokenize(query)
        return parseOrExpression(&tokens)
    }

    /// Tokenize the query string
    private static func tokenize(_ query: String) -> [String] {
        var tokens: [String] = []
        var current = ""
        var inParentheses = false
        var parenDepth = 0

        let chars = Array(query)
        var i = 0

        while i < chars.count {
            let char = chars[i]

            if char == "(" && current.hasPrefix("@") {
                // Start of tag value
                inParentheses = true
                current.append(char)
            } else if char == ")" && inParentheses {
                current.append(char)
                inParentheses = false
            } else if char == " " && !inParentheses {
                if !current.isEmpty {
                    tokens.append(current)
                    current = ""
                }
            } else {
                current.append(char)
            }

            i += 1
        }

        if !current.isEmpty {
            tokens.append(current)
        }

        return tokens
    }

    /// Parse OR expression (lowest precedence)
    private static func parseOrExpression(_ tokens: inout [String]) -> SearchPredicate? {
        guard var left = parseAndExpression(&tokens) else { return nil }

        while let token = tokens.first, token.lowercased() == "or" {
            tokens.removeFirst()
            guard let right = parseAndExpression(&tokens) else { return left }
            left = OrPredicate(left: left, right: right)
        }

        return left
    }

    /// Parse AND expression
    private static func parseAndExpression(_ tokens: inout [String]) -> SearchPredicate? {
        guard var left = parseNotExpression(&tokens) else { return nil }

        while let token = tokens.first, token.lowercased() == "and" {
            tokens.removeFirst()
            guard let right = parseNotExpression(&tokens) else { return left }
            left = AndPredicate(left: left, right: right)
        }

        return left
    }

    /// Parse NOT expression
    private static func parseNotExpression(_ tokens: inout [String]) -> SearchPredicate? {
        if let token = tokens.first, token.lowercased() == "not" {
            tokens.removeFirst()
            guard let inner = parsePrimaryExpression(&tokens) else { return nil }
            return NotPredicate(inner: inner)
        }
        return parsePrimaryExpression(&tokens)
    }

    /// Parse primary expression (highest precedence)
    private static func parsePrimaryExpression(_ tokens: inout [String]) -> SearchPredicate? {
        guard let token = tokens.first else { return nil }
        tokens.removeFirst()

        // Tag with value: @tagname(value)
        if token.hasPrefix("@") && token.contains("(") && token.contains(")") {
            return parseTagWithValue(token)
        }

        // Tag presence: @tagname
        if token.hasPrefix("@") {
            let tagName = String(token.dropFirst())
            return TagPresencePredicate(tagName: tagName)
        }

        // Type filter
        let lowercased = token.lowercased()
        if let type = ItemType(rawValue: lowercased) {
            return TypePredicate(type: type)
        }

        // Text search (fallback)
        return TextPredicate(text: token)
    }

    /// Parse a tag with value: @tagname(value)
    private static func parseTagWithValue(_ token: String) -> SearchPredicate? {
        guard let parenStart = token.firstIndex(of: "("),
              let parenEnd = token.lastIndex(of: ")") else {
            return nil
        }

        let tagName = String(token[token.index(after: token.startIndex)..<parenStart])
        let value = String(token[token.index(after: parenStart)..<parenEnd])

        return TagValuePredicate(tagName: tagName, value: value)
    }
}

// MARK: - Saved Searches

/// Represents a saved search query
struct SavedSearch: Identifiable, Codable, Equatable {
    let id: UUID
    var name: String
    var query: String

    init(id: UUID = UUID(), name: String, query: String) {
        self.id = id
        self.name = name
        self.query = query
    }
}

/// Built-in saved searches
extension SavedSearch {
    static let notDone = SavedSearch(
        name: "Not Done",
        query: "not @done"
    )

    static let today = SavedSearch(
        name: "Today",
        query: "@today or @due(today)"
    )

    static let highPriority = SavedSearch(
        name: "High Priority",
        query: "@priority(1) and not @done"
    )

    static let allProjects = SavedSearch(
        name: "All Projects",
        query: "project"
    )

    static let builtInSearches: [SavedSearch] = [
        .notDone,
        .today,
        .highPriority,
        .allProjects
    ]
}
