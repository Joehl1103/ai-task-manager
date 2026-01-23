import SwiftUI

/// Sidebar view showing documents and saved searches
struct SidebarView: View {
    @ObservedObject var viewModel: SidebarViewModel
    let onSelectDocument: (DocumentMetadata) async -> Void
    let onSelectSearch: (SavedSearch) -> Void

    @State private var showingNewDocument = false
    @State private var showingNewSearch = false
    @State private var newSearchName = ""
    @State private var newSearchQuery = ""

    var body: some View {
        List {
            // Documents section
            documentsSection

            // Saved searches section
            savedSearchesSection
        }
        .listStyle(.insetGrouped)
        .navigationTitle("TaskPaper")
        .refreshable {
            viewModel.refresh()
        }
        .toolbar {
            ToolbarItem(placement: .primaryAction) {
                Menu {
                    Button {
                        showingNewDocument = true
                    } label: {
                        Label("New Document", systemImage: "doc.badge.plus")
                    }

                    Button {
                        showingNewSearch = true
                    } label: {
                        Label("New Saved Search", systemImage: "magnifyingglass.circle")
                    }
                } label: {
                    Image(systemName: "plus")
                }
            }
        }
        .alert("New Document", isPresented: $showingNewDocument) {
            TextField("Document name", text: $viewModel.newDocumentName)
            Button("Cancel", role: .cancel) {
                viewModel.newDocumentName = ""
            }
            Button("Create") {
                Task {
                    await viewModel.createDocument()
                }
            }
        } message: {
            Text("Enter a name for the new document")
        }
        .sheet(isPresented: $showingNewSearch) {
            newSearchSheet
        }
        .overlay {
            if viewModel.isLoading {
                ProgressView()
            }
        }
    }

    // MARK: - Documents Section

    private var documentsSection: some View {
        Section {
            if viewModel.documents.isEmpty && !viewModel.isLoading {
                emptyDocumentsView
            } else {
                ForEach(viewModel.documents) { metadata in
                    DocumentRowView(
                        metadata: metadata,
                        onSelect: {
                            Task {
                                await onSelectDocument(metadata)
                            }
                        }
                    )
                    .swipeActions(edge: .trailing, allowsFullSwipe: false) {
                        Button(role: .destructive) {
                            viewModel.deleteDocument(metadata)
                        } label: {
                            Label("Delete", systemImage: "trash")
                        }
                    }
                }
            }
        } header: {
            HStack {
                Text("Documents")
                Spacer()
                if viewModel.isICloudAvailable {
                    Image(systemName: "icloud")
                        .foregroundColor(.secondary)
                        .font(.caption)
                }
            }
        }
    }

    private var emptyDocumentsView: some View {
        VStack(spacing: 8) {
            Image(systemName: "doc.text")
                .font(.title)
                .foregroundColor(.secondary)
            Text("No documents")
                .font(.subheadline)
                .foregroundColor(.secondary)
            Button("Create Document") {
                showingNewDocument = true
            }
            .font(.caption)
        }
        .frame(maxWidth: .infinity)
        .padding()
    }

    // MARK: - Saved Searches Section

    private var savedSearchesSection: some View {
        Section("Saved Searches") {
            ForEach(viewModel.savedSearches) { search in
                SavedSearchRowView(search: search) {
                    onSelectSearch(search)
                }
                .swipeActions(edge: .trailing, allowsFullSwipe: false) {
                    if !SavedSearch.builtInSearches.contains(where: { $0.name == search.name }) {
                        Button(role: .destructive) {
                            viewModel.removeSavedSearch(search)
                        } label: {
                            Label("Delete", systemImage: "trash")
                        }
                    }
                }
            }
        }
    }

    // MARK: - New Search Sheet

    private var newSearchSheet: some View {
        NavigationStack {
            Form {
                TextField("Name", text: $newSearchName)
                TextField("Query", text: $newSearchQuery)

                Section("Examples") {
                    Button("@done") { newSearchQuery = "@done" }
                    Button("not @done") { newSearchQuery = "not @done" }
                    Button("@priority(1) and not @done") { newSearchQuery = "@priority(1) and not @done" }
                    Button("project") { newSearchQuery = "project" }
                }
                .foregroundColor(.secondary)
            }
            .navigationTitle("New Saved Search")
            .navigationBarTitleDisplayMode(.inline)
            .toolbar {
                ToolbarItem(placement: .cancellationAction) {
                    Button("Cancel") {
                        showingNewSearch = false
                        newSearchName = ""
                        newSearchQuery = ""
                    }
                }

                ToolbarItem(placement: .confirmationAction) {
                    Button("Save") {
                        viewModel.addSavedSearch(name: newSearchName, query: newSearchQuery)
                        showingNewSearch = false
                        newSearchName = ""
                        newSearchQuery = ""
                    }
                    .disabled(newSearchName.isEmpty || newSearchQuery.isEmpty)
                }
            }
        }
    }
}

// MARK: - Document Row View

struct DocumentRowView: View {
    let metadata: DocumentMetadata
    let onSelect: () -> Void

    var body: some View {
        Button(action: onSelect) {
            HStack {
                Image(systemName: "doc.text")
                    .foregroundColor(.accentColor)
                    .font(.title3)

                VStack(alignment: .leading, spacing: 2) {
                    Text(metadata.name)
                        .font(.body)
                        .foregroundColor(.primary)

                    Text(formattedDate)
                        .font(.caption)
                        .foregroundColor(.secondary)
                }

                Spacer()

                if !metadata.isDownloaded {
                    Image(systemName: "icloud.and.arrow.down")
                        .foregroundColor(.secondary)
                        .font(.caption)
                }

                Image(systemName: "chevron.right")
                    .foregroundColor(.secondary)
                    .font(.caption)
            }
        }
        .buttonStyle(.plain)
    }

    private var formattedDate: String {
        let formatter = RelativeDateTimeFormatter()
        formatter.unitsStyle = .abbreviated
        return formatter.localizedString(for: metadata.lastModified, relativeTo: Date())
    }
}

// MARK: - Saved Search Row View

struct SavedSearchRowView: View {
    let search: SavedSearch
    let onSelect: () -> Void

    var body: some View {
        Button(action: onSelect) {
            HStack {
                Image(systemName: searchIcon)
                    .foregroundColor(.orange)
                    .font(.title3)

                VStack(alignment: .leading, spacing: 2) {
                    Text(search.name)
                        .font(.body)
                        .foregroundColor(.primary)

                    Text(search.query)
                        .font(.caption)
                        .foregroundColor(.secondary)
                        .lineLimit(1)
                }

                Spacer()

                Image(systemName: "chevron.right")
                    .foregroundColor(.secondary)
                    .font(.caption)
            }
        }
        .buttonStyle(.plain)
    }

    private var searchIcon: String {
        if search.query.contains("done") {
            return "checkmark.circle"
        } else if search.query.contains("today") || search.query.contains("due") {
            return "calendar"
        } else if search.query.contains("priority") {
            return "exclamationmark.circle"
        } else if search.query.contains("project") {
            return "folder"
        }
        return "magnifyingglass"
    }
}

// MARK: - Preview

#Preview {
    NavigationStack {
        SidebarView(
            viewModel: SidebarViewModel(),
            onSelectDocument: { _ in },
            onSelectSearch: { _ in }
        )
    }
}
