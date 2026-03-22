# Issue 31 Plan

Source issue: `#31`

## Goal

Standardize task create and edit flows on the shared shadcn-style editor surface and replace the
custom tag combobox with a stock-looking tag picker while preserving the current keyboard-driven
workflow.

## Execution Notes

- Keep the dedicated issue-31 worktree and branch isolated from the main checkout.
- Rework `TaskEditorFields` into a shared labeled form layout using the existing shadcn-style
  `Button`, `Input`, `Textarea`, `Select`, `Separator`, and `Label` primitives.
- Reuse that shared editor for both inbox task creation and the general task management composer so
  task creation no longer splits between two different UI patterns.
- Replace the custom inline tag combobox with a popover-style tag picker that still supports
  selecting known tags, creating new tags, and removing selected tags.
- Preserve the current keyboard contracts: Cmd/Ctrl+Enter submits, Escape closes popovers first,
  then collapses or cancels the parent editor.
- Update the touched static-render and helper tests to match the new shared form composition.
- Verify the slice with targeted tests, then broader lint and test runs if the local environment
  cooperates.
