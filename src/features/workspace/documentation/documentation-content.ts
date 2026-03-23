export type DocumentationMethod = "GET" | "POST" | "PUT" | "PATCH" | "DELETE";

export interface DocumentationMethodDetail {
  body?: string[];
  method: DocumentationMethod;
  notes?: string[];
  query?: string[];
  response: string;
  summary: string;
}

export interface DocumentationRoute {
  methods: DocumentationMethodDetail[];
  path: string;
}

export interface DocumentationRouteGroup {
  description: string;
  routes: DocumentationRoute[];
  title: string;
}

export interface DocumentationExample {
  code: string;
  description: string;
  language: "bash" | "json";
  title: string;
}

export interface DocumentationFact {
  body: string;
  title: string;
}

/**
 * Captures the current API surface in one place so the in-app wiki stays aligned with real routes.
 */
export const apiDocumentation = {
  examples: [
    {
      title: "Discover the manifest",
      description: "Use the manifest to inspect the runtime route inventory from outside the UI.",
      language: "bash",
      code: `curl http://localhost:3000/api`,
    },
    {
      title: "Patch a task by path id",
      description: "The path-based task routes are the cleaner partial-update surface for agent-first workflows.",
      language: "bash",
      code: `curl -X PATCH http://localhost:3000/api/tasks/task-123 \\
  -H "content-type: application/json" \\
  -d '{"completed":true,"completedAt":"2026-03-23T14:00:00.000Z"}'`,
    },
    {
      title: "Call the live agent route",
      description: "Provider calls flow through the server and currently accept OpenAI only.",
      language: "json",
      code: `{
  "providerId": "openai",
  "apiKey": "sk-...",
  "model": "gpt-5",
  "ownerType": "project",
  "entityName": "Relay MVP",
  "entityContext": "Launch checklist and API rollout",
  "messages": [
    {
      "id": "message-1",
      "role": "human",
      "content": "Summarize open launch risks.",
      "createdAt": "2026-03-23T14:00:00.000Z"
    }
  ]
}`,
    },
  ] satisfies DocumentationExample[],
  facts: [
    {
      title: "Transport",
      body: "All endpoints use JSON bodies and JSON responses. There is no cookie or token auth layer in this local-first build yet.",
    },
    {
      title: "Persistence",
      body: "Workspace entities persist to PostgreSQL through Drizzle when the database is available. The UI still falls back to localStorage when the API cannot hydrate.",
    },
    {
      title: "Identifiers",
      body: "Tasks, projects, initiatives, threads, and messages all use app-generated string ids supplied by the client on create requests.",
    },
    {
      title: "Route styles",
      body: "Collection routes still support legacy PUT and query-param DELETE operations, while the newer agent-first routes add cleaner path-based GET, PATCH, and DELETE handlers.",
    },
    {
      title: "Errors",
      body: "Newer CRUD routes often return structured validation errors with `error`, `message`, and optional `fields`. Some older routes still return simpler `{ error: string }` payloads.",
    },
  ] satisfies DocumentationFact[],
  routeGroups: [
    {
      title: "Discovery and hydration",
      description: "These routes help the UI or external agents discover the API surface and fetch a full workspace snapshot.",
      routes: [
        {
          path: "/api",
          methods: [
            {
              method: "GET",
              summary: "Returns the Relay Agent API manifest with endpoint names, methods, and short descriptions.",
              response: "Manifest object with `name`, `version`, and `endpoints`.",
            },
          ],
        },
        {
          path: "/api/workspace",
          methods: [
            {
              method: "GET",
              summary: "Hydrates the full workspace in one request, including embedded agent threads for tasks, projects, and initiatives.",
              response: "Workspace snapshot with `tasks`, `projects`, and `initiatives` arrays.",
              notes: [
                "Thread messages are ordered by creation time.",
                "Entities without saved threads get an empty synthesized thread object.",
              ],
            },
          ],
        },
      ],
    },
    {
      title: "Task routes",
      description: "Task endpoints now support both collection-style CRUD and path-first agent workflows, plus bulk operations.",
      routes: [
        {
          path: "/api/tasks",
          methods: [
            {
              method: "GET",
              summary: "Lists tasks ordered by creation date and supports filtering for active workflows.",
              query: ["status=active|completed", "projectId", "tag", "search", "limit", "offset"],
              response: "Array of task rows.",
            },
            {
              method: "POST",
              summary: "Creates a task with a caller-supplied id.",
              body: [
                "id",
                "title",
                "details?",
                "completed?",
                "projectId?",
                "deadline?",
                "tags?",
                "completedAt?",
                "remindOn?",
                "dueBy?",
              ],
              response: "Created task row.",
            },
            {
              method: "PUT",
              summary: "Updates an existing task using the task id from the JSON body.",
              body: [
                "id",
                "title?",
                "details?",
                "completed?",
                "projectId?",
                "deadline?",
                "tags?",
                "completedAt?",
                "remindOn?",
                "dueBy?",
              ],
              response: "Updated task row.",
            },
            {
              method: "DELETE",
              summary: "Deletes a task using the legacy query-param form.",
              query: ["id"],
              response: "{ success: true }",
            },
          ],
        },
        {
          path: "/api/tasks/:id",
          methods: [
            {
              method: "GET",
              summary: "Fetches one task and expands its thread messages inline.",
              response: "Single task object with an `agentThread` property.",
            },
            {
              method: "PATCH",
              summary: "Partially updates one task by path id.",
              body: [
                "title?",
                "details?",
                "completed?",
                "projectId?",
                "deadline?",
                "tags?",
                "completedAt?",
                "remindOn?",
                "dueBy?",
              ],
              response: "Updated task row.",
            },
            {
              method: "DELETE",
              summary: "Deletes the task and removes its saved thread plus thread messages when present.",
              response: "{ success: true }",
            },
          ],
        },
        {
          path: "/api/tasks/bulk",
          methods: [
            {
              method: "POST",
              summary: "Creates many tasks in one request.",
              body: ["tasks: TaskPayload[]"],
              response: "{ tasks: createdTasks[] }",
            },
            {
              method: "PATCH",
              summary: "Applies the same patch object to a list of task ids.",
              body: ["ids: string[]", "patch: Partial<Task>"],
              response: "{ tasks: updatedTasks[] }",
            },
            {
              method: "DELETE",
              summary: "Deletes many tasks by id.",
              body: ["ids: string[]"],
              response: "{ deletedCount: number }",
            },
          ],
        },
      ],
    },
    {
      title: "Project and initiative routes",
      description: "Projects and initiatives mirror the task structure so list and detail views can be driven the same way.",
      routes: [
        {
          path: "/api/projects",
          methods: [
            {
              method: "GET",
              summary: "Lists projects with filtering and pagination.",
              query: ["initiativeId", "search", "limit", "offset"],
              response: "Array of project rows.",
            },
            {
              method: "POST",
              summary: "Creates a project with a caller-supplied id.",
              body: ["id", "name", "initiativeId?", "deadline?"],
              response: "Created project row.",
            },
            {
              method: "PUT",
              summary: "Updates a project using the id inside the request body.",
              body: ["id", "name?", "initiativeId?", "deadline?"],
              response: "Updated project row.",
            },
            {
              method: "DELETE",
              summary: "Deletes a project using the legacy query-param form.",
              query: ["id"],
              response: "{ success: true }",
            },
          ],
        },
        {
          path: "/api/projects/:id",
          methods: [
            {
              method: "GET",
              summary: "Fetches one project by path id.",
              response: "Single project row.",
            },
            {
              method: "PATCH",
              summary: "Partially updates one project by path id.",
              body: ["name?", "initiativeId?", "deadline?"],
              response: "Updated project row.",
            },
            {
              method: "DELETE",
              summary: "Deletes one project by path id.",
              response: "{ success: true }",
            },
          ],
        },
        {
          path: "/api/initiatives",
          methods: [
            {
              method: "GET",
              summary: "Lists initiatives with search and pagination.",
              query: ["search", "limit", "offset"],
              response: "Array of initiative rows.",
            },
            {
              method: "POST",
              summary: "Creates an initiative with a caller-supplied id.",
              body: ["id", "name", "description?", "deadline?"],
              response: "Created initiative row.",
            },
            {
              method: "PUT",
              summary: "Updates an initiative using the id inside the request body.",
              body: ["id", "name?", "description?", "deadline?"],
              response: "Updated initiative row.",
            },
            {
              method: "DELETE",
              summary: "Deletes an initiative using the legacy query-param form.",
              query: ["id"],
              response: "{ success: true }",
            },
          ],
        },
        {
          path: "/api/initiatives/:id",
          methods: [
            {
              method: "GET",
              summary: "Fetches one initiative by path id.",
              response: "Single initiative row.",
            },
            {
              method: "PATCH",
              summary: "Partially updates one initiative by path id.",
              body: ["name?", "description?", "deadline?"],
              response: "Updated initiative row.",
            },
            {
              method: "DELETE",
              summary: "Deletes one initiative by path id.",
              response: "{ success: true }",
            },
          ],
        },
      ],
    },
    {
      title: "Threads and provider tooling",
      description: "These routes support live agent interactions, model discovery, and persisted thread history.",
      routes: [
        {
          path: "/api/threads/:ownerId",
          methods: [
            {
              method: "GET",
              summary: "Returns the saved thread and message list for a task, project, or initiative owner id.",
              response: "{ thread, messages }",
            },
            {
              method: "POST",
              summary: "Creates the thread when needed and appends one message to it.",
              body: [
                "threadId",
                "ownerType",
                "ownerId",
                "messageId",
                "role",
                "content",
                "providerId?",
                "model?",
                "status?",
                "createdAt?",
              ],
              response: "Created thread message row.",
            },
            {
              method: "DELETE",
              summary: "Deletes one thread message from the owner thread.",
              query: ["messageId"],
              response: "{ success: true }",
            },
          ],
        },
        {
          path: "/api/models",
          methods: [
            {
              method: "POST",
              summary: "Fetches and filters chat-capable OpenAI model ids for a provided API key.",
              body: ["apiKey"],
              response: "{ models: string[] }",
              notes: [
                "The server filters out embeddings, speech, image, moderation, and legacy completion models.",
              ],
            },
          ],
        },
        {
          path: "/api/agent-call",
          methods: [
            {
              method: "POST",
              summary: "Sends the current thread context to the configured provider through the server.",
              body: [
                "providerId",
                "apiKey",
                "model",
                "ownerType",
                "entityName",
                "entityContext",
                "messages",
              ],
              response: "Provider response payload as returned by `callProviderAgent`.",
              notes: [
                "Only `openai` is currently accepted even though the request format carries a provider id.",
                "The route returns `{ error: string }` with status 502 when the provider call fails upstream.",
              ],
            },
          ],
        },
      ],
    },
  ] satisfies DocumentationRouteGroup[],
  summary:
    "Project-wide API reference for Relay's merged PostgreSQL persistence and agent-first route surface.",
  title: "API",
};
