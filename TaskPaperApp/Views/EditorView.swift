import SwiftUI

/// Main editor view for a TaskPaper document
struct EditorView: View {
    @ObservedObject var viewModel: DocumentViewModel
    @StateObject private var searchViewModel = SearchViewModel()

    @State private var showingAddItem = false
    @State private var newItemText = ""
    @State private var newItemType: ItemType = .task
    @State private var editingText = ""

    var body: some View {
        VStack(spacing: 0) {
            // Search/Filter bar
            filterBar

            // Items list
            itemsList

            // Add item bar
            addItemBar
        }
        .navigationTitle(viewModel.document.name)
        .navigationBarTitleDisplayMode(.inline)
        .toolbar {
            ToolbarItemGroup(placement: .navigationBarTrailing) {
                toolbarButtons
            }
        }
        .onChange(of: searchViewModel.query) { _, newValue in
            viewModel.searchQuery = newValue
        }
    }

    // MARK: - Filter Bar

    private var filterBar: some View {
        VStack(spacing: 0) {
            HStack {
                Image(systemName: "magnifyingglass")
                    .foregroundColor(.secondary)

                TextField("Filter items...", text: $searchViewModel.query)
                    .textFieldStyle(.plain)
                    .submitLabel(.search)
                    .onSubmit {
                        searchViewModel.submitSearch()
                    }

                if !searchViewModel.query.isEmpty {
                    Button {
                        searchViewModel.clearQuery()
                    } label: {
                        Image(systemName: "xmark.circle.fill")
                            .foregroundColor(.secondary)
                    }
                    .buttonStyle(.plain)
                }
            }
            .padding(.horizontal, 12)
            .padding(.vertical, 10)
            .background(Color(.systemGray6))

            // Suggestions dropdown
            if searchViewModel.isShowingSuggestions {
                suggestionsView
            }

            Divider()
        }
    }

    private var suggestionsView: some View {
        VStack(alignment: .leading, spacing: 0) {
            ForEach(searchViewModel.suggestions) { suggestion in
                Button {
                    searchViewModel.selectSuggestion(suggestion)
                } label: {
                    HStack {
                        Image(systemName: suggestion.icon)
                            .foregroundColor(.secondary)
                            .frame(width: 24)

                        VStack(alignment: .leading) {
                            Text(suggestion.text)
                                .foregroundColor(.primary)
                            Text(suggestion.description)
                                .font(.caption)
                                .foregroundColor(.secondary)
                        }

                        Spacer()
                    }
                    .padding(.horizontal, 12)
                    .padding(.vertical, 8)
                    .contentShape(Rectangle())
                }
                .buttonStyle(.plain)

                Divider()
                    .padding(.leading, 48)
            }
        }
        .background(Color(.systemBackground))
    }

    // MARK: - Items List

    private var itemsList: some View {
        Group {
            if viewModel.filteredItems.isEmpty {
                emptyStateView
            } else {
                ScrollView {
                    LazyVStack(spacing: 0) {
                        ForEach(flattenedItems) { item in
                            ItemRowView(
                                item: item,
                                onToggleDone: { viewModel.toggleDone(item) },
                                onDelete: { viewModel.deleteItem(item) },
                                onTap: { startEditing(item) },
                                onToggleExpanded: { viewModel.toggleExpanded(item) }
                            )

                            Divider()
                                .padding(.leading, CGFloat(item.indentLevel) * 20 + 12)
                        }
                    }
                }
            }
        }
    }

    private var flattenedItems: [Item] {
        viewModel.filteredItems.flatMap { $0.flattenedVisibleItems() }
    }

    private var emptyStateView: some View {
        VStack(spacing: 16) {
            Image(systemName: viewModel.searchQuery.isEmpty ? "doc.text" : "magnifyingglass")
                .font(.system(size: 48))
                .foregroundColor(.secondary)

            if viewModel.searchQuery.isEmpty {
                Text("No items yet")
                    .font(.headline)
                Text("Tap + to add your first item")
                    .font(.subheadline)
                    .foregroundColor(.secondary)
            } else {
                Text("No matching items")
                    .font(.headline)
                Text("Try a different search query")
                    .font(.subheadline)
                    .foregroundColor(.secondary)
            }
        }
        .frame(maxWidth: .infinity, maxHeight: .infinity)
        .background(Color(.systemGroupedBackground))
    }

    // MARK: - Add Item Bar

    private var addItemBar: some View {
        VStack(spacing: 0) {
            Divider()

            if showingAddItem {
                addItemForm
            } else {
                Button {
                    showingAddItem = true
                } label: {
                    HStack {
                        Image(systemName: "plus.circle.fill")
                            .font(.title2)
                        Text("Add item")
                        Spacer()
                    }
                    .padding()
                    .foregroundColor(.accentColor)
                }
            }
        }
        .background(Color(.systemBackground))
    }

