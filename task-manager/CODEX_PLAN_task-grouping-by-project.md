# Group Tasks By Project

## Goal

Add lightweight project grouping to the Relay task overview so users can scan related tasks together without turning the prototype into a full project-management system.

## Context

- The app currently lives under `task-manager/` and keeps all task state in a flat `WorkspaceSnapshot` with `tasks: Task[]`.
- `Task` currently includes only `id`, `title`, `details`, and `agentCalls` in [`task-manager/src/features/workspace/types.ts`](/Users/josephshomefolder/development/productivity/task-manager/src/features/workspace/types.ts).
- New tasks are created and edited through [`task-manager/src/features/workspace/workspace-app.tsx`](/Users/josephshomefolder/development/productivity/task-manager/src/features/workspace/workspace-app.tsx) and [`task-manager/src/features/workspace/task-management-view.tsx`](/Users/josephshomefolder/development/productivity/task-manager/src/features/workspace/task-management-view.tsx).
- Local persistence is browser-only and normalized through [`task-manager/src/features/workspace/workspace-storage.ts`](/Users/josephshomefolder/development/productivity/task-manager/src/features/workspace/workspace-storage.ts), so backward compatibility with existing saved tasks matters.
- Existing automated coverage is strongest around pure helpers and data operations in [`task-manager/src/features/workspace/operations.test.ts`](/Users/josephshomefolder/development/productivity/task-manager/src/features/workspace/operations.test.ts), [`task-manager/src/features/workspace/task-overview.test.ts`](/Users/josephshomefolder/development/productivity/task-manager/src/features/workspace/task-overview.test.ts), and [`task-manager/src/features/workspace/workspace-storage.test.ts`](/Users/josephshomefolder/development/productivity/task-manager/src/features/workspace/workspace-storage.test.ts).

## Decisions

- Keep the workspace storage shape centered on a flat `tasks[]` list for this pass.
- Add an optional project field directly on each task instead of introducing a separate `Project` entity and project-management UI.
- Group only the overview list by project; keep drill-down, selection, and agent history task-centric.
- Preserve existing task order inside each group so the newest-first behavior still feels familiar.
- Treat tasks with no project as a clearly labeled fallback group instead of hiding or discarding them.

## Assumptions

- The requested feature is grouping tasks visually by project, not building full project CRUD, project pages, or cross-project analytics.
- A plain text project assignment field is acceptable for the first pass.
- Existing saved workspaces should continue loading without any manual migration step from the user.
- If project naming collisions or rename workflows become important later, that can justify a normalized `projects` collection in a follow-up change.

## Proposed Changes

### Phase 1

- Extend the task model with an optional `project` field in `Task`, `AddTaskInput`, and `UpdateTaskInput`.
- Update add/edit operations so project values are trimmed and persisted alongside title/details.
- Update seed data to include representative project assignments for at least part of the mock workspace.
- Update storage normalization so older saved tasks without `project` still load cleanly with an empty project value.

### Phase 2

- Extract a pure grouping helper, likely in a new module such as `src/features/workspace/task-grouping.ts`, that:
- converts the flat task list into overview sections
- collapses blank project values into a fallback label such as `No project`
- preserves task order within each section
- returns lightweight metadata such as section title and task count for the UI
- Add focused unit tests for the grouping helper rather than embedding grouping behavior directly inside the JSX.

### Phase 3

- Add an optional `Project` input to the new-task form in `task-management-view.tsx`.
- Add project editing to the task drill-down edit state managed by `workspace-app.tsx`.
- Rework the overview renderer so it outputs project sections with headings and grouped task cards instead of one unbroken task list.
- Show the task’s project in the overview card and drill-down header when present so the grouping stays legible after a task is opened.
- Keep delete, edit, task-open, and agent-call behaviors unchanged apart from the new project metadata flowing through them.

### Phase 4

- Update copy in the Tasks view to describe the overview as project-grouped instead of a single flat list.
- Update README and CLAUDE references to mention project grouping if the implementation meaningfully changes product scope.
- Run the full validation pass and do a manual browser smoke test against both fresh state and previously saved local-storage state.

## Files Or Systems Likely Affected

- `task-manager/src/features/workspace/types.ts`
- `task-manager/src/features/workspace/operations.ts`
- `task-manager/src/features/workspace/operations.test.ts`
- `task-manager/src/features/workspace/workspace-storage.ts`
- `task-manager/src/features/workspace/workspace-storage.test.ts`
- `task-manager/src/features/workspace/mock-data.ts`
- `task-manager/src/features/workspace/task-management-view.tsx`
- `task-manager/src/features/workspace/workspace-app.tsx`
- `task-manager/src/features/workspace/task-overview.ts`
- `task-manager/src/features/workspace/task-overview.test.ts`
- `task-manager/src/features/workspace/task-grouping.ts` (new)
- `task-manager/src/features/workspace/task-grouping.test.ts` (new)
- `task-manager/README.md`
- `task-manager/CLAUDE.md`

## Risks And Unknowns

- A free-text project field is the smallest implementation, but it can create near-duplicate groups from spelling or casing differences. That is acceptable for the first pass, but it is the clearest reason to later graduate to a normalized project model.
- The current app is built around a compact single list, so project headers could make the overview feel heavier. The UI should keep section chrome light and avoid turning this into a dense board.
- Existing browser data will be missing the new field, so storage normalization must be tested explicitly to avoid breaking older saved sessions.
- If the user actually wants project creation, renaming, sorting, or archived projects, this plan is intentionally too small and should be expanded before implementation.

## Verification

1. Run `npm test` from `task-manager/`.
2. Run `npm run lint` from `task-manager/`.
3. Run `npm run build` from `task-manager/`.
4. Manually verify a brand-new task can be created with and without a project.
5. Manually verify editing a task can add, change, and clear its project.
6. Manually verify the overview renders separate project sections while keeping task actions working.
7. Manually verify older local-storage data without `project` still loads into a visible fallback group after refresh.
