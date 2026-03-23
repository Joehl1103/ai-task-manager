# Tasks View — Design Spec

**Issue:** #37 (supersedes #35)
**Date:** 2026-03-22
**Status:** Approved

---

## Overview

A new top-level view called **Tasks** that shows all active (non-completed) tasks across every project. Users can filter by project, due date, and remind date, and group results by project or tag.

The view replaces the unused `task-management-view.tsx` and lives in the sidebar between Inbox and Projects.

---

## Data Model Changes

### Consolidate `deadline` → `dueBy`

The `Task` type currently has three date fields: `deadline` (populated), `dueBy` (unused), and `remindOn` (unused). `deadline` and `dueBy` are semantically identical.

**Change:** Remove `deadline` from the `Task` interface, `AddTaskInput`, and `UpdateTaskInput`. Rename all usages to `dueBy` across every type, function, and caller. Migrate existing localStorage data so any task with a populated `deadline` value gets that value moved to `dueBy`.

After migration:

```typescript
interface Task {
  id: string;
  title: string;
  details: string;
  completed: boolean;
  projectId: string;
  dueBy: string;        // ISO date string, e.g. "2026-04-15"
  remindOn: string;      // ISO date string
  tags: string[];
  createdAt: string;
  completedAt: string;
  agentThread: AgentThread;
}
```

The `deadline` field is removed entirely — no backwards-compatibility shim.

**Note:** `Project.deadline` and `Initiative.deadline` are **intentionally left as-is**. Those are different concepts (project/initiative-level deadlines) and are out of scope for this rename. Only the `Task` type and its related input types change.

### localStorage migration

Update `normalizeTask()` in `workspace-storage.ts`:

1. When `dueBy` is falsy and `deadline` is truthy, set `dueBy` from `deadline`.
2. When both are truthy, prefer `dueBy` (the canonical field).
3. Stop including `deadline` in the returned `Task` object (remove the `deadline: readString(...)` line).

This runs automatically during the existing `normalizeWorkspace` hydration pipeline, so existing data migrates on the next page load.

---

## Navigation

### Sidebar

Add `"tasks"` to the `WorkspaceMenu` union type:

```typescript
type WorkspaceMenu = "inbox" | "tasks" | "projects" | "initiatives" | "archive" | "configuration";
```

In `workspace-sidebar.tsx`, add a Tasks `SidebarMenuButton` entry directly after the Inbox entry and before the Projects collapsible section. Use the `ListChecks` icon from lucide-react.

### Top menu

Add Tasks to the top menu dropdown in the same position.

### workspace-app.tsx

Add a `"tasks"` case to `renderActiveCenterContent()` that renders the new `TasksView` component.

---

## Tasks View Component

**File:** `src/features/workspace/tasks-view.tsx`

Replaces `src/features/workspace/task-management-view.tsx` (delete the old file).

### Layout (top to bottom)

1. **Heading** — `<h1>Tasks</h1>` (20px semibold, matches existing view headings)
2. **Filter row** — always visible, single row of text-styled dropdowns
3. **Grouping toggle** — `Grouped by: Project · Tag`
4. **Grouped task list** — sections with headers and task rows
5. **Empty state** — muted text when no tasks match the current filters

### Filter Row

A horizontal row of filter controls styled as plain muted text (11px). Each filter shows a label, current value, and a subtle chevron. On hover, text shifts from `--muted` to `--foreground`.

Filters:

| Filter | Label | Default | Options |
|--------|-------|---------|---------|
| Project | `Project:` | `All` | All, plus each visible project by name |
| Due by | `Due by:` | `Any` | Any, Overdue, Today, This week, This month |
| Remind on | `Remind on:` | `Any` | Any, Overdue, Today, This week, This month |

Each filter opens a small popover dropdown on click (styled consistently with existing popovers — subtle border, popover background, muted text items, active item gets muted background highlight).

**Filter logic (pure functions):**

Create `src/features/workspace/tasks/task-filters.ts`:

```typescript
type DateRangeFilter = "any" | "overdue" | "today" | "this-week" | "this-month";

interface TaskFilters {
  projectId: string | null;      // null = all projects
  dueBy: DateRangeFilter;
  remindOn: DateRangeFilter;
}

/** Returns tasks matching all active filters. */
function filterTasks(tasks: Task[], filters: TaskFilters, now: Date): Task[];

/** Returns true if a date string falls within the given range relative to now. */
function matchesDateRange(dateStr: string, range: DateRangeFilter, now: Date): boolean;

/** Default filter state (no filtering). */
function createDefaultTaskFilters(): TaskFilters;
```

Filters are AND-combined: a task must pass every active filter to appear.

### Grouping Toggle

Same pattern as the existing `GroupedTaskOverview`:

