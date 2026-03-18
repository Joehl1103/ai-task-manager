# Entity Thread Parity Scope

## Goal

Scope the remaining work needed to feel confident that project-level and initiative-level agent thread conversations match the task-level experience.

## Current State

The merged entity-thread work already includes the core feature:

- Shared thread UI in `src/features/workspace/agent-thread-panel.tsx`
- Project thread rendering in `src/features/workspace/project-view.tsx`
- Initiative thread rendering in `src/features/workspace/initiative-view.tsx`
- Owner-aware context and placeholder support in `src/features/workspace/thread-context.ts`
- Owner-aware send/delete/update flows in `src/features/workspace/workspace-app.tsx`
- Owner-aware API route handling in `src/app/api/agent-call/route.ts`
- Thread persistence and migration support in `src/features/workspace/workspace-storage.ts`

## Assumption

Interpret the follow-up request as: scope the remaining confidence and polish work around project and initiative thread conversations, not re-add the feature from scratch.

## Recommended Scope

### 1. Add Missing View-Level Tests

- Add stronger dedicated `project-view` coverage
- Extend `initiative-view.test.tsx`
- Cover:
  - showing the thread toggle with the message count
  - rendering the shared thread panel when expanded
  - wiring the correct placeholder text for project vs initiative
  - showing existing thread history from seeded data

### 2. Add Owner-Specific Behavior Coverage

- Extend tests around `workspace-app.tsx` or extract more pure helpers
- Verify project and initiative sends use:
  - the correct owner type
  - the correct owner name
  - the correct context summary
- Add explicit delete-message coverage for project and initiative owners

### 3. Tighten Persistence Confidence

- Extend storage tests to cover saved project and initiative thread drafts/history
- Verify older snapshots without project or initiative threads still normalize safely

### 4. Optional UX Polish

- Consider making the thread disclosure copy more explicit:
  - `Show project thread`
  - `Show initiative thread`
- Consider reusing a tiny disclosure helper for project and initiative cards to reduce duplicated open/close logic

## Out Of Scope Unless You Want Extra Polish

- Streaming responses
- Cross-entity linked thread timelines
- Separate per-entity model/provider configuration
- Server-backed thread persistence

## Verification

- `npm test`
- `npm run lint`
- Manual smoke check in the browser:
  - open a project thread
  - open an initiative thread
  - send a message in each
  - delete one message in each
  - reload and confirm thread history persists
