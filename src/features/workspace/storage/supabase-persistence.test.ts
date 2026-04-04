import { afterEach, describe, expect, it, vi } from "vitest";

// ---------------------------------------------------------------------------
// Mock the supabase client module so tests never hit the network.
// Each test can override mockFrom to simulate different query results.
// ---------------------------------------------------------------------------

const mockSingle = vi.fn();
const mockEq = vi.fn(() => ({ single: mockSingle, data: null, error: null }));
const mockSelect = vi.fn(() => ({ eq: mockEq, data: null, error: null }));
const mockInsert = vi.fn(() => ({ select: mockSelect, single: mockSingle }));
const mockUpsert = vi.fn(() => ({ select: mockSelect, single: mockSingle, error: null, data: null }));
const mockUpdate = vi.fn(() => ({ eq: mockEq }));
const mockDelete = vi.fn(() => ({ eq: mockEq }));

const mockFrom = vi.fn(() => ({
  select: mockSelect,
  insert: mockInsert,
  upsert: mockUpsert,
  update: mockUpdate,
  delete: mockDelete,
}));

vi.mock("@/lib/supabase/client", () => ({
  getSupabaseClient: () => ({ from: mockFrom }),
}));

import { createSupabasePersistence } from "@/features/workspace/storage";

afterEach(() => {
  vi.clearAllMocks();
});

// ---------------------------------------------------------------------------
// loadWorkspace
// ---------------------------------------------------------------------------

describe("supabase persistence – loadWorkspace", () => {
  it("returns an empty normalized snapshot when all tables are empty", async () => {
    // Each .from(...).select(...) resolves with empty arrays
    mockSelect.mockResolvedValue({ data: [], error: null });

    const persistence = createSupabasePersistence();
    const snapshot = await persistence.loadWorkspace();

    expect(snapshot.tasks).toEqual([]);
    expect(snapshot.projects.length).toBeGreaterThanOrEqual(2); // system projects always exist
    expect(snapshot.initiatives).toEqual([]);
  });

  it("throws a readable message when supabase returns an error", async () => {
    mockSelect.mockResolvedValue({
      data: null,
      error: { message: "relation \"tasks\" does not exist" },
    });

    const persistence = createSupabasePersistence();

    await expect(persistence.loadWorkspace()).rejects.toThrow(
      "relation \"tasks\" does not exist",
    );
  });
});

// ---------------------------------------------------------------------------
// saveTask
// ---------------------------------------------------------------------------

describe("supabase persistence – saveTask", () => {
  it("calls upsert with correct task shape", async () => {
    mockUpsert.mockResolvedValue({ error: null });

    const persistence = createSupabasePersistence();
    await persistence.saveTask({
      id: "task-1",
      title: "Test task",
      details: "",
      completed: false,
      projectId: "project-inbox",
      dueBy: "",
      remindOn: "",
      tags: [],
      createdAt: "2026-01-01T00:00:00.000Z",
      completedAt: "",
      agentThread: { id: "thread-task-task-1", ownerType: "task", ownerId: "task-1", messages: [] },
    });

    expect(mockFrom).toHaveBeenCalledWith("tasks");
    expect(mockUpsert).toHaveBeenCalledWith(
      expect.objectContaining({
        id: "task-1",
        title: "Test task",
        completed: false,
      }),
    );
  });
});

// ---------------------------------------------------------------------------
// deleteTask
// ---------------------------------------------------------------------------

describe("supabase persistence – deleteTask", () => {
  it("calls delete on tasks table with correct id", async () => {
    mockEq.mockResolvedValue({ error: null });

    const persistence = createSupabasePersistence();
    await persistence.deleteTask("task-abc");

    expect(mockFrom).toHaveBeenCalledWith("tasks");
    expect(mockDelete).toHaveBeenCalled();
    expect(mockEq).toHaveBeenCalledWith("id", "task-abc");
  });
});

// ---------------------------------------------------------------------------
// saveProject
// ---------------------------------------------------------------------------

describe("supabase persistence – saveProject", () => {
  it("calls upsert with correct project shape", async () => {
    mockUpsert.mockResolvedValue({ error: null });

    const persistence = createSupabasePersistence();
    await persistence.saveProject({
      id: "proj-1",
      name: "Alpha",
      initiativeId: "",
      deadline: "",
      agentThread: { id: "thread-project-proj-1", ownerType: "project", ownerId: "proj-1", messages: [] },
    });

    expect(mockFrom).toHaveBeenCalledWith("projects");
    expect(mockUpsert).toHaveBeenCalledWith(
      expect.objectContaining({ id: "proj-1", name: "Alpha" }),
    );
  });
});

// ---------------------------------------------------------------------------
// saveThreadMessage
// ---------------------------------------------------------------------------

describe("supabase persistence – saveThreadMessage", () => {
  it("upserts thread then inserts message", async () => {
    mockUpsert.mockResolvedValue({ error: null });
    mockInsert.mockResolvedValue({ error: null });

    const persistence = createSupabasePersistence();
    await persistence.saveThreadMessage(
      { ownerType: "task", ownerId: "task-1" },
      {
        id: "msg-1",
        role: "human",
        content: "hello",
        createdAt: "2026-01-01T00:00:00.000Z",
      },
    );

    // First call: upsert thread, second call: insert message
    expect(mockFrom).toHaveBeenNthCalledWith(1, "agent_threads");
    expect(mockFrom).toHaveBeenNthCalledWith(2, "agent_thread_messages");
  });
});

// ---------------------------------------------------------------------------
// deleteThreadMessage
// ---------------------------------------------------------------------------

describe("supabase persistence – deleteThreadMessage", () => {
  it("deletes message by id", async () => {
    mockEq.mockResolvedValue({ error: null });

    const persistence = createSupabasePersistence();
    await persistence.deleteThreadMessage({ ownerType: "task", ownerId: "task-1" }, "msg-1");

    expect(mockFrom).toHaveBeenCalledWith("agent_thread_messages");
    expect(mockDelete).toHaveBeenCalled();
    expect(mockEq).toHaveBeenCalledWith("id", "msg-1");
  });
});
