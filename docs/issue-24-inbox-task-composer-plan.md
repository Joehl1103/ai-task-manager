# Issue 24 Plan

Source issue: `#24`

Reference spec: [`docs/superpowers/specs/2026-03-21-inbox-task-composer-design.md`](./superpowers/specs/2026-03-21-inbox-task-composer-design.md)

## Execution Notes

- Extract the inbox composer into a dedicated `InboxTaskComposer` component so the visual redesign and keyboard behavior stay isolated from the inbox list and drill-down code.
- Replace the boxed full-input form with a contained no-chrome composer that uses an underline title field, borderless details area, inline tag pills, and a quieter project picker.
- Derive autocomplete tags from every task in the workspace with case-insensitive deduplication so the composer can suggest existing tags without changing the task data model.
- Keep the parent draft contract string-based for now by converting the composer tag UI back into the existing comma-separated `newTaskTags` field.
- Add a dedicated inbox-only `Cmd+N` effect in `workspace-app.tsx` and reset the composer request plus draft state when the user leaves the inbox view.
- Verify the new composer helpers and inbox render output with targeted tests, then run the relevant Vitest suite.
