# Archive View & Task Date Fields

## Summary

Add an Archive section as a top-level navigation destination showing completed tasks grouped by completion day. Extend the Task data model with date tracking fields.

## Data Model

Add to `Task` type:
- `createdAt: string` — ISO timestamp, set on creation
- `completedAt: string` — ISO timestamp, set on completion, cleared on un-complete
- `remindOn: string` — reserved, empty string
- `dueBy: string` — reserved, empty string

## Task Operations

- `addTask`: set `createdAt` to `new Date().toISOString()`, others to `""`
- `toggleTaskCompleted`: set/clear `completedAt` with ISO timestamp
- Existing inputs (`AddTaskInput`/`UpdateTaskInput`) unchanged — dates are system-managed

## Navigation

- Add "Archive" sidebar item with lucide `Archive` icon (file cabinet)
- Positioned after existing items

## Archive View

- New `archive-view.tsx` component
- Receives only completed tasks
- Groups by completion date day, labeled "Today"/"Yesterday"/formatted date
- Within each day: sorted by completion time, most recent first
- Click task row to see full read-only details
- Un-complete action restores task to active list

## Active List Behavior

- ~300ms fade-out on completion before removal
- Grouping functions filter out completed tasks
- Completed tasks only appear in Archive

## Migration

- `normalizeWorkspaceSnapshot` backfills `createdAt` to current time, `completedAt`/`remindOn`/`dueBy` to `""`
