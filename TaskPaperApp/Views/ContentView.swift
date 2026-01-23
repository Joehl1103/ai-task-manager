import SwiftUI

/// Main content view with sidebar navigation
struct ContentView: View {
    @StateObject private var sidebarViewModel = SidebarViewModel()
    @State private var selectedDocument: TaskPaperDocument?
    @State private var documentViewModel: DocumentViewModel?
    @State private var isLoadingDocument = false
    @State private var loadError: Error?
    @State private var showingError = false
    @State private var appliedSearch: SavedSearch?

    var body: some View {
        NavigationSplitView {
            SidebarView(
                viewModel: sidebarViewModel,
                onSelectDocument: selectDocument,
                onSelectSearch: applySearch
            )
        } detail: {
            detailView
        }
        .alert("Error", isPresented: $showingError) {
            Button("OK", role: .cancel) {}
        } message: {
            Text(loadError?.localizedDescription ?? "An unknown error occurred")
        }
    }

    // MARK: - Detail View

    @ViewBuilder
    private var detailView: some View {
        if isLoadingDocument {
            ProgressView("Loading document...")
        } else if let viewModel = documentViewModel {
            EditorView(viewModel: viewModel)
                .sheet(item: $viewModel.editingItem) { item in
                    ItemEditorSheet(viewModel: viewModel, item: item)
                }
        } else {
            emptyDetailView
        }
    }

    private var emptyDetailView: some View {
        VStack(spacing: 16) {
            Image(systemName: "doc.text")
                .font(.system(size: 64))
                .foregroundColor(.secondary)

            Text("Select a Document")
                .font(.title2)
                .fontWeight(.medium)

            Text("Choose a document from the sidebar or create a new one")
                .font(.subheadline)
                .foregroundColor(.secondary)
                .multilineTextAlignment(.center)
                .padding(.horizontal)

            Button {
                sidebarViewModel.showingNewDocumentAlert = true
            } label: {
                Label("New Document", systemImage: "plus")
            }
            .buttonStyle(.borderedProminent)
        }
        .frame(maxWidth: .infinity, maxHeight: .infinity)
        .background(Color(.systemGroupedBackground))
    }

    // MARK: - Actions

    private func selectDocument(_ metadata: DocumentMetadata) async {
        isLoadingDocument = true
        loadError = nil

        do {
            let document = try await sidebarViewModel.loadDocument(metadata)
            selectedDocument = document
            documentViewModel = DocumentViewModel(document: document)

            // Apply search if one was selected
            if let search = appliedSearch {
                documentViewModel?.searchQuery = search.query
            }
        } catch {
            loadError = error
            showingError = true
        }

        isLoadingDocument = false
    }

    private func applySearch(_ search: SavedSearch) {
        appliedSearch = search

        // Apply to current document if one is open
        if let viewModel = documentViewModel {
            viewModel.searchQuery = search.query
        }
    }
}

// MARK: - Item Extension for Identifiable binding

extension Item: @retroactive Identifiable {}

// MARK: - Preview

#Preview {
    ContentView()
}