    private var addItemForm: some View {
        VStack(spacing: 12) {
            HStack {
                TextField("New item...", text: $newItemText)
                    .textFieldStyle(.roundedBorder)
                    .submitLabel(.done)
                    .onSubmit {
                        addNewItem()
                    }

                Picker("Type", selection: $newItemType) {
                    ForEach(ItemType.allCases, id: \.self) { type in
                        Text(type.rawValue.capitalized)
                            .tag(type)
                    }
                }
                .pickerStyle(.menu)
            }

            HStack {
                Button("Cancel") {
                    cancelAddItem()
                }
                .foregroundColor(.secondary)

                Spacer()

                Button("Add") {
                    addNewItem()
                }
                .disabled(newItemText.trimmingCharacters(in: .whitespaces).isEmpty)
            }
        }
        .padding()
    }

    // MARK: - Toolbar

    @ViewBuilder
    private var toolbarButtons: some View {
        if viewModel.canUndo {
            Button {
                viewModel.undo()
            } label: {
                Image(systemName: "arrow.uturn.backward")
            }
        }

        if viewModel.canRedo {
            Button {
                viewModel.redo()
            } label: {
                Image(systemName: "arrow.uturn.forward")
            }
        }

        Menu {
            Button {
                showingAddItem = true
                newItemType = .project
            } label: {
                Label("New Project", systemImage: "folder")
            }

            Button {
                showingAddItem = true
                newItemType = .task
            } label: {
                Label("New Task", systemImage: "checkmark.circle")
            }

            Button {
                showingAddItem = true
                newItemType = .note
            } label: {
                Label("New Note", systemImage: "note.text")
            }
        } label: {
            Image(systemName: "plus")
        }
    }

    // MARK: - Actions

    private func addNewItem() {
        let text = newItemText.trimmingCharacters(in: .whitespaces)
        guard !text.isEmpty else { return }

        viewModel.addItem(text: text, type: newItemType)
        newItemText = ""
        showingAddItem = false
    }

    private func cancelAddItem() {
        newItemText = ""
        showingAddItem = false
    }

    private func startEditing(_ item: Item) {
        viewModel.startEditing(item)
        editingText = item.text
    }
}

// MARK: - Item Editor Sheet

struct ItemEditorSheet: View {
    @ObservedObject var viewModel: DocumentViewModel
    let item: Item
    @Environment(\.dismiss) private var dismiss

    @State private var text: String
    @State private var type: ItemType

    init(viewModel: DocumentViewModel, item: Item) {
        self.viewModel = viewModel
        self.item = item
        _text = State(initialValue: item.text)
        _type = State(initialValue: item.type)
    }

    var body: some View {
        NavigationStack {
            Form {
                Section("Content") {
                    TextField("Text", text: $text, axis: .vertical)
                        .lineLimit(3...10)
                }

                Section("Type") {
                    Picker("Type", selection: $type) {
                        ForEach(ItemType.allCases, id: \.self) { itemType in
                            Text(itemType.rawValue.capitalized)
                                .tag(itemType)
                        }
                    }
                    .pickerStyle(.segmented)
                }

                Section("Tags") {
                    ForEach(item.tags) { tag in
                        HStack {
                            Text(tag.description)
                            Spacer()
                            Button {
                                let newText = tag.removeFrom(text)
                                text = newText
                            } label: {
                                Image(systemName: "xmark.circle")
                                    .foregroundColor(.secondary)
                            }
                        }
                    }

                    Button {
                        text = Tag(name: "done").addTo(text)
                    } label: {
                        Label("Add @done", systemImage: "checkmark.circle")
                    }
                }

                Section {
                    Button(role: .destructive) {
                        viewModel.deleteItem(item)
                        dismiss()
                    } label: {
                        Label("Delete Item", systemImage: "trash")
                    }
                }
            }
            .navigationTitle("Edit Item")
            .navigationBarTitleDisplayMode(.inline)
            .toolbar {
                ToolbarItem(placement: .cancellationAction) {
                    Button("Cancel") {
                        dismiss()
                    }
                }

                ToolbarItem(placement: .confirmationAction) {
                    Button("Save") {
                        saveChanges()
                    }
                    .disabled(text.trimmingCharacters(in: .whitespaces).isEmpty)
                }
            }
        }
    }

    private func saveChanges() {
        if text != item.text {
            viewModel.updateItemText(item, newText: text)
        }
        if type != item.type {
            viewModel.updateItemType(item, newType: type)
        }
        viewModel.finishEditing()
        dismiss()
    }
}

// MARK: - Preview

#Preview {
    let document = TaskPaperDocument(
        name: "Test Document",
        items: [
            Item(text: "Project One", type: .project, children: [
                Item(text: "Task in project @priority(1)", type: .task, indentLevel: 1),
                Item(text: "Another task", type: .task, indentLevel: 1)
            ]),
            Item(text: "Standalone task @done(2024-01-15)", type: .task),
            Item(text: "A note", type: .note)
        ]
    )

    NavigationStack {
        EditorView(viewModel: DocumentViewModel(document: document))
    }
}
