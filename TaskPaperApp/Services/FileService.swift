import Foundation
import UIKit
import Combine

// MARK: - TaskPaper UIDocument

/// UIDocument subclass for TaskPaper files with iCloud sync
final class TaskPaperUIDocument: UIDocument {
    var content: String = ""

    override func contents(forType typeName: String) throws -> Any {
        content.data(using: .utf8) ?? Data()
    }

    override func load(fromContents contents: Any, ofType typeName: String?) throws {
        guard let data = contents as? Data else {
            throw CocoaError(.fileReadCorruptFile)
        }
        content = String(data: data, encoding: .utf8) ?? ""
    }
}

// MARK: - File Service

/// Service for managing TaskPaper files with iCloud sync
final class FileService: ObservableObject {
    static let shared = FileService()

    @Published var documents: [DocumentMetadata] = []
    @Published var isLoading = false
    @Published var error: FileServiceError?

    private var metadataQuery: NSMetadataQuery?
    private var cancellables = Set<AnyCancellable>()

    private init() {
        setupMetadataQuery()
    }

    deinit {
        stopMetadataQuery()
    }

    // MARK: - iCloud Container

    /// Get the iCloud documents container URL
    var iCloudContainerURL: URL? {
        FileManager.default.url(forUbiquityContainerIdentifier: nil)?
            .appendingPathComponent("Documents")
    }

    /// Check if iCloud is available
    var isICloudAvailable: Bool {
        FileManager.default.ubiquityIdentityToken != nil
    }

    /// Get the local documents directory (fallback when iCloud unavailable)
    var localDocumentsURL: URL {
        FileManager.default.urls(for: .documentDirectory, in: .userDomainMask)[0]
    }

    /// Get the active documents directory
    var documentsURL: URL {
        iCloudContainerURL ?? localDocumentsURL
    }

    // MARK: - Metadata Query

    /// Setup NSMetadataQuery for iCloud file monitoring
    private func setupMetadataQuery() {
        guard isICloudAvailable else {
            loadLocalDocuments()
            return
        }

        let query = NSMetadataQuery()
        query.searchScopes = [NSMetadataQueryUbiquitousDocumentsScope]
        query.predicate = NSPredicate(format: "%K LIKE '*.taskpaper'", NSMetadataItemFSNameKey)

        NotificationCenter.default.addObserver(
            self,
            selector: #selector(metadataQueryDidFinishGathering),
            name: .NSMetadataQueryDidFinishGathering,
            object: query
        )

        NotificationCenter.default.addObserver(
            self,
            selector: #selector(metadataQueryDidUpdate),
            name: .NSMetadataQueryDidUpdate,
            object: query
        )

        metadataQuery = query
        query.start()
    }

    private func stopMetadataQuery() {
        metadataQuery?.stop()
        metadataQuery = nil
    }

    @objc private func metadataQueryDidFinishGathering(_ notification: Notification) {
        processMetadataQuery()
    }

    @objc private func metadataQueryDidUpdate(_ notification: Notification) {
        processMetadataQuery()
    }

    private func processMetadataQuery() {
        guard let query = metadataQuery else { return }

        query.disableUpdates()

        var newDocuments: [DocumentMetadata] = []

        for item in query.results as? [NSMetadataItem] ?? [] {
            if let url = item.value(forAttribute: NSMetadataItemURLKey) as? URL,
               let name = item.value(forAttribute: NSMetadataItemFSNameKey) as? String,
               let modDate = item.value(forAttribute: NSMetadataItemFSContentChangeDateKey) as? Date {

                let displayName = (name as NSString).deletingPathExtension
                let downloadStatus = item.value(forAttribute: NSMetadataUbiquitousItemDownloadingStatusKey) as? String

                newDocuments.append(DocumentMetadata(
                    url: url,
                    name: displayName,
                    lastModified: modDate,
                    isDownloaded: downloadStatus == NSMetadataUbiquitousItemDownloadingStatusCurrent
                ))
            }
        }

        DispatchQueue.main.async {
            self.documents = newDocuments.sorted { $0.lastModified > $1.lastModified }
        }

        query.enableUpdates()
    }

    /// Load local documents (when iCloud is unavailable)
    private func loadLocalDocuments() {
        isLoading = true

        DispatchQueue.global(qos: .userInitiated).async { [weak self] in
            guard let self = self else { return }

            do {
                let fileURLs = try FileManager.default.contentsOfDirectory(
                    at: self.localDocumentsURL,
                    includingPropertiesForKeys: [.contentModificationDateKey],
                    options: .skipsHiddenFiles
                )

                let taskpaperFiles = fileURLs.filter { $0.pathExtension == "taskpaper" }

                let documents = taskpaperFiles.compactMap { url -> DocumentMetadata? in
                    let values = try? url.resourceValues(forKeys: [.contentModificationDateKey])
                    return DocumentMetadata(
                        url: url,
                        name: url.deletingPathExtension().lastPathComponent,
                        lastModified: values?.contentModificationDate ?? Date(),
                        isDownloaded: true
                    )
                }.sorted { $0.lastModified > $1.lastModified }

                DispatchQueue.main.async {
                    self.documents = documents
                    self.isLoading = false
                }
            } catch {
                DispatchQueue.main.async {
                    self.error = .loadFailed(error)
                    self.isLoading = false
                }
            }
        }
    }

