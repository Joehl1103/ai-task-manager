# Group Tasks By Tag

## Goal

Add the ability to view tasks grouped by tag in addition to the existing project-based grouping, allowing users to see all tasks with a specific tag together without building a full filtering system. This complements the project grouping and provides another lightweight lens for task organization.

## Context

- The app currently groups tasks by project in the overview using `groupTasksByProject()` in `src/features/workspace/task-grouping.ts`.
- Tasks now have a `tags: string[]` field that was recently added.
- Task grouping logic is centralized in `src/features/workspace/task-grouping.ts` with corresponding tests in `task-grouping.test.ts`.
- The overview renderer in `src/features/workspace/task-management-view.tsx` currently calls `groupTasksByProject()` to organize the display.
- View switching already exists via `activeView` state in `workspace-app.tsx` for switching between Tasks and Configuration.
- Tag badges are now styled with rounded corners and a darker grey color for visual distinction.

## Decisions

- Add a new view mode "task-tags" alongside the existing "tasks" (project) view, rather than combining both groupings on a single view.
- Implement a `groupTasksByTag()` function parallel to `groupTasksByProject()` that returns a similar `TaskGroup[]` structure.
- Keep the view switcher minimal by using the existing top-menu pattern; add a secondary tab or mode selector to choose between project and tag grouping within the Tasks view.
- Tasks without any tags should appear in a clearly labeled "No tags" group at the end of the tag-grouped view.
- Within each tag group, preserve task order (newest first, matching the overall list order).
- Keep tag grouping as read-only for now; no tag management UI is added in this pass.

## Assumptions

- Users will occasionally want to see all tasks with a specific tag together for quick scanning.
- The lightweight tab/mode switcher fits the app's minimal aesthetic better than adding a full filter UI.
- Tag grouping is secondary to project grouping, so it can live behind a simple toggle or button rather than a main menu item.
- Existing saved workspaces don't need migration; tag grouping is a new view feature only.

## Proposed Changes

### Phase 1

- Extract a `groupTasksByTag()` function in `src/features/workspace/task-grouping.ts` that:
  - Accepts a flat `Task[]` list
  - Returns a `TaskGroup[]` sorted alphabetically by tag (or by first occurrence)
  - Places tasks without tags in a "No tags" fallback group at the end
  - Preserves task order within each group
  - Handles edge cases like empty lists and single-tag tasks
- Add unit tests in `task-grouping.test.ts` to cover tag grouping logic, including:
  - Grouping by multiple distinct tags
  - Handling tasks with no tags
  - Preserving task order within groups
  - Empty task list behavior

### Phase 2

- Add a lightweight view-mode toggle in the Tasks view (e.g., a button or inline tabs) that switches between:
  - "By Project" (existing behavior)
  - "By Tag" (new grouping)
- Wire the toggle to a new state variable `taskGroupingMode` in `workspace-app.tsx`, defaulting to "project".
- Update the overview renderer in `GroupedTaskOverview` to call either `groupTasksByProject()` or `groupTasksByTag()` based on the active mode.
- Ensure the toggle persists the user's choice via local storage alongside workspace data.

### Phase 3

- Refine the visual treatment of the mode toggle to match the app's minimal style:
  - Keep it subtle but discoverable.
  - Consider placing it as a small button near the "Tasks" header or as a secondary element in the overview section.
  - Add a tooltip or inline label so the current mode is always clear.
- Update any relevant documentation or in-app copy to mention the tag grouping option.

### Phase 4

- Smoke test both grouping modes with the seed data (which now includes representative tags).
- Verify that switching modes preserves the selected task if one is open.
- Test edge cases:
  - A task with multiple tags should appear in each of its tag groups.
  - Deleting a task should remove it from all tag groups.
  - Editing a task's tags should update its position across groups.
- Run the full test suite and build to confirm no regressions.

## Files Or Systems Likely Affected

- `task-manager/src/features/workspace/task-grouping.ts` (add `groupTasksByTag()` function)
- `task-manager/src/features/workspace/task-grouping.test.ts` (add tests for tag grouping)
- `task-manager/src/features/workspace/workspace-app.tsx` (add `taskGroupingMode` state and persistence)
- `task-manager/src/features/workspace/task-management-view.tsx` (add mode toggle button; update overview logic)
- `task-manager/src/features/workspace/workspace-storage.ts` (potentially add `taskGroupingMode` to workspace snapshot if persisting mode choice)

## Risks And Unknowns

- A task with multiple tags will appear in multiple groups, which could make the list feel longer or more complex. This is acceptable for a lightweight MVP and aligns with common tag-based views.
- If tag naming becomes inconsistent (e.g., "work" vs "Work"), grouping will show separate groups. This is a known issue documented in the original tag implementation and acceptable for now.
- The mode toggle placement could be unclear if not designed carefully. A clear label and/or icon is important.
- If grouping modes grow beyond two options (e.g., adding "by due date" or "by priority" later), the toggle UI will need to scale. For now, a simple binary toggle is sufficient.

## Verification

1. Run `npm test` from `task-manager/` to confirm all tests pass, including new tag grouping tests.
2. Run `npm run lint` to check code style.
3. Run `npm run build` to verify the production build succeeds.
4. Manually test:
   - View tasks grouped by project (existing behavior).
   - Switch to tag grouping and verify tasks are grouped correctly.
   - Verify tasks with no tags appear in a "No tags" group.
   - Verify tasks with multiple tags appear in each respective tag group.
   - Switch back to project grouping and confirm the view resets correctly.
   - Refresh the browser and verify the mode choice persists.
   - Open a task in one grouping mode, switch modes, and verify the selected task is still highlighted/accessible.
5. Verify the mode toggle is visually subtle and discoverable.

## Success Criteria

1. Tag grouping is implemented and tested with full coverage.
2. Users can toggle between project and tag grouping views.
3. The mode choice persists across browser sessions.
4. All existing tests pass; no regressions.
5. The UI is lightweight and consistent with the app's minimal aesthetic.
