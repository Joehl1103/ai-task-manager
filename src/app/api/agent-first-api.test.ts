import { beforeEach, describe, expect, it, vi } from "vitest";

type Row = Record<string, unknown>;

interface MockState {
  tasks: Row[];
  projects: Row[];
  initiatives: Row[];
  agentThreads: Row[];
  agentThreadMessages: Row[];
}

type MockCondition =
  | { kind: "eq"; column: { key: string }; value: unknown }
  | { kind: "and"; conditions: MockCondition[] };

let state: MockState;

function setMockState(next: Partial<MockState> = {}): void {
  state = {
    tasks: [],
    projects: [],
    initiatives: [],
    agentThreads: [],
    agentThreadMessages: [],
    ...next,
  };
}

function clone<T>(value: T): T {
  return JSON.parse(JSON.stringify(value)) as T;
}

function compareValues(left: unknown, right: unknown): number {
  if (left instanceof Date && right instanceof Date) {
    return left.getTime() - right.getTime();
  }

  if (typeof left === "string" && typeof right === "string") {
    return left.localeCompare(right);
  }

  if (typeof left === "number" && typeof right === "number") {
    return left - right;
  }

  return 0;
}

function matchesCondition(row: Row, condition: MockCondition): boolean {
  if (condition.kind === "and") {
    return condition.conditions.every((nested) => matchesCondition(row, nested));
  }

  return row[condition.column.key] === condition.value;
}

function createSelectBuilder(tableKey: keyof MockState) {
  let rows = [...state[tableKey]];

  const builder = {
    where(condition: MockCondition) {
      rows = rows.filter((row) => matchesCondition(row, condition));
      return builder;
    },
    orderBy(column: { key: string }) {
      rows = [...rows].sort((left, right) => compareValues(left[column.key], right[column.key]));
      return builder;
    },
    then<TResult1 = Row[], TResult2 = never>(
      onfulfilled?: ((value: Row[]) => TResult1 | PromiseLike<TResult1>) | null,
      onrejected?: ((reason: unknown) => TResult2 | PromiseLike<TResult2>) | null,
    ) {
      return Promise.resolve(clone(rows)).then(onfulfilled, onrejected);
    },
  };

  return builder;
}

function createInsertBuilder(tableKey: keyof MockState) {
  return {
    values(input: Row | Row[]) {
      const toInsert = (Array.isArray(input) ? input : [input]).map((row) => ({ ...row }));
      state[tableKey].push(...toInsert);

      return {
        returning: async () => clone(toInsert),
      };
    },
  };
}

function createUpdateBuilder(tableKey: keyof MockState) {
  let patch: Row = {};

  return {
    set(nextPatch: Row) {
      patch = nextPatch;

      return {
        where(condition: MockCondition) {
          return {
            returning: async () => {
              const updated: Row[] = [];

              state[tableKey] = state[tableKey].map((row) => {
                if (!matchesCondition(row, condition)) {
                  return row;
                }

                const nextRow: Row = { ...row };

                for (const [key, value] of Object.entries(patch)) {
                  if (value !== undefined) {
                    nextRow[key] = value;
                  }
                }

                updated.push(nextRow);
                return nextRow;
              });

              return clone(updated);
            },
          };
        },
      };
    },
  };
}

function createDeleteBuilder(tableKey: keyof MockState) {
  return {
    where(condition: MockCondition) {
      return {
        returning: async () => {
          const deleted: Row[] = [];
          const kept: Row[] = [];

          for (const row of state[tableKey]) {
            if (matchesCondition(row, condition)) {
              deleted.push(row);
              continue;
            }

            kept.push(row);
          }

          state[tableKey] = kept;
          return clone(deleted);
        },
      };
    },
  };
}

const dbTables = {
  tasks: {
    __storeKey: "tasks" as const,
    id: { key: "id" },
    createdAt: { key: "createdAt" },
    ownerId: { key: "ownerId" },
  },
  projects: {
    __storeKey: "projects" as const,
    id: { key: "id" },
    createdAt: { key: "createdAt" },
    initiativeId: { key: "initiativeId" },
  },
  initiatives: {
    __storeKey: "initiatives" as const,
    id: { key: "id" },
    createdAt: { key: "createdAt" },
  },
  agentThreads: {
    __storeKey: "agentThreads" as const,
    id: { key: "id" },
    ownerId: { key: "ownerId" },
  },
  agentThreadMessages: {
    __storeKey: "agentThreadMessages" as const,
    id: { key: "id" },
    threadId: { key: "threadId" },
    createdAt: { key: "createdAt" },
  },
};

