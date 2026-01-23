import Foundation

/// Parser for TaskPaper format files
/// Format rules:
/// - Line ending with `:` → Project
/// - Line starting with `- ` (after indentation) → Task
/// - Other lines → Note
/// - Tab indentation → Hierarchy level
/// - `@name` or `@name(value)` → Tags
enum TaskPaperParser {

    // MARK: - Parsing

    /// Parse a TaskPaper format string into items
    static func parse(_ content: String) -> [Item] {
        let lines = content.components(separatedBy: .newlines)
        var rootItems: [Item] = []
        var itemStack: [(level: Int, item: Item)] = []

        for line in lines {
            guard let item = parseLine(line) else { continue }

            // Find the appropriate parent based on indent level
            while let last = itemStack.last, last.level >= item.indentLevel {
                itemStack.removeLast()
            }

            if let parentEntry = itemStack.last {
                parentEntry.item.addChild(item)
            } else {
                rootItems.append(item)
            }

            itemStack.append((level: item.indentLevel, item: item))
        }

        return rootItems
    }

    /// Parse a single line into an Item
    private static func parseLine(_ line: String) -> Item? {
        // Count leading tabs for indent level
        var indentLevel = 0
        var index = line.startIndex
        while index < line.endIndex && line[index] == "\t" {
            indentLevel += 1
            index = line.index(after: index)
        }

        // Get content after tabs
        let contentStart = index
        var content = String(line[contentStart...])

        // Skip empty lines
        guard !content.trimmingCharacters(in: .whitespaces).isEmpty else {
            return nil
        }

        // Determine type and extract text
        let type: ItemType
        let text: String

        if content.hasPrefix("- ") {
            // Task: starts with "- "
            type = .task
            text = extractTaskContent(from: content)
        } else if isProjectLine(content) {
            // Project: ends with ":" (not part of a tag)
            type = .project
            text = extractProjectContent(from: content)
        } else {
            // Note: everything else
            type = .note
            text = content
        }

        return Item(
            text: text,
            type: type,
            indentLevel: indentLevel
        )
    }

    /// Extract content from a task line (removes "- " prefix)
    private static func extractTaskContent(from line: String) -> String {
        guard line.hasPrefix("- ") else { return line }
        return String(line.dropFirst(2))
    }

    /// Extract content from a project line (removes trailing ":")
    /// Handles case where tags follow the colon
    private static func extractProjectContent(from line: String) -> String {
        // Find the colon that marks the project (before any trailing tags)
        let trimmed = line.trimmingCharacters(in: .whitespaces)

        // Check for trailing tags
        if let tagsRange = Tag.trailingTagsRange(in: trimmed) {
            // Content is before tags, minus the colon
            let beforeTags = trimmed[..<tagsRange.lowerBound].trimmingCharacters(in: .whitespaces)
            let tags = String(trimmed[tagsRange...])

            if beforeTags.hasSuffix(":") {
                return String(beforeTags.dropLast()) + tags
            }
            return beforeTags + tags
        }

        // No tags, just remove trailing colon
        if trimmed.hasSuffix(":") {
            return String(trimmed.dropLast())
        }

        return trimmed
    }

    /// Check if a line represents a project (ends with ":" not in a tag)
    private static func isProjectLine(_ line: String) -> Bool {
        let trimmed = line.trimmingCharacters(in: .whitespaces)
        guard !trimmed.isEmpty else { return false }

        // Check for trailing tags
        if let tagsRange = Tag.trailingTagsRange(in: trimmed) {
            // Check if there's a colon just before the tags
            let beforeTags = trimmed[..<tagsRange.lowerBound].trimmingCharacters(in: .whitespaces)
            return beforeTags.hasSuffix(":")
        }

        // No tags, check if ends with colon
        return trimmed.hasSuffix(":")
    }

    // MARK: - Serialization

    /// Serialize items back to TaskPaper format
    static func serialize(_ items: [Item]) -> String {
        items.map { serializeItem($0) }.joined()
    }

    /// Serialize a single item and its children
    private static func serializeItem(_ item: Item) -> String {
        var result = ""

        // Add indentation
        result += String(repeating: "\t", count: item.indentLevel)

        // Add type prefix/suffix
        switch item.type {
        case .task:
            result += "- "
            result += formatTaskContent(item.text)
        case .project:
            result += formatProjectContent(item.text)
        case .note:
            result += item.text
        }

        result += "\n"

        // Recursively serialize children
        for child in item.children {
            result += serializeItem(child)
        }

        return result
    }

    /// Format task content for serialization
    private static func formatTaskContent(_ text: String) -> String {
        text
    }

    /// Format project content for serialization (adds trailing colon)
    private static func formatProjectContent(_ text: String) -> String {
        // Handle tags: colon goes before tags
        if let tagsRange = Tag.trailingTagsRange(in: text) {
            let beforeTags = text[..<tagsRange.lowerBound].trimmingCharacters(in: .whitespaces)
            let tags = String(text[tagsRange...])
            return beforeTags + ":" + tags
        }
        return text + ":"
    }
}

// MARK: - Document Extension

extension TaskPaperDocument {
    /// Create document from TaskPaper format string
    static func from(content: String, name: String, fileURL: URL? = nil) -> TaskPaperDocument {
        let items = TaskPaperParser.parse(content)
        return TaskPaperDocument(
            name: name,
            items: items,
            lastModified: Date(),
            fileURL: fileURL
        )
    }

    /// Serialize document to TaskPaper format string
    func toTaskPaperString() -> String {
        TaskPaperParser.serialize(items)
    }
}
