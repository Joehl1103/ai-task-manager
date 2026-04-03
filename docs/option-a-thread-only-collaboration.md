# Option A: Thread-Only Collaboration for Tasks and Projects

Implementation brief for Issue #42.

## Summary

Use the existing task/project agent thread as the entire collaboration surface. The human and agent converse in the thread; the human reads agent suggestions and manually applies changes in the app. No structured proposal model, no background execution, no new entity types.

## Scope

- v1 covers tasks and projects only (not initiatives).
- Supabase-hosted Postgres is assumed to be landing in parallel; this design uses the existing `agentThreads` / `agentThreadMessages` tables and adds no new tables.
- Provider API keys stay in browser localStorage. The CLI passes them per-request.

---

## 1. Starting Collaboration

### Browser

The human opens the thread panel on a task or project (existing `AgentThreadPanel`) and types a message. That first message is the collaboration trigger — there is no separate "assign to agent" action or status flag.

Opening the thread and sending a message is enough. An explicit "assigned to agent" marker is **not needed in v1** because:

- The thread already has a deterministic id (`thread-{ownerType}-{ownerId}`), so it exists lazily when the first message is posted.
- Adding an assignment status would require new UI affordances, filter logic, and a new column, all for a flag the human could infer by checking whether the thread has messages.
- If assignment tracking becomes important later, it can be derived from `agentThreadMessages` (thread has ≥1 agent-role message → agent is involved).

### CLI

The agent reads a task or project, reads its thread, and posts a reply. The first `POST /api/threads/{ownerId}` from the CLI creates the thread row if it doesn't exist (existing upsert behavior).

---

## 2. Browser UX (Smallest Useful Surface)

### What already works

- `AgentThreadPanel` renders human/agent message bubbles with a composer textarea.
- `FormattedAgentResponse` renders agent markdown.
- The "Call Agent" flow sends the thread to `/api/agent-call` and appends the response.
- Thread state is hydrated via `GET /api/workspace` snapshot.

### Required UI changes

1. **Thread-has-activity indicator on task/project rows.** Add a small visual hint (e.g., a dot or message count) on the task overview row and the project list entry when `agentThread.messages.length > 0`. This tells the human at a glance which items have an ongoing conversation. Implementation: a one-line check in the existing row components; no new component needed.

2. **Last-agent-message preview.** When the thread panel is collapsed, show a single-line preview of the most recent agent message beneath the task/project title in the inline editor. This keeps the human aware of agent output without opening the panel. Implementation: truncate `messages[messages.length - 1].content` to ~120 chars when `role === "agent"`.

3. **No other UI changes in v1.** The existing composer, message list, and agent-call button cover the collaboration loop. No proposal cards, accept/reject buttons, or diff views.

### What the human does

1. Select a task or project → open its thread panel.
2. Type a question or instruction → send.
3. Optionally press "Call Agent" to get a provider-backed reply.
4. Read the agent's response in the thread.
5. Manually apply any suggestions (edit task fields, update project details, create new tasks) using the normal app UI.

---

## 3. CLI Surface (Smallest Useful Surface)

### Design principle

The CLI is a thin HTTP client that maps 1:1 onto the existing REST API. It authenticates via an API key header or local env var for the provider key. It does not maintain local state.

### Exact command surface

```
relay tasks list [--status active|completed] [--project <id>] [--tag <tag>] [--search <query>]
relay tasks get <taskId>
relay tasks create --title <title> [--details <details>] [--project <id>] [--tags <t1,t2>] [--due <date>]
relay tasks update <taskId> [--title <title>] [--details <details>] [--completed true|false] ...
relay tasks delete <taskId>

relay projects list [--search <query>]
relay projects get <projectId>
relay projects create --name <name> [--initiative <id>] [--deadline <date>]
relay projects update <projectId> [--name <name>] [--deadline <date>]
relay projects delete <projectId>

relay threads read <ownerId>
relay threads post <ownerId> --owner-type task|project --role human|agent --content <message>
relay threads delete-message <ownerId> --message-id <messageId>
```

### API mapping

| CLI command | HTTP method | Endpoint |
|---|---|---|
| `tasks list` | `GET` | `/api/tasks?status=…&projectId=…&tag=…&search=…` |
| `tasks get` | `GET` | `/api/tasks?id=…` (or workspace snapshot + filter) |
| `tasks create` | `POST` | `/api/tasks` |
| `tasks update` | `PUT` | `/api/tasks` |
| `tasks delete` | `DELETE` | `/api/tasks?id=…` |
| `projects list` | `GET` | `/api/projects?search=…` |
| `projects get` | `GET` | `/api/projects?id=…` (or workspace snapshot + filter) |
| `projects create` | `POST` | `/api/projects` |
| `projects update` | `PUT` | `/api/projects` |
| `projects delete` | `DELETE` | `/api/projects?id=…` |
| `threads read` | `GET` | `/api/threads/{ownerId}` |
| `threads post` | `POST` | `/api/threads/{ownerId}` |
| `threads delete-message` | `DELETE` | `/api/threads/{ownerId}?messageId=…` |

