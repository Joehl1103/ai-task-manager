import Foundation
import Combine
import SwiftUI

/// ViewModel for managing a single TaskPaper document
@MainActor
final class DocumentViewModel: ObservableObject {
    @Published var document: TaskPaperDocument
    @Published var filteredItems: [Item] = []
    @Published var searchQuery: String = ""
    @Published var editingItem: Item?
    @Published var isSaving = false
    @Published var error: Error?

    private var undoStack: [[Item]] = []
    private var redoStack: [[Item]] = []
    private let maxUndoLevels = 50

    private var cancellables = Set<AnyCancellable>()
    private let fileService = FileService.shared

    init(document: TaskPaperDocument) {
        self.document = document
        self.filteredItems = document.items

        setupSearchBinding()
    }

    // MARK: - Search

    private func setupSearchBinding() {
        $searchQuery
            .debounce(for: .milliseconds(200), scheduler: RunLoop.main)
            .removeDuplicates()
            .sink { [weak self] query in
                self?.applyFilter(query: query)
            }
            .store(in: &cancellables)
    }

    private func applyFilter(query: String) {
        if query.isEmpty {
            filteredItems = document.items
        } else {
            filteredItems = SearchEngine.filter(items: document.items, query: query)
        }
    }

    func clearSearch() {
        searchQuery = ""
    }

    // MARK: - Item Operations

    /// Add a new item
    func addItem(text: String, type: ItemType, parent: Item? = nil) {
        saveUndoState()

        let newItem = Item(text: text, type: type)

        if let parent = parent {
            parent.addChild(newItem)
        } else {
            document.addItem(newItem)
        }

        applyFilter(query: searchQuery)
        scheduleAutoSave()
    }

    /// Insert item after another item
    func insertItemAfter(_ existingItem: Item, text: String, type: ItemType) {
        saveUndoState()

        let newItem = Item(text: text, type: type)

        if let parent = existingItem.parent {
            if let index = parent.children.firstIndex(where: { $0.id == existingItem.id }) {
                parent.insertChild(newItem, at: index + 1)
            } else {
                parent.addChild(newItem)
            }
        } else {
            if let index = document.items.firstIndex(where: { $0.id == existingItem.id }) {
                document.insertItem(newItem, at: index + 1)
            } else {
                document.addItem(newItem)
            }
        }

        applyFilter(query: searchQuery)
        scheduleAutoSave()
    }

    /// Update item text
    func updateItemText(_ item: Item, newText: String) {
        saveUndoState()
        item.text = newText
        document.lastModified = Date()
        applyFilter(query: searchQuery)
        scheduleAutoSave()
    }

    /// Update item type
    func updateItemType(_ item: Item, newType: ItemType) {
        saveUndoState()
        item.type = newType
        document.lastModified = Date()
        applyFilter(query: searchQuery)
        scheduleAutoSave()
    }

    /// Delete item
    func deleteItem(_ item: Item) {
        saveUndoState()
        document.removeItem(item)
        applyFilter(query: searchQuery)
        scheduleAutoSave()
    }

    /// Toggle done status on item
    func toggleDone(_ item: Item) {
        saveUndoState()
        item.toggleDone()
        document.lastModified = Date()
        applyFilter(query: searchQuery)
        scheduleAutoSave()
    }

    /// Indent item (increase level)
    func indentItem(_ item: Item) {
        saveUndoState()

        // Find previous sibling to become parent
        if let parent = item.parent {
            if let index = parent.children.firstIndex(where: { $0.id == item.id }), index > 0 {
                let newParent = parent.children[index - 1]
                parent.removeChild(item)
                newParent.addChild(item)
            }
        } else {
            if let index = document.items.firstIndex(where: { $0.id == item.id }), index > 0 {
                let newParent = document.items[index - 1]
                document.items.remove(at: index)
                newParent.addChild(item)
            }
        }

        document.lastModified = Date()
        applyFilter(query: searchQuery)
        scheduleAutoSave()
    }

    /// Outdent item (decrease level)
    func outdentItem(_ item: Item) {
        saveUndoState()

        guard let parent = item.parent else { return }

        if let grandparent = parent.parent {
            // Move to grandparent's children
            if let parentIndex = grandparent.children.firstIndex(where: { $0.id == parent.id }) {
                parent.removeChild(item)
                grandparent.insertChild(item, at: parentIndex + 1)
            }
        } else {
            // Move to root level
            if let parentIndex = document.items.firstIndex(where: { $0.id == parent.id }) {
                parent.removeChild(item)
                item.indentLevel = 0
                document.items.insert(item, at: parentIndex + 1)
            }
        }

        document.lastModified = Date()
        applyFilter(query: searchQuery)
        scheduleAutoSave()
    }

    /// Toggle expansion of item
    func toggleExpanded(_ item: Item) {
        item.isExpanded.toggle()
        applyFilter(query: searchQuery)
    }

    /// Move item to new position
    func moveItem(_ item: Item, toParent: Item?, atIndex: Int) {
        saveUndoState()
        document.moveItem(item, toParent: toParent, atIndex: atIndex)
        applyFilter(query: searchQuery)
        scheduleAutoSave()
    }

    // MARK: - Undo/Redo

    private func saveUndoState() {
        let state = document.items.map { $0.deepCopy() }
        undoStack.append(state)

        if undoStack.count > maxUndoLevels {
            undoStack.removeFirst()
        }

        redoStack.removeAll()
    }

    var canUndo: Bool { !undoStack.isEmpty }
    var canRedo: Bool { !redoStack.isEmpty }

    func undo() {
        guard let previousState = undoStack.popLast() else { return }

        let currentState = document.items.map { $0.deepCopy() }
        redoStack.append(currentState)

        document.items = previousState
        applyFilter(query: searchQuery)
        scheduleAutoSave()
    }

    func redo() {
        guard let nextState = redoStack.popLast() else { return }

        let currentState = document.items.map { $0.deepCopy() }
        undoStack.append(currentState)

        document.items = nextState
        applyFilter(query: searchQuery)
        scheduleAutoSave()
    }

    // MARK: - Saving

    private var autoSaveTask: Task<Void, Never>?

    private func scheduleAutoSave() {
        autoSaveTask?.cancel()
        autoSaveTask = Task {
            try? await Task.sleep(nanoseconds: 1_000_000_000) // 1 second delay
            if !Task.isCancelled {
                await save()
            }
        }
    }

    func save() async {
        isSaving = true
        defer { isSaving = false }

        do {
            try await fileService.saveDocument(document)
        } catch {
            self.error = error
        }
    }

    // MARK: - Editing

    func startEditing(_ item: Item) {
        editingItem = item
    }

    func finishEditing() {
        editingItem = nil
    }
}
