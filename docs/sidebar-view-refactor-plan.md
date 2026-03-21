# Sidebar-First Workspace Refactor

## Summary
- Replace the top dropdown workspace shell with a left sidebar layout.
- Keep `Inbox`, `Projects`, `Initiatives`, and `Configuration` as top-level destinations.
- Make `Projects` and `Initiatives` expandable so they reveal clickable child items.
- Show the selected overview or entity page in the center workspace.
- Capture the finished desktop UI into Figma from the local app.

## Implementation Notes
- Add sidebar UI state for visibility and section expansion.
- Add an explicit center-view selection model for menu overviews, project pages, and initiative pages.
- Refactor workspace rendering so the center pane is driven by the new selection model.
- Reuse existing project and initiative views where practical, but wrap them in the new shell and add compact overview pages.
- Preserve existing task, thread, and configuration behavior where possible.

## Verification
- Update tests for the new navigation state and center-pane selection behavior.
- Run focused test coverage for navigation and workspace rendering.
- Run a production build if feasible.
- Start the local app and capture the implemented desktop layout into Figma.

## Assumptions
- Desktop-only for this pass.
- Sidebar collapse hides the panel rather than leaving an icon rail.
- Parent rows for `Projects` and `Initiatives` are both clickable destinations and togglable containers.
