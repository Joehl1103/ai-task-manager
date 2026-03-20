# Workspace Structure Refactor Plan

## Goal

Make the `src/features/workspace` area easier to reason about by grouping pure modules by responsibility while keeping behavior unchanged.

## Scope For This Pass

- Keep the top-level app and view components working as they do today.
- Move pure helper/state/domain modules into directories with clearer ownership.
- Update imports so the `workspace-app` entry point reads more like orchestration code.
- Run the existing test suite after the move.

## Proposed Structure

- `src/features/workspace/core`
  - domain types and entity operations
- `src/features/workspace/search`
  - global search helpers
- `src/features/workspace/storage`
  - workspace persistence and theme/grouping persistence helpers
- `src/features/workspace/threads`
  - thread ids, thread ownership, and thread context helpers

## Files To Reorganize

- `types.ts`
- `operations.ts`
- `initiative-operations.ts`
- `project-operations.ts`
- `workspace-storage.ts`
- `workspace-theme.ts`
- `global-search.ts`
- `thread-helpers.ts`
- `thread-context.ts`

## Non-Goals

- No UI redesign.
- No state-management rewrite.
- No API contract changes.
- No large naming cleanup unless needed to keep imports clear.