- `Grouped by` label in uppercase muted-strong text
- `Project` and `Tag` as text buttons separated by `·`
- Active mode is underlined in foreground color
- Clicking toggles the mode

Grouping mode is persisted in localStorage using the existing `taskGroupingModeStorageKey`.

### Task Rows

Each row shows:

- Completion circle (click to complete — 800ms fade, then moves to archive)
- Task title (13px, truncated)
- Tag pills (if any — same style as existing)
- Date badge (if task has `dueBy` or `remindOn`):
  - Overdue → red text (`rose-600`)
  - Due today or tomorrow → amber text
  - Future dates → muted text
  - Format: `Due Mar 23` or `Remind Mar 25`

Clicking the title opens the inline editor (same `TaskInlineEditor` used elsewhere).

### Empty State

When no tasks match the active filters:

- If filters are active: `"No tasks match the current filters."` with a `Clear filters` text button
- If no filters and no tasks: `"No tasks yet."`

---

## Filter Persistence

`TasksView` owns its own filter state internally — it is **not** lifted into `workspace-app.tsx`. This matches the existing pattern where views own their local UI state (e.g., `InboxView` owns `isComposerExpanded`).

Create a new localStorage key: `relay-tasks-filter` storing the serialized `TaskFilters` object. The `TasksView` component hydrates from localStorage on mount with fallback to `createDefaultTaskFilters()`, and persists on change.

Add the key constant to `workspace-storage.ts` exports.

---

## Files Affected

### New files
- `src/features/workspace/tasks-view.tsx` — the view component
- `src/features/workspace/tasks/task-filters.ts` — pure filter functions
- `src/features/workspace/tasks/task-filters.test.ts` — TDD tests

### Modified files
- `src/features/workspace/core/types.ts` — remove `deadline` from `Task`, `AddTaskInput`, and `UpdateTaskInput`; keep `dueBy` and `remindOn`
- `src/features/workspace/tasks/task-operations.ts` — replace `deadline`/`normalizeDeadline` with `dueBy`/`normalizeDueBy` equivalents; rename `updateTaskDeadline` to `updateTaskDueBy` (or remove if unused)
- `src/features/workspace/inbox-view.tsx` — rename `deadline` → `dueBy` in task creation/editing calls
- `src/features/workspace/project-view.tsx` — rename `deadline` → `dueBy` in task-related calls (note: `Project.deadline` stays as-is)
- `src/features/workspace/tasks/task-grouping.ts` — no change expected (groups by projectId)
- `src/features/workspace/tasks/index.ts` — re-export new filter module
- `src/features/workspace/storage/workspace-storage.ts` — add migration, add filter storage key
- `src/features/workspace/navigation/workspace-navigation.ts` — add `"tasks"` to menu union, add `case "tasks"` to `readWorkspaceMenuLabel` (label: `"Tasks"`) and `readWorkspaceMenuHint` (hint: `"All active tasks"`), update `allMenus` array
- `src/features/workspace/navigation/workspace-sidebar.tsx` — add Tasks entry
- `src/features/workspace/navigation/workspace-top-menu.tsx` — add Tasks entry
- `src/features/workspace/workspace-app.tsx` — add `"tasks"` routing case to `renderActiveCenterContent()`, rename `deadline` → `dueBy` in handler functions (`handleAddTask`, `handleSaveEdit`, etc.)
- `src/features/workspace/mock-data.ts` — rename `deadline` → `dueBy` in seed data

### Deleted files
- `src/features/workspace/task-management-view.tsx` — replaced by `tasks-view.tsx`

---

## Design Constraints

- Follows [no-chrome design rules](../no-chrome-design-rules.md)
- Follows [task editor design principles](../task-editor-design-principles.md)
- Filter controls are borderless text, not boxed inputs
- No shadows, no card containers for the filter area
- Hover states on every interactive element
- 11px for filter text, actions, hints (per design principles)

---

## Out of Scope

- Initiative filtering (placeholder for later — the filter architecture supports adding it)
- Calendar view or date picker for custom date ranges
- Sorting (can layer on after filtering proves useful)
- Task creation within the Tasks view (use Inbox for capture)
- Mobile optimization

---

## Verification

1. Tasks view appears in sidebar between Inbox and Projects
2. All active tasks visible when no filters applied
3. Completed tasks do not appear
4. Project filter narrows to selected project's tasks
5. Due-by filter narrows by date range (overdue, today, this week, this month)
6. Remind-on filter narrows by date range
7. Filters combine with AND logic
8. Grouping by project and tag both work
9. Filter and grouping selections persist across refresh
10. `deadline` → `dueBy` migration works (existing data preserved)
11. Date badges show correct color (red overdue, amber due-soon, muted future)
12. Empty state shows when no tasks match, with clear-filters option
13. Inline task editing works from within the Tasks view
14. No regressions in Inbox, Projects, Archive views
