import Foundation

/// Represents a TaskPaper document containing items
final class TaskPaperDocument: Identifiable, ObservableObject {
    let id: UUID
    @Published var name: String
    @Published var items: [Item]
    @Published var lastModified: Date
    @Published var fileURL: URL?

    init(
        id: UUID = UUID(),
        name: String,
        items: [Item] = [],
        lastModified: Date = Date(),
        fileURL: URL? = nil
    ) {
        self.id = id
        self.name = name
        self.items = items
        self.lastModified = lastModified
        self.fileURL = fileURL
    }

    /// Get all items flattened (including children) for display
    var flattenedItems: [Item] {
        items.flatMap { $0.flattenedVisibleItems() }
    }

    /// Get all items flattened regardless of expansion state
    var allItems: [Item] {
        items.flatMap { [$0] + $0.descendants }
    }

    /// Find item by ID
    func findItem(by id: UUID) -> Item? {
        allItems.first { $0.id == id }
    }

    /// Add a new item at root level
    func addItem(_ item: Item) {
        item.indentLevel = 0
        items.append(item)
        lastModified = Date()
    }

    /// Insert item at specific index
    func insertItem(_ item: Item, at index: Int) {
        item.indentLevel = 0
        items.insert(item, at: min(index, items.count))
        lastModified = Date()
    }

    /// Remove item from document
    func removeItem(_ item: Item) {
        if let parent = item.parent {
            parent.removeChild(item)
        } else {
            items.removeAll { $0.id == item.id }
        }
        lastModified = Date()
    }

    /// Move item to new position
    func moveItem(_ item: Item, toParent newParent: Item?, atIndex index: Int) {
        // Remove from current location
        if let currentParent = item.parent {
            currentParent.removeChild(item)
        } else {
            items.removeAll { $0.id == item.id }
        }

        // Add to new location
        if let newParent = newParent {
            newParent.insertChild(item, at: index)
        } else {
            item.indentLevel = 0
            items.insert(item, at: min(index, items.count))
        }

        lastModified = Date()
    }

    /// Get count of all items including nested
    var totalItemCount: Int {
        allItems.count
    }

    /// Get count of incomplete tasks
    var incompleteTaskCount: Int {
        allItems.filter { $0.type == .task && !$0.isDone }.count
    }
}

// MARK: - Equatable

extension TaskPaperDocument: Equatable {
    static func == (lhs: TaskPaperDocument, rhs: TaskPaperDocument) -> Bool {
        lhs.id == rhs.id
    }
}

// MARK: - Hashable

extension TaskPaperDocument: Hashable {
    func hash(into hasher: inout Hasher) {
        hasher.combine(id)
    }
}
