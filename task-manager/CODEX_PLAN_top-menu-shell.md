# Top Menu Shell For Tasks And Configuration

## Goal

Separate task management from configuration in the Relay app without introducing a heavy navigation system. The next feature should replace the idea of a collapsible left sidebar with a thin, desktop-only top menu that defaults to the task view and lets the user switch to configuration when needed.

## Context

- The app currently renders everything inside [`src/features/workspace/workspace-app.tsx`](/Users/josephshomefolder/development/productivity/task-manager/src/features/workspace/workspace-app.tsx).
- Agent configuration is an inline section above task creation and the task overview / drill-down area.
- [`src/app/page.tsx`](/Users/josephshomefolder/development/productivity/task-manager/src/app/page.tsx) simply mounts `WorkspaceApp`, so the navigation change can stay inside the existing single-page shell.
- Current styling is minimal and neutral in [`src/app/globals.css`](/Users/josephshomefolder/development/productivity/task-manager/src/app/globals.css), which fits a restrained top-menu treatment.
- Existing automated tests focus on pure workspace/provider helpers rather than DOM-heavy UI flows, so verification will likely combine existing automated checks with manual UI smoke testing.

## Decisions

- Use a desktop-only top menu instead of a left sidebar.
- Keep the top menu very thin and visually lightweight.
- Default the app to the tasks view on load.
- Treat `Tasks` and `Configuration` as separate top-level views inside the same page shell.
- Keep the menu collapsed/minimal by default, with a clear icon/button to reveal or emphasize navigation options.

## Assumptions

- No URL routing is needed yet; view switching can remain local component state.
- Mobile-specific navigation behavior is out of scope for this pass.
- The existing task drill-down behavior should stay intact within the `Tasks` view.
- Configuration content can move mostly as-is into a dedicated view before any deeper provider UX redesign.

## Proposed Changes

### Phase 1

- Introduce a small app-shell state model for the active top-level view, defaulting to `tasks`.
- Extract the current inline agent settings block into a dedicated configuration view component.
- Extract the existing task creation plus overview / drill-down content into a dedicated tasks view component.
- Add a thin top navigation bar component with:
- a minimal menu trigger/icon
- a `Tasks` destination
- a `Configuration` destination
- active-state styling that stays subtle but clear

### Phase 2

- Rework the page layout so the top menu sits above the current content card rather than beside it.
- Ensure the tasks view still preserves:
- add task flow
- task overview list
- task drill-down
- inline edit mode
- inline agent call panel
- Ensure the configuration view preserves:
- OpenAI API key editing
- model editing
- provider readiness badge / status messaging
- local-storage persistence behavior

### Phase 3

- Refine the visual treatment so the top menu feels intentionally slim rather than like a full navbar.
- Adjust copy where needed so references like "settings above" no longer point to the old layout.
- Add or update any small pure tests if view-state helpers are extracted.

## Files Or Systems Likely Affected

- `task-manager/src/features/workspace/workspace-app.tsx`
- `task-manager/src/app/page.tsx`
- `task-manager/src/app/globals.css`
- `task-manager/src/features/workspace/provider-config.ts`
- Potential new files under `task-manager/src/features/workspace/` for:
- `workspace-shell` or equivalent
- `workspace-top-menu`
- `tasks-view`
- `configuration-view`

## Risks And Unknowns

- `WorkspaceApp` currently owns a lot of local state, so the main implementation risk is making the component harder to reason about while adding navigation.
- Some instructional copy currently assumes configuration lives "above" the task UI; those references will need to be found and updated.
- If the "collapsed by default" requirement is interpreted too literally, the top menu could become harder to discover than intended. The implementation should favor a slim shell with a clearly visible trigger over a fully hidden control.
- Because there is not yet a component-test stack for the UI shell, regressions in view switching will need manual verification unless we add a small new test surface.

## Verification

1. Run `npm test` from `task-manager/`.
2. Run `npm run lint` from `task-manager/`.
3. Run `npm run build` from `task-manager/`.
4. Manually verify the default landing view is `Tasks`.
5. Manually verify the top menu remains slim on desktop and clearly exposes the navigation control.
6. Manually verify switching to `Configuration` shows provider settings and hides the task-management workflow.
7. Manually verify switching back to `Tasks` preserves task interactions, including drill-down and agent panel behavior.
8. Manually verify configuration edits still persist through browser refresh via local storage.
