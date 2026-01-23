import Foundation
import Combine

/// ViewModel for the sidebar document list and saved searches
@MainActor
final class SidebarViewModel: ObservableObject {
    @Published var documents: [DocumentMetadata] = []
    @Published var savedSearches: [SavedSearch] = []
    @Published var isLoading = false
    @Published var error: Error?
    @Published var showingNewDocumentAlert = false
    @Published var newDocumentName = ""

    private let fileService = FileService.shared
    private let savedSearchesKey = "savedSearches"
    private var cancellables = Set<AnyCancellable>()

    init() {
        loadSavedSearches()
        bindToFileService()
    }

    // MARK: - File Service Binding

    private func bindToFileService() {
        fileService.$documents
            .receive(on: DispatchQueue.main)
            .assign(to: &$documents)

        fileService.$isLoading
            .receive(on: DispatchQueue.main)
            .assign(to: &$isLoading)

        fileService.$error
            .receive(on: DispatchQueue.main)
            .sink { [weak self] fileError in
                self?.error = fileError
            }
            .store(in: &cancellables)
    }

    // MARK: - Document Operations

    /// Create a new document
    func createDocument() async {
        guard !newDocumentName.trimmingCharacters(in: .whitespaces).isEmpty else { return }

        do {
            _ = try await fileService.createDocument(name: newDocumentName)
            newDocumentName = ""
            showingNewDocumentAlert = false
            fileService.refresh()
        } catch {
            self.error = error
        }
    }

    /// Delete a document
    func deleteDocument(_ metadata: DocumentMetadata) {
        do {
            try fileService.deleteDocument(at: metadata.url)
            fileService.refresh()
        } catch {
            self.error = error
        }
    }

    /// Rename a document
    func renameDocument(_ metadata: DocumentMetadata, to newName: String) {
        do {
            _ = try fileService.renameDocument(at: metadata.url, to: newName)
            fileService.refresh()
        } catch {
            self.error = error
        }
    }

    /// Load a document
    func loadDocument(_ metadata: DocumentMetadata) async throws -> TaskPaperDocument {
        try await fileService.loadDocument(from: metadata.url)
    }

    /// Refresh document list
    func refresh() {
        fileService.refresh()
    }

    // MARK: - Saved Searches

    private func loadSavedSearches() {
        // Start with built-in searches
        var searches = SavedSearch.builtInSearches

        // Load custom searches from UserDefaults
        if let data = UserDefaults.standard.data(forKey: savedSearchesKey),
           let customSearches = try? JSONDecoder().decode([SavedSearch].self, from: data) {
            searches.append(contentsOf: customSearches)
        }

        savedSearches = searches
    }

    /// Add a custom saved search
    func addSavedSearch(name: String, query: String) {
        let search = SavedSearch(name: name, query: query)
        savedSearches.append(search)
        persistCustomSearches()
    }

    /// Remove a saved search (only custom ones)
    func removeSavedSearch(_ search: SavedSearch) {
        // Don't allow removing built-in searches
        guard !SavedSearch.builtInSearches.contains(where: { $0.name == search.name }) else { return }

        savedSearches.removeAll { $0.id == search.id }
        persistCustomSearches()
    }

    /// Update a saved search
    func updateSavedSearch(_ search: SavedSearch, name: String, query: String) {
        if let index = savedSearches.firstIndex(where: { $0.id == search.id }) {
            savedSearches[index].name = name
            savedSearches[index].query = query
            persistCustomSearches()
        }
    }

    private func persistCustomSearches() {
        let customSearches = savedSearches.filter { search in
            !SavedSearch.builtInSearches.contains { $0.name == search.name }
        }

        if let data = try? JSONEncoder().encode(customSearches) {
            UserDefaults.standard.set(data, forKey: savedSearchesKey)
        }
    }

    // MARK: - Helper Properties

    var isICloudAvailable: Bool {
        fileService.isICloudAvailable
    }

    var documentCount: Int {
        documents.count
    }

    var hasDocuments: Bool {
        !documents.isEmpty
    }
}
