# Thread Panel Refinements

Three focused UI changes to the thread side panel and task inline editor.

## 1. Thread trigger moves to editor header

Move the thread access point from a separate footer row to a small icon in the editor header.

- Add a 💬 icon button in `TaskEditorFields` top-right, next to "Add tag"
- Show message count when > 0 (e.g., `💬 3`)
- Pass `onOpenThread` and `threadMessageCount` as optional props to `TaskEditorFields`
- Remove the separate footer `div` from `TaskInlineEditor` that held "Thread (N)" and "Delete"
- Move Delete into the action bar row (alongside ⌘↵ / Cancel / Save), styled as muted secondary text
- Project and initiative views keep their existing "Thread (N)" buttons (those are in the detail view, not the inline editor)

## 2. Panel background + collapse matches left sidebar

Make the right thread panel visually consistent with the left sidebar.

- **Background**: Remove `bg-[color:var(--surface)]` from `ThreadSidePanel`'s `<aside>` so it inherits from the page, matching the left sidebar
- **Collapse rail**: When the panel is closed but has been opened during the session, render a `ThreadCollapsedRail` — a 32px-wide strip with a 💬 icon to re-open, mirroring `WorkspaceCollapsedRail`
- Track `hasOpenedThreadPanel` state in `workspace-app.tsx` to know when to show the rail vs. nothing
- The rail uses `border-l border-[color:var(--row-divider)]` matching the sidebar's `border-r`

## 3. Remove double line under title

- Remove `border-b border-[color:var(--border)]` from the title textarea in `TaskEditorFields`
- Remove the matching `focus:border-[color:var(--border-strong)]` focus state
- The title-to-details separation is handled by the existing `mt-2` spacing on the details textarea

## Files changed

- `src/features/workspace/tasks/task-editor-fields.tsx` — add thread icon, remove title border-b, add Delete to action bar
- `src/features/workspace/tasks/task-inline-editor.tsx` — remove footer row, pass thread props through to TaskEditorFields
- `src/features/workspace/threads/thread-side-panel.tsx` — remove explicit bg
- `src/features/workspace/threads/thread-collapsed-rail.tsx` — new component (mirrors WorkspaceCollapsedRail)
- `src/features/workspace/workspace-app.tsx` — track hasOpenedThreadPanel, render rail when closed
- Tests updated to match new structure
