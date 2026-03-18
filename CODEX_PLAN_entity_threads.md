# Entity-Scoped Agent Threads

## Goal

Add a built-in conversational thread to every task, project, and initiative so a human and the agent can continue an ongoing conversation in context. The first implementation should stay localStorage-first so we can keep iterating on the product architecture without locking the feature into the current Postgres/API shape too early.

## Context

- The active app shell in `src/features/workspace/workspace-app.tsx` already treats browser localStorage as the source of truth for workspace data.
- Tasks currently have a task-specific `agentCalls` array, while projects and initiatives have no equivalent conversation model.
- There is also a Postgres + route layer in `src/db/schema.ts` and `src/app/api/*`, but the current UI flow is not using it as the main persistence source for the workspace shell.
- The current live agent endpoint, `src/app/api/agent-call/route.ts`, is task-scoped and expects one-shot inputs (`taskTitle`, `taskDetails`, `brief`) rather than a reusable thread transcript.
- Initiatives already have descriptions. Projects currently do not.

## Decisions

- Ship thread support for `task`, `project`, and `initiative` in the first version.
- Use exactly one built-in agent thread per entity.
- Keep the first version localStorage-first.
- Treat the existing Postgres/API layer as out of scope for first-pass thread persistence.

## Assumptions

- We do not need multi-thread support per entity yet, but we should name types and helpers so that adding it later is possible.
- The task agent UX can evolve from “saved agent calls” into a real message thread without needing to preserve the exact old UI wording.
- Project-level context can be useful without immediately wiring a full DB migration.
- Recommended assumption: add a `description` field to `Project` during this feature so project threads have first-class human-authored context, not just child task summaries.

## Proposed Changes

### Phase 1: Replace Task-Only Agent History With A Generic Thread Model

- Introduce shared thread types in `src/features/workspace/types.ts`.
- Replace `AgentCall` with a more general message/thread model along these lines:
  - `ThreadOwnerType = "task" | "project" | "initiative"`
  - `ThreadMessageRole = "human" | "agent"`
  - `ThreadMessageStatus = "done" | "error"` for agent messages that may fail
  - `AgentThreadMessage` containing `id`, `role`, `content`, `createdAt`, and optional provider/model/status/error metadata
  - `AgentThread` containing `id`, `ownerType`, `ownerId`, and `messages`
- Add one thread to each entity shape:
  - `Task.agentThread`
  - `Project.agentThread`
  - `Initiative.agentThread`
- Keep each thread eagerly present with `messages: []` so the UI and immutable update helpers stay simple.

### Phase 2: Migrate Existing Local Data Safely

- Update `src/features/workspace/workspace-storage.ts` to normalize the new thread shape for tasks, projects, and initiatives.
- Add a migration path from legacy task `agentCalls` into `task.agentThread.messages`.
- Convert each old task `agentCall` into a pair of thread messages when possible:
  - human message from `brief`
  - agent message from `result`, or an error-status agent message from `error`
- Continue supporting older saved snapshots that have:
  - no threads at all
  - task `agentCalls`
  - old project-string task format
- Update `createDefaultWorkspaceSnapshot` and `mock-data.ts` to seed entities with thread objects instead of task-only `agentCalls`.

### Phase 3: Generalize Immutable Operations

- Refactor task-only agent helpers in `src/features/workspace/operations.ts` into entity-thread helpers.
- Introduce thread operations that can:
  - append a human message to a task/project/initiative thread
  - append an agent reply to a task/project/initiative thread
  - append an agent error reply
  - delete one thread message if we still want per-message deletion
- Represent the current thread target with a stable owner reference such as:
  - `{ ownerType: "task", ownerId: "task-1" }`
- Keep operations pure and entity-agnostic so the app shell can reuse the same logic across all three entity types.

### Phase 4: Generalize Prompt Construction And Agent Calling

- Replace the task-only request contract in `src/app/api/agent-call/route.ts` with an entity-thread request contract.
- The route payload should carry:
  - entity type
  - entity identity and human-readable name
  - entity context summary
  - full thread transcript for that entity
  - provider/model/api key
- Add a shared context builder in the workspace feature layer:
  - task context: title, details, project name, initiative name, deadline, tags
  - project context: name, description if added, initiative name, deadline, child task summaries
  - initiative context: name, description, deadline, child project summaries
