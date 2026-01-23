import Foundation

/// Types of items in TaskPaper format
enum ItemType: String, CaseIterable {
    case project
    case task
    case note
}

/// Represents a single item (project, task, or note) in a TaskPaper document
final class Item: Identifiable, ObservableObject {
    let id: UUID
    @Published var text: String
    @Published var type: ItemType
    @Published var indentLevel: Int
    @Published var children: [Item]
    @Published var isExpanded: Bool

    weak var parent: Item?

    init(
        id: UUID = UUID(),
        text: String,
        type: ItemType,
        indentLevel: Int = 0,
        children: [Item] = [],
        isExpanded: Bool = true
    ) {
        self.id = id
        self.text = text
        self.type = type
        self.indentLevel = indentLevel
        self.children = children
        self.isExpanded = isExpanded

        children.forEach { $0.parent = self }
    }

    /// Parse tags from the item's text content
    var tags: [Tag] {
        Tag.parseTags(from: text)
    }

    /// Check if item has a specific tag by name
    func hasTag(named name: String) -> Bool {
        tags.contains { $0.name.lowercased() == name.lowercased() }
    }

    /// Get tag value for a specific tag name
    func tagValue(for name: String) -> String? {
        tags.first { $0.name.lowercased() == name.lowercased() }?.value
    }

    /// Check if item is marked as done
    var isDone: Bool {
        hasTag(named: "done")
    }

    /// Toggle done status
    func toggleDone() {
        if isDone {
            let doneTag = tags.first { $0.name.lowercased() == "done" }
            if let tag = doneTag {
                text = tag.removeFrom(text)
            }
        } else {
            let dateFormatter = DateFormatter()
            dateFormatter.dateFormat = "yyyy-MM-dd"
            let dateValue = dateFormatter.string(from: Date())
            let doneTag = Tag(name: "done", value: dateValue)
            text = doneTag.addTo(text)
        }
    }

    /// Add a tag to this item
    func addTag(_ tag: Tag) {
        text = tag.addTo(text)
    }

    /// Remove a tag from this item
    func removeTag(_ tag: Tag) {
        text = tag.removeFrom(text)
    }

    /// Content without tags (for display purposes)
    var contentWithoutTags: String {
        guard let range = Tag.trailingTagsRange(in: text) else {
            return text
        }
        return String(text[..<range.lowerBound]).trimmingCharacters(in: .whitespaces)
    }

    /// Add a child item
    func addChild(_ child: Item) {
        child.parent = self
        child.indentLevel = indentLevel + 1
        children.append(child)
    }

    /// Insert a child at specific index
    func insertChild(_ child: Item, at index: Int) {
        child.parent = self
        child.indentLevel = indentLevel + 1
        children.insert(child, at: min(index, children.count))
    }

    /// Remove a child item
    func removeChild(_ child: Item) {
        children.removeAll { $0.id == child.id }
        child.parent = nil
    }

    /// Get all descendants (children, grandchildren, etc.)
    var descendants: [Item] {
        children.flatMap { [$0] + $0.descendants }
    }

    /// Get flat list of self and all visible descendants
    func flattenedVisibleItems() -> [Item] {
        var result = [self]
        if isExpanded {
            for child in children {
                result.append(contentsOf: child.flattenedVisibleItems())
            }
        }
        return result
    }
}

// MARK: - Equatable

extension Item: Equatable {
    static func == (lhs: Item, rhs: Item) -> Bool {
        lhs.id == rhs.id
    }
}

// MARK: - Hashable

extension Item: Hashable {
    func hash(into hasher: inout Hasher) {
        hasher.combine(id)
    }
}

// MARK: - Deep Copy

extension Item {
    /// Create a deep copy of this item and all children
    func deepCopy() -> Item {
        let copy = Item(
            text: text,
            type: type,
            indentLevel: indentLevel,
            children: children.map { $0.deepCopy() },
            isExpanded: isExpanded
        )
        return copy
    }
}