    // MARK: - Document Operations

    /// Create a new document
    func createDocument(name: String) async throws -> URL {
        let fileName = name.hasSuffix(".taskpaper") ? name : "\(name).taskpaper"
        let fileURL = documentsURL.appendingPathComponent(fileName)

        // Ensure directory exists
        try FileManager.default.createDirectory(
            at: documentsURL,
            withIntermediateDirectories: true,
            attributes: nil
        )

        // Create empty document
        let document = TaskPaperUIDocument(fileURL: fileURL)
        document.content = ""

        return try await withCheckedThrowingContinuation { continuation in
            document.save(to: fileURL, for: .forCreating) { success in
                if success {
                    continuation.resume(returning: fileURL)
                } else {
                    continuation.resume(throwing: FileServiceError.saveFailed(nil))
                }
            }
        }
    }

    /// Load a document from URL
    func loadDocument(from url: URL) async throws -> TaskPaperDocument {
        // Start download if needed
        if !FileManager.default.isUbiquitousItem(at: url) ||
            FileManager.default.fileExists(atPath: url.path) {
            // File is local or already downloaded
        } else {
            try FileManager.default.startDownloadingUbiquitousItem(at: url)
            // Wait a bit for download to start
            try await Task.sleep(nanoseconds: 500_000_000)
        }

        let document = TaskPaperUIDocument(fileURL: url)

        return try await withCheckedThrowingContinuation { continuation in
            document.open { success in
                if success {
                    let name = url.deletingPathExtension().lastPathComponent
                    let taskPaperDoc = TaskPaperDocument.from(
                        content: document.content,
                        name: name,
                        fileURL: url
                    )
                    document.close(completionHandler: nil)
                    continuation.resume(returning: taskPaperDoc)
                } else {
                    continuation.resume(throwing: FileServiceError.loadFailed(nil))
                }
            }
        }
    }

    /// Save a document
    func saveDocument(_ document: TaskPaperDocument) async throws {
        guard let url = document.fileURL else {
            throw FileServiceError.noFileURL
        }

        let uiDocument = TaskPaperUIDocument(fileURL: url)
        uiDocument.content = document.toTaskPaperString()

        try await withCheckedThrowingContinuation { (continuation: CheckedContinuation<Void, Error>) in
            uiDocument.save(to: url, for: .forOverwriting) { success in
                if success {
                    continuation.resume()
                } else {
                    continuation.resume(throwing: FileServiceError.saveFailed(nil))
                }
            }
        }
    }

    /// Delete a document
    func deleteDocument(at url: URL) throws {
        try FileManager.default.removeItem(at: url)
    }

    /// Rename a document
    func renameDocument(at url: URL, to newName: String) throws -> URL {
        let newFileName = newName.hasSuffix(".taskpaper") ? newName : "\(newName).taskpaper"
        let newURL = url.deletingLastPathComponent().appendingPathComponent(newFileName)
        try FileManager.default.moveItem(at: url, to: newURL)
        return newURL
    }

    // MARK: - Refresh

    /// Refresh the document list
    func refresh() {
        if isICloudAvailable {
            metadataQuery?.disableUpdates()
            metadataQuery?.enableUpdates()
        } else {
            loadLocalDocuments()
        }
    }
}

// MARK: - Document Metadata

/// Metadata for a TaskPaper document
struct DocumentMetadata: Identifiable, Equatable {
    var id: URL { url }
    let url: URL
    let name: String
    let lastModified: Date
    let isDownloaded: Bool
}

// MARK: - Errors

/// Errors that can occur in FileService
enum FileServiceError: LocalizedError {
    case loadFailed(Error?)
    case saveFailed(Error?)
    case deleteFailed(Error?)
    case noFileURL
    case iCloudUnavailable

    var errorDescription: String? {
        switch self {
        case .loadFailed(let error):
            return "Failed to load document: \(error?.localizedDescription ?? "Unknown error")"
        case .saveFailed(let error):
            return "Failed to save document: \(error?.localizedDescription ?? "Unknown error")"
        case .deleteFailed(let error):
            return "Failed to delete document: \(error?.localizedDescription ?? "Unknown error")"
        case .noFileURL:
            return "Document has no file URL"
        case .iCloudUnavailable:
            return "iCloud is not available"
        }
    }
}