- Keep the first pass conservative about context size:
  - include the current entity’s own thread
  - include lightweight child summaries only
  - do not include descendant entities’ thread transcripts
- Update `provider-api.ts` so the model sees a conversation transcript plus current entity context instead of one-shot task fields.

### Phase 5: Introduce Reusable Thread UI

- Extract a reusable thread component for:
  - message list
  - composer
  - pending state
  - provider/model label
  - error display
- Replace the task “agent calls” section in `src/features/workspace/task-management-view.tsx` with the reusable thread UI.
- Add the same thread UI to project cards in `src/features/workspace/project-view.tsx`.
- Add the same thread UI to initiative cards in `src/features/workspace/initiative-view.tsx`.
- Keep the surrounding UX simple:
  - tasks continue to show the thread in the selected task drill-down
  - projects and initiatives use a collapsible “Open thread” or “Show thread” section within each card
- Rename UI copy from “agent calls” / “saved agent contribution” to “thread”, “messages”, or similar neutral conversation language.

### Phase 6: App-Shell Wiring

- Update `src/features/workspace/workspace-app.tsx` to track thread draft state generically rather than task-only drafts.
- Replace `openAgentTaskId`, `pendingTaskId`, and task-specific draft maps with owner-based state keyed by entity type + id.
- Reuse a shared helper to read and write draft state for any entity thread.
- Make the send flow:
  1. add the human message locally
  2. call the generalized agent route
  3. append the agent reply or error message
  4. persist through the existing localStorage workspace save flow

### Phase 7: Optional Project Description Support

- If we accept the recommendation, add `description` to `Project` in:
  - `src/features/workspace/types.ts`
  - `src/features/workspace/project-view.tsx`
  - `src/features/workspace/project-operations.ts`
  - `src/features/workspace/workspace-storage.ts`
  - `src/features/workspace/mock-data.ts`
  - related tests
- If we defer it, use project name + initiative + child task summaries as the first-pass project context and keep this as a follow-up task.

## Files Or Systems Likely Affected

- `src/features/workspace/types.ts`
- `src/features/workspace/workspace-storage.ts`
- `src/features/workspace/workspace-app.tsx`
- `src/features/workspace/operations.ts`
- `src/features/workspace/mock-data.ts`
- `src/features/workspace/task-management-view.tsx`
- `src/features/workspace/project-view.tsx`
- `src/features/workspace/initiative-view.tsx`
- `src/features/workspace/delete-confirmation.ts`
- `src/features/workspace/task-overview.ts`
- `src/features/workspace/provider-api.ts`
- `src/app/api/agent-call/route.ts`
- tests under `src/features/workspace/*.test.ts*`

## Risks And Unknowns

- The current codebase has two partially overlapping persistence stories: browser localStorage and Postgres/API routes. If we are not explicit, the thread feature could accidentally deepen that split.
- Migrating `agentCalls` to conversational messages is straightforward, but we should verify the old UI does not rely on metadata that disappears during the conversion.
- Project context quality depends on whether we add a dedicated description field.
- Thread transcripts can grow quickly. The first pass should avoid also sending descendant thread histories to the model.
- If we later move threads into Postgres, we should preserve the same logical shapes so the migration is mechanical rather than a redesign.

## Verification

1. Add unit tests for storage normalization covering:
   - fresh snapshots
   - snapshots with no threads
   - snapshots with legacy task `agentCalls`
   - malformed thread/message entries
2. Add operation tests proving we can append human and agent messages for tasks, projects, and initiatives without mutating unrelated entities.
3. Add view tests confirming thread UI renders in task, project, and initiative surfaces and persists expected copy for empty vs populated threads.
4. Manual smoke test:
   - send a task message
   - refresh the page
   - confirm the thread persists
   - repeat for a project and an initiative
5. Manual regression test that existing task history from older localStorage data appears as thread messages after migration.

## Recommended Execution Order

1. Add the new thread types and snapshot normalization/migration.
2. Refactor operations to be entity-thread aware.
3. Generalize the agent-call request contract and prompt builder.
4. Replace task UI and then add reusable thread UI to project and initiative cards.
5. If desired, add project description support before wiring the final project prompt context.
