# TaskPaper iOS Client - Project Context

## Project Overview

A minimalist iOS TaskPaper client built with SwiftUI. The app provides document management with iCloud sync and tag-based filtering for TaskPaper format files.

## Key Technologies

- **SwiftUI** for UI
- **UIDocument** for iCloud document sync
- **NSMetadataQuery** for iCloud file monitoring
- **Combine** for reactive bindings

## Architecture Decisions

### Fresh SwiftUI Implementation
- Built from scratch using modern SwiftUI patterns
- Not a refactor of the legacy Objective-C codebase (NOTTaskPaperForIOS)
- MVVM architecture with ObservableObject ViewModels

### iCloud Sync Strategy
- Uses UIDocument-based approach (not CloudKit directly)
- NSMetadataQuery monitors for file changes
- Automatic conflict resolution via UIDocument
- Falls back to local Documents when iCloud unavailable

### Search Engine
- Custom predicate-based filtering
- Supports boolean operations (AND, OR, NOT)
- Type predicates for project/task/note filtering
- Tag presence and value matching

## File Structure

```
TaskPaperApp/
├── App/TaskPaperApp.swift         - @main entry point
├── Models/
│   ├── Item.swift                 - Core item model (project/task/note)
│   ├── Tag.swift                  - Tag parsing with regex
│   └── Document.swift             - Document container
├── ViewModels/
│   ├── DocumentViewModel.swift    - Edit state, undo/redo
│   ├── SidebarViewModel.swift     - Document list, saved searches
│   └── SearchViewModel.swift      - Filter suggestions
├── Views/
│   ├── ContentView.swift          - NavigationSplitView root
│   ├── SidebarView.swift          - Document/search list
│   ├── EditorView.swift           - Item list + filter bar
│   └── ItemRowView.swift          - Individual item row
├── Services/
│   ├── Parser.swift               - TaskPaper format parser
│   └── FileService.swift          - iCloud document operations
└── Utilities/
    ├── SearchEngine.swift         - Predicate-based filtering
    ├── GestureModifiers.swift     - Swipe, pinch, drag gestures
    └── ViewModifiers.swift        - Loading, toast, animations
```

## TaskPaper Format Rules

Parsing logic (from legacy `TaskPaperSection.m`):
1. Count leading tabs for indent level
2. Check for `- ` prefix → Task
3. Check for trailing `:` (before tags) → Project
4. Otherwise → Note
5. Tags parsed via regex: `@name` or `@name(value)`

## Important Patterns

### Item Hierarchy
- Items can have children via `children` array
- `indentLevel` tracks visual depth
- `parent` weak reference for tree traversal

### Undo/Redo
- Deep copy state before mutations
- Stack-based undo/redo in DocumentViewModel

### Auto-Save
- Debounced 1-second delay after edits
- Saves via FileService.saveDocument

## Testing Guidance

1. **Parser round-trip**: Create test `.taskpaper` content, parse, serialize, compare
2. **Search filters**: Test `@done`, `not @done`, `@tag(value) and not @done`
3. **iCloud sync**: Create/edit on device, verify in iCloud Drive
4. **Gestures**: Swipe right for done, swipe left for delete

## Future Enhancements (Out of Scope for v1)

- iPad optimization
- Keyboard shortcuts
- Full XPath-like query language
- Dropbox sync
- TextExpander integration