vi.mock("drizzle-orm", () => ({
  eq: (column: { key: string }, value: unknown) => ({ kind: "eq", column, value }),
  and: (...conditions: MockCondition[]) => ({ kind: "and", conditions }),
}));

vi.mock("@/db", () => ({
  getDb: () => ({
    select: () => ({
      from: (table: { __storeKey: keyof MockState }) => createSelectBuilder(table.__storeKey),
    }),
    insert: (table: { __storeKey: keyof MockState }) => createInsertBuilder(table.__storeKey),
    update: (table: { __storeKey: keyof MockState }) => createUpdateBuilder(table.__storeKey),
    delete: (table: { __storeKey: keyof MockState }) => createDeleteBuilder(table.__storeKey),
  }),
  tasks: dbTables.tasks,
  projects: dbTables.projects,
  initiatives: dbTables.initiatives,
  agentThreads: dbTables.agentThreads,
  agentThreadMessages: dbTables.agentThreadMessages,
}));

describe("agent-first API routes", () => {
  beforeEach(() => {
    setMockState();
  });

  it("returns an API manifest from GET /api", async () => {
    const { GET } = await import("@/app/api/route");

    const response = await GET();
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body.endpoints).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ path: "/api/tasks", methods: expect.arrayContaining(["GET", "POST", "PUT", "DELETE"]) }),
        expect.objectContaining({ path: "/api/tasks/:id", methods: expect.arrayContaining(["GET", "PATCH", "DELETE"]) }),
        expect.objectContaining({ path: "/api/tasks/bulk", methods: expect.arrayContaining(["POST", "PATCH", "DELETE"]) }),
        expect.objectContaining({ path: "/api/models", methods: expect.arrayContaining(["POST"]) }),
        expect.objectContaining({ path: "/api/agent-call", methods: expect.arrayContaining(["POST"]) }),
      ]),
    );
  });

  it("filters GET /api/tasks by status, project, tag, search, and pagination", async () => {
    setMockState({
      tasks: [
        {
          id: "task-1",
          title: "Prepare budget",
          details: "Urgent finance update",
          completed: false,
          projectId: "project-1",
          deadline: "",
          tags: ["urgent"],
          createdAt: "2026-03-20T00:00:00.000Z",
          updatedAt: "2026-03-20T00:00:00.000Z",
          completedAt: "",
          remindOn: "",
          dueBy: "",
        },
        {
          id: "task-2",
          title: "Prepare budget archive",
          details: "Urgent old file",
          completed: true,
          projectId: "project-1",
          deadline: "",
          tags: ["urgent"],
          createdAt: "2026-03-21T00:00:00.000Z",
          updatedAt: "2026-03-21T00:00:00.000Z",
          completedAt: "",
          remindOn: "",
          dueBy: "",
        },
      ],
    });

    const { GET } = await import("@/app/api/tasks/route");
    const request = new Request(
      "http://localhost/api/tasks?status=active&projectId=project-1&tag=urgent&search=budget&limit=1&offset=0",
    );

    const response = await GET(request);
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body).toHaveLength(1);
    expect(body[0]?.id).toBe("task-1");
  });

  it("returns structured field validation errors for invalid task filters", async () => {
    const { GET } = await import("@/app/api/tasks/route");

    const response = await GET(new Request("http://localhost/api/tasks?status=paused&limit=-1"));
    const body = await response.json();

    expect(response.status).toBe(400);
    expect(body).toEqual(
      expect.objectContaining({
        error: "validation_error",
        fields: expect.objectContaining({
          status: expect.any(String),
          limit: expect.any(String),
        }),
      }),
    );
  });

  it("supports single-task fetch with thread, patch updates, and delete by path id", async () => {
    setMockState({
      tasks: [
        {
          id: "task-1",
          title: "Write launch note",
          details: "",
          completed: false,
          projectId: "project-1",
          deadline: "",
          tags: [],
          createdAt: "2026-03-20T00:00:00.000Z",
          updatedAt: "2026-03-20T00:00:00.000Z",
          completedAt: "",
          remindOn: "",
          dueBy: "",
        },
      ],
      agentThreads: [
        {
          id: "thread-task-1",
          ownerType: "task",
          ownerId: "task-1",
          createdAt: "2026-03-20T00:00:00.000Z",
        },
      ],
      agentThreadMessages: [
        {
          id: "message-1",
          threadId: "thread-task-1",
          role: "human",
          content: "Draft this update",
          providerId: null,
          model: null,
          status: null,
          createdAt: "2026-03-20T00:01:00.000Z",
        },
      ],
    });

    const taskRoute = await import("@/app/api/tasks/[id]/route");

    const getResponse = await taskRoute.GET(new Request("http://localhost/api/tasks/task-1"), {
      params: Promise.resolve({ id: "task-1" }),
    });
    const getBody = await getResponse.json();

    expect(getResponse.status).toBe(200);
    expect(getBody.id).toBe("task-1");
    expect(getBody.agentThread.messages).toHaveLength(1);

    const patchResponse = await taskRoute.PATCH(
      new Request("http://localhost/api/tasks/task-1", {
        method: "PATCH",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ completed: true }),
      }),
      {
        params: Promise.resolve({ id: "task-1" }),
      },
    );
    const patchBody = await patchResponse.json();

    expect(patchResponse.status).toBe(200);
    expect(patchBody.completed).toBe(true);

    const deleteResponse = await taskRoute.DELETE(new Request("http://localhost/api/tasks/task-1", { method: "DELETE" }), {
      params: Promise.resolve({ id: "task-1" }),
    });

    expect(deleteResponse.status).toBe(200);
    expect(state.tasks).toHaveLength(0);
  });

  it("supports task bulk create, update, and delete", async () => {
    const bulkRoute = await import("@/app/api/tasks/bulk/route");

    const createResponse = await bulkRoute.POST(
      new Request("http://localhost/api/tasks/bulk", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          tasks: [
            { id: "task-1", title: "First", details: "", completed: false, projectId: "", tags: [] },
            { id: "task-2", title: "Second", details: "", completed: false, projectId: "", tags: [] },
          ],
        }),
      }),
    );
    const createBody = await createResponse.json();

    expect(createResponse.status).toBe(201);
    expect(createBody.tasks).toHaveLength(2);

    const updateResponse = await bulkRoute.PATCH(
      new Request("http://localhost/api/tasks/bulk", {
        method: "PATCH",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ ids: ["task-1", "task-2"], patch: { completed: true } }),
      }),
    );
    const updateBody = await updateResponse.json();

    expect(updateResponse.status).toBe(200);
    expect(updateBody.tasks.every((task: { completed: boolean }) => task.completed)).toBe(true);

    const deleteResponse = await bulkRoute.DELETE(
      new Request("http://localhost/api/tasks/bulk", {
        method: "DELETE",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ ids: ["task-1", "task-2"] }),
      }),
    );
    const deleteBody = await deleteResponse.json();

    expect(deleteResponse.status).toBe(200);
    expect(deleteBody.deletedCount).toBe(2);
    expect(state.tasks).toHaveLength(0);
  });

  it("supports single project and initiative routes", async () => {
    setMockState({
      projects: [
        {
          id: "project-1",
          name: "Project One",
          initiativeId: "initiative-1",
          deadline: "",
          createdAt: "2026-03-20T00:00:00.000Z",
          updatedAt: "2026-03-20T00:00:00.000Z",
        },
      ],
      initiatives: [
        {
          id: "initiative-1",
          name: "Initiative One",
          description: "desc",
          deadline: "",
          createdAt: "2026-03-20T00:00:00.000Z",
          updatedAt: "2026-03-20T00:00:00.000Z",
        },
      ],
    });

    const projectRoute = await import("@/app/api/projects/[id]/route");
    const initiativeRoute = await import("@/app/api/initiatives/[id]/route");

    const projectPatch = await projectRoute.PATCH(
      new Request("http://localhost/api/projects/project-1", {
        method: "PATCH",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ name: "Project One Updated" }),
      }),
      { params: Promise.resolve({ id: "project-1" }) },
    );
    const projectPatchBody = await projectPatch.json();
    expect(projectPatch.status).toBe(200);
    expect(projectPatchBody.name).toBe("Project One Updated");

    const initiativeGet = await initiativeRoute.GET(new Request("http://localhost/api/initiatives/initiative-1"), {
      params: Promise.resolve({ id: "initiative-1" }),
    });
    const initiativeBody = await initiativeGet.json();
    expect(initiativeGet.status).toBe(200);
    expect(initiativeBody.id).toBe("initiative-1");
  });
});
