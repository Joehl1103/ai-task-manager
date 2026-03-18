# Command+K Global Search MVP Plan

## Goal

Add a global search pop-up that opens with `Cmd+K` on macOS and `Ctrl+K` on Windows/Linux so a user can quickly find any task, project, or initiative from anywhere in the workspace.

## Current State

- `src/features/workspace/workspace-app.tsx` is still local-state and localStorage first for initiatives, projects, and tasks.
- `src/features/workspace/workspace-navigation.ts` defines the top-level app sections: Tasks, Projects, Initiatives, and Configuration.
- Tasks already have a concrete destination via `selectedTaskId` and the task drill-down in `src/features/workspace/task-management-view.tsx`.
- Initiatives already support one navigation action by switching to the Projects view with an initiative filter.
- Projects do not have a finished open/select flow yet; `handleSelectProject` in `src/features/workspace/workspace-app.tsx` is still a stub.
- There is no existing global shortcut, command palette, or reusable dialog/overlay primitive in the current UI layer.

## MVP Decisions

- Keep the first pass local-state based. Search should read from the `workspace` data already loaded by `WorkspaceApp`.
- Do not depend on the Postgres/API layer for this feature.
- Search only for navigation, not commands or mutations.
- Use simple case-insensitive substring matching for the MVP.
- Make each result visually identify its entity type and parent context.
- Send task results to the existing task drill-down.
- Send project and initiative results to their existing list/card views, then scroll and temporarily highlight the selected card.
- Do not add project or initiative detail pages as part of this issue.

## Search Scope

- Initiatives:
  - name
  - description
- Projects:
  - name
  - linked initiative name
- Tasks:
  - title
  - details
  - tags
  - linked project name
  - linked initiative name

## UX Requirements

- Open the search pop-up with `Cmd+K` and `Ctrl+K`.
- Close it with `Escape`, backdrop click, or after selecting a result.
- Autofocus the search input when the pop-up opens.
- Show grouped or clearly labeled mixed results for tasks, projects, and initiatives.
- Support keyboard navigation with arrow keys and `Enter`.
- Show a helpful empty state when there are no matches.

## Implementation Shape

1. Add a pure search helper in the workspace feature that:
   - flattens initiatives, projects, and tasks into one searchable result list
   - attaches entity metadata and parent labels
   - returns filtered matches for a query string
2. Add a lightweight `GlobalSearchDialog` component in `src/features/workspace/`.
3. Wire a global key listener in `WorkspaceApp` for `Meta/Ctrl + K`.
4. Add app-shell navigation handlers for search selection:
   - task: switch to `tasks` and open the task drill-down
   - project: switch to `projects`, clear or set filters as needed, then scroll/highlight the matching project card
   - initiative: switch to `initiatives`, then scroll/highlight the matching initiative card
5. Add minimal selected/highlight state for project and initiative cards so search results have a visible landing target.

## Acceptance Criteria

- Pressing `Cmd+K` or `Ctrl+K` opens the search pop-up from any top-level menu.
- The search pop-up returns mixed results for tasks, projects, and initiatives from the current workspace state.
- Selecting a task opens that task in the existing drill-down.
- Selecting a project switches to the Projects view and makes the chosen project card easy to find.
- Selecting an initiative switches to the Initiatives view and makes the chosen initiative card easy to find.
- Search works against the fields listed in Search Scope.
- The feature works without switching the app to API-backed workspace reads.

## Out Of Scope

- Fuzzy ranking libraries or semantic search
- Server-backed search endpoints or database full-text search
- Command execution actions beyond opening entities
- Searching configuration settings or provider data
- Adding new project or initiative detail pages

## Verification

1. Add unit tests for the pure search helper so result shaping and matching are stable.
2. Add view-level tests for the dialog's rendered result labels and empty state where practical with the current test setup.
3. Manually verify:
   - open with `Cmd+K` and `Ctrl+K`
   - arrow through results
   - press `Enter`
   - confirm each entity lands in the expected screen and is visibly locatable