### Configuration

```
RELAY_API_URL=http://localhost:3000   # base URL of the running app
```

The CLI generates message ids (UUIDs) and thread ids (`thread-{ownerType}-{ownerId}`) client-side, matching the existing `createAgentThread` convention.

### Typical agent workflow from CLI

```bash
# 1. List tasks the agent should look at
relay tasks list --status active

# 2. Read the thread for a specific task
relay threads read abc-123

# 3. Post an agent reply
relay threads post abc-123 \
  --owner-type task \
  --role agent \
  --content "Here's my analysis of this task..."

# 4. Optionally update the task itself
relay tasks update abc-123 --details "Updated details based on analysis"
```

---

## 4. CLI vs MCP Recommendation

**Recommendation: CLI first, not MCP.**

Rationale:

- The existing API surface is simple REST. A thin CLI wrapper is a weekend of work; an MCP server is a larger commitment with a less stable spec.
- CLI commands are testable with `curl` during development and scriptable in any agent harness.
- MCP is valuable when the agent needs bidirectional tool discovery and the server wants to push context. Neither applies here — the agent drives the conversation by polling threads and posting messages.
- If MCP becomes important later, the CLI commands define the exact tool surface an MCP server would expose. The migration path is: wrap each CLI command as an MCP tool with the same parameters.

---

## 5. Required API Changes

### Existing endpoints — no changes needed

All required operations are already covered:

- `GET /api/workspace` returns tasks, projects, and assembled threads.
- `GET/POST/PUT/DELETE /api/tasks` covers task CRUD.
- `GET/POST/PUT/DELETE /api/projects` covers project CRUD.
- `GET/POST/DELETE /api/threads/{ownerId}` covers thread read, message append (with thread upsert), and message delete.

### One optional addition

- `GET /api/tasks?id=<taskId>` — the current tasks endpoint filters by status/project/tag/search but does not support fetching a single task by id. The CLI `tasks get` command would benefit from this. Implementation: add an `id` query param branch to the existing `GET` handler in `src/app/api/tasks/route.ts`. Same for `GET /api/projects?id=<projectId>`.

---

## 6. Required Persistence Changes

**None.** The existing schema supports this design fully:

- `agentThreads` stores one thread per entity via `ownerType` + `ownerId`.
- `agentThreadMessages` stores messages with `role` (human/agent), `content`, `providerId`, `model`, and `status`.
- Thread creation is upserted on first message post (existing behavior in `POST /api/threads/{ownerId}`).

No new tables, columns, or indexes are required.

---

## 7. Tradeoffs vs Options B and C

### Option A (this option): Thread-only collaboration

| Dimension | Assessment |
|---|---|
| **Implementation cost** | Lowest. Two small UI hints + a CLI wrapper. No new tables, no new entity types, no background systems. |
| **Time to ship** | Days, not weeks. |
| **Agent autonomy** | Low. Agent can only suggest via thread messages. Human applies all changes manually. |
| **Auditability** | High. The thread is the complete record; nothing happens outside it. |
| **Risk of unintended changes** | Zero. Agent cannot modify tasks or projects unless the human (or CLI script) explicitly calls the CRUD endpoints. |
| **Collaboration UX** | Conversational but manual. The human must context-switch between reading agent suggestions and editing fields. |
| **Upgrade path** | Clean. Threads remain the communication layer if structured proposals (Option B) or direct execution (Option C) are added later. |

### Option B (#43): Structured proposals

Adds a proposal entity that the agent creates and the human accepts or rejects. Higher implementation cost (new table, proposal UI, accept/reject flow), but removes the manual copy-paste step. Better for agents that produce concrete field-level changes. Risk: proposal schema may need iteration before it stabilizes.

### Option C (#44): Direct agent execution

Lets the agent call task/project CRUD directly. Highest autonomy, lowest human friction for trusted agents. Highest risk — requires guardrails (confirmation steps, undo, scope limits) to prevent unintended bulk changes. Largest implementation surface.

### Progression

A → B → C is a natural progression. Option A establishes the thread as the collaboration channel. Option B adds structured payloads inside that channel. Option C lets the agent act on accepted proposals (or directly, with guardrails). Starting with A provides immediate value and validates the collaboration pattern before investing in proposal schemas or execution guardrails.
