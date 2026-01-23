# TaskPaper iOS Client

A minimalist iOS TaskPaper client built with SwiftUI, featuring iCloud sync and tag-based filtering.

## Features

- **Native SwiftUI Interface**: Modern, clean UI optimized for iPhone
- **iCloud Sync**: Automatic document synchronization via iCloud Documents
- **Tag-Based Filtering**: Powerful search with boolean logic (`@done`, `not @done`, `@priority(1) and not @done`)
- **TaskPaper Format Compatibility**: Full support for the standard `.taskpaper` format
- **Gesture-Based Interactions**: Swipe to complete, swipe to delete, pinch to fold/unfold

## Architecture

```
TaskPaperApp/
├── App/
│   └── TaskPaperApp.swift          # App entry point
├── Models/
│   ├── Document.swift              # TaskPaper document model
│   ├── Item.swift                  # Item (project/task/note) model
│   └── Tag.swift                   # Tag parsing and model
├── ViewModels/
│   ├── DocumentViewModel.swift     # Document editing state
│   ├── SidebarViewModel.swift      # Document list management
│   └── SearchViewModel.swift       # Search/filter state
├── Views/
│   ├── ContentView.swift           # Main navigation
│   ├── SidebarView.swift           # Document list
│   ├── EditorView.swift            # Document editor
│   └── ItemRowView.swift           # Individual item display
├── Services/
│   ├── Parser.swift                # TaskPaper format parser
│   └── FileService.swift           # iCloud document management
└── Utilities/
    ├── SearchEngine.swift          # Tag-based search
    ├── GestureModifiers.swift      # Custom gestures
    └── ViewModifiers.swift         # UI polish components
```

## File Format

Plain text `.taskpaper` files matching the desktop TaskPaper format:

```
Project Name:
	- Task item @tag
	- Another task @priority(1)
		Note underneath task
	- Completed @done(2024-01-15)
```

### Item Types
- **Project**: Line ending with `:` (after content, before tags)
- **Task**: Line starting with `- ` (after indentation)
- **Note**: Any other line

### Tags
- Simple tag: `@tagname`
- Tag with value: `@tagname(value)`
- Tags are parsed from anywhere in the line

## Search Query Syntax

| Query | Description |
|-------|-------------|
| `@done` | Items with @done tag |
| `not @done` | Items without @done tag |
| `@priority(1)` | Items with @priority tag value of 1 |
| `@work and not @done` | Work items that aren't done |
| `project` | Only project items |
| `task` | Only task items |
| `note` | Only note items |

## Requirements

- iOS 17.0+
- Xcode 15.0+
- Swift 5.9+

## Setup

1. Open `TaskPaperApp.xcodeproj` in Xcode
2. Update the `PRODUCT_BUNDLE_IDENTIFIER` to your own
3. Configure your development team for code signing
4. Enable iCloud capability in Signing & Capabilities
5. Build and run

## iCloud Configuration

The app requires iCloud Documents capability:
- Container identifier: `iCloud.$(PRODUCT_BUNDLE_IDENTIFIER)`
- Documents are stored in the app's iCloud Documents container

## Next Steps

### Before First Run

1. **Open the project in Xcode**
   ```bash
   open TaskPaperApp.xcodeproj
   ```

2. **Update Bundle Identifier**
   - Open project settings (click on TaskPaperApp in the navigator)
   - Change `PRODUCT_BUNDLE_IDENTIFIER` from `com.yourcompany.TaskPaperApp` to your own identifier

3. **Configure Code Signing**
   - Select your development team in Signing & Capabilities
   - Xcode will create the necessary provisioning profiles

4. **Enable iCloud Capability**
   - Go to Signing & Capabilities tab
   - Click "+ Capability" and add "iCloud"
   - Check "iCloud Documents"
   - Verify the container identifier matches: `iCloud.$(PRODUCT_BUNDLE_IDENTIFIER)`

5. **Build and Run**
   - Select an iPhone simulator or device
   - Press Cmd+R to build and run

### Testing Checklist

- [ ] Create a new document and add items
- [ ] Test swipe-right to toggle @done
- [ ] Test swipe-left to delete
- [ ] Test search filters: `@done`, `not @done`, `project`
- [ ] Verify documents appear in iCloud Drive (Files app)
- [ ] Open the included `Sample.taskpaper` to test parsing

### Recommended Enhancements

1. **Add App Icon**: Replace placeholder in `Assets.xcassets/AppIcon.appiconset`
2. **Customize Accent Color**: Modify `Assets.xcassets/AccentColor.colorset`
3. **Add Unit Tests**: Create test targets for Parser and SearchEngine
4. **Localization**: Add string catalogs for internationalization

### Known Limitations (v1)

- iPhone only (no iPad optimization)
- No keyboard shortcuts
- Basic conflict resolution (UIDocument default behavior)
- No offline sync queue

## License

MIT License - See LICENSE file for details
