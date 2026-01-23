import Foundation

/// Represents a tag in TaskPaper format: @name or @name(value)
struct Tag: Equatable, Hashable, Identifiable {
    var id: String { name + (value ?? "") }
    let name: String
    let value: String?

    init(name: String, value: String? = nil) {
        self.name = name
        self.value = value
    }

    /// Returns string representation: @name or @name(value)
    var description: String {
        if let value = value, !value.isEmpty {
            return "@\(name)(\(value))"
        }
        return "@\(name)"
    }
}

// MARK: - Tag Parsing

extension Tag {
    /// Regex pattern for finding individual tags with optional values
    /// Matches: @tagname or @tagname(value)
    private static let tagPattern = #"(?:^|\s)@([^\(\s]+)(?:\(([^\)]+)\))?"#

    /// Regex pattern for finding trailing tags at end of content
    private static let trailingTagsPattern = #"(?:(?:^|\s)@([^\(\s]*)(?:\([^\)]*\))?)+$"#

    /// Parse all tags from a string
    static func parseTags(from string: String) -> [Tag] {
        guard string.contains("@") else { return [] }

        var tags: [Tag] = []
        let regex = try? NSRegularExpression(pattern: tagPattern, options: [])
        let range = NSRange(string.startIndex..., in: string)

        regex?.enumerateMatches(in: string, options: [], range: range) { match, _, _ in
            guard let match = match else { return }

            let nameRange = Range(match.range(at: 1), in: string)
            let valueRange = Range(match.range(at: 2), in: string)

            if let nameRange = nameRange {
                let name = String(string[nameRange])
                let value = valueRange.map { String(string[$0]) }
                tags.append(Tag(name: name, value: value))
            }
        }

        return tags
    }

    /// Find the range of trailing tags in a string
    static func trailingTagsRange(in string: String) -> Range<String.Index>? {
        guard string.contains("@") else { return nil }

        let regex = try? NSRegularExpression(pattern: trailingTagsPattern, options: [])
        let range = NSRange(string.startIndex..., in: string)

        if let match = regex?.firstMatch(in: string, options: [], range: range),
           let swiftRange = Range(match.range, in: string) {
            return swiftRange
        }

        return nil
    }

    /// Add this tag to content string
    func addTo(_ content: String) -> String {
        content + " " + description
    }

    /// Remove this tag from content string
    func removeFrom(_ content: String) -> String {
        let tagString = description

        // Find and remove tag with surrounding whitespace
        let patterns = [
            " \(tagString)",  // tag preceded by space
            "\(tagString) ",  // tag followed by space
            tagString         // tag alone
        ]

        var result = content
        for pattern in patterns {
            if let range = result.range(of: pattern) {
                result.removeSubrange(range)
                break
            }
        }

        return result.trimmingCharacters(in: .whitespaces)
    }
}
