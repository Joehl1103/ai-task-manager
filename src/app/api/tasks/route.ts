import { eq } from "drizzle-orm";
import { NextResponse } from "next/server";

import {
  internalServerError,
  normalizeTags,
  notFoundError,
  pickDefined,
  readJsonObject,
  readPositiveIntParam,
  readStringField,
  validationError,
} from "@/app/api/_shared";
import { getDb, tasks } from "@/db";

type TaskStatusFilter = "active" | "completed";

interface QueryFilters {
  status: TaskStatusFilter | null;
  projectId: string | null;
  tag: string | null;
  search: string | null;
  limit: number | null;
  offset: number;
}

interface TaskRow {
  id: string;
  title: string;
  details: string;
  completed: boolean;
  projectId: string | null;
  deadline: string;
  tags: string[];
  createdAt: string | Date;
  updatedAt: string | Date;
  completedAt: string;
  remindOn: string;
  dueBy: string;
}

/**
 * Returns tasks ordered by creation date with optional agent-first filters.
 */
export async function GET(request: Request) {
  try {
    const parsedFilters = parseTaskFilters(new URL(request.url));

    if (!parsedFilters.ok) {
      return parsedFilters.response;
    }

    const db = getDb();
    const allTasks = (await db.select().from(tasks).orderBy(tasks.createdAt)) as TaskRow[];
    const filteredTasks = filterTasks(allTasks, parsedFilters.value);

    return NextResponse.json(filteredTasks);
  } catch (error) {
    return internalServerError("Failed to fetch tasks.", error);
  }
}

/**
 * Creates a new task. The caller supplies the app-generated id.
 */
export async function POST(request: Request) {
  try {
    const json = await readJsonObject(request);

    if (!json.ok) {
      return json.response;
    }

    const body = json.value;
    const db = getDb();
    const id = readStringField(body.id);
    const title = readStringField(body.title);
    const details = typeof body.details === "string" ? body.details.trim() : "";
    const completed = body.completed === true;
    const projectId = readStringField(body.projectId) || null;
    const deadline = typeof body.deadline === "string" ? body.deadline.trim() : "";
    const completedAt = typeof body.completedAt === "string" ? body.completedAt : "";
    const remindOn = typeof body.remindOn === "string" ? body.remindOn : "";
    const dueBy = typeof body.dueBy === "string" ? body.dueBy : "";
    const parsedTags = normalizeTags(body.tags);

    if (!id || !title) {
      return validationError("Task id and title are required.", {
        ...(id ? {} : { id: "required" }),
        ...(title ? {} : { title: "required" }),
      });
    }

    if (!parsedTags.ok) {
      return validationError("Task tags must be an array of strings.", {
        tags: "expected_string_array",
      });
    }

    const [newTask] = await db
      .insert(tasks)
      .values({
        id,
        title,
        details,
        completed,
        projectId,
        deadline,
        tags: parsedTags.tags,
        completedAt,
        remindOn,
        dueBy,
      })
      .returning();

    return NextResponse.json(newTask, { status: 201 });
  } catch (error) {
    return internalServerError("Failed to create task.", error);
  }
}

/**
 * Updates an existing task by id (supplied in body).
 */
export async function PUT(request: Request) {
  try {
    const json = await readJsonObject(request);

    if (!json.ok) {
      return json.response;
    }

    const body = json.value;
    const db = getDb();
    const id = readStringField(body.id);

    if (!id) {
      return validationError("Task id is required.", { id: "required" });
    }

    const parsedTags = body.tags === undefined ? undefined : normalizeTags(body.tags);

    if (parsedTags && !parsedTags.ok) {
      return validationError("Task tags must be an array of strings.", {
        tags: "expected_string_array",
      });
    }

    const [updated] = await db
      .update(tasks)
      .set(
        pickDefined({
          title: typeof body.title === "string" ? body.title.trim() : undefined,
          details: typeof body.details === "string" ? body.details.trim() : undefined,
          completed: typeof body.completed === "boolean" ? body.completed : undefined,
          projectId: typeof body.projectId === "string" ? body.projectId : undefined,
          deadline: typeof body.deadline === "string" ? body.deadline.trim() : undefined,
          tags: parsedTags?.ok ? parsedTags.tags : undefined,
          completedAt: typeof body.completedAt === "string" ? body.completedAt : undefined,
          remindOn: typeof body.remindOn === "string" ? body.remindOn : undefined,
          dueBy: typeof body.dueBy === "string" ? body.dueBy : undefined,
          updatedAt: new Date(),
        }),
      )
      .where(eq(tasks.id, id))
      .returning();

    if (!updated) {
      return notFoundError("Task not found.");
    }

    return NextResponse.json(updated);
  } catch (error) {
    return internalServerError("Failed to update task.", error);
  }
}

/**
 * Deletes a task by id (query parameter).
 */
export async function DELETE(request: Request) {
  try {
    const db = getDb();
    const { searchParams } = new URL(request.url);
    const id = searchParams.get("id")?.trim();

    if (!id) {
      return validationError("Task id is required.", {
        id: "required",
      });
    }

    const [deleted] = await db.delete(tasks).where(eq(tasks.id, id)).returning();

    if (!deleted) {
      return notFoundError("Task not found.");
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    return internalServerError("Failed to delete task.", error);
  }
}

function parseTaskFilters(url: URL):
  | { ok: true; value: QueryFilters }
  | { ok: false; response: NextResponse } {
  const fields: Record<string, string> = {};
  const statusParam = url.searchParams.get("status");
  let status: TaskStatusFilter | null = null;

  if (statusParam) {
    if (statusParam === "active" || statusParam === "completed") {
      status = statusParam;
    } else {
      fields.status = "status must be one of: active, completed.";
    }
  }

  const limitParse = readPositiveIntParam(url.searchParams.get("limit"), "limit");
  if (limitParse.error) {
    fields.limit = limitParse.error;
  }

  const offsetParse = readPositiveIntParam(url.searchParams.get("offset"), "offset");
  if (offsetParse.error) {
    fields.offset = offsetParse.error;
  }

  if (Object.keys(fields).length > 0) {
    return {
      ok: false,
      response: validationError("Invalid task query parameters.", fields),
    };
  }

  return {
    ok: true,
    value: {
      status,
      projectId: url.searchParams.get("projectId")?.trim() || null,
      tag: url.searchParams.get("tag")?.trim() || null,
      search: url.searchParams.get("search")?.trim().toLowerCase() || null,
      limit: limitParse.value,
      offset: offsetParse.value ?? 0,
    },
  };
}

function filterTasks(rows: TaskRow[], filters: QueryFilters): TaskRow[] {
  const filtered = rows.filter((row) => {
    if (filters.status === "active" && row.completed) {
      return false;
    }

    if (filters.status === "completed" && !row.completed) {
      return false;
    }

    if (filters.projectId && row.projectId !== filters.projectId) {
      return false;
    }

    if (filters.tag && !row.tags.includes(filters.tag)) {
      return false;
    }

    if (filters.search) {
      const haystack = `${row.title} ${row.details}`.toLowerCase();
      if (!haystack.includes(filters.search)) {
        return false;
      }
    }

    return true;
  });

  if (filters.offset >= filtered.length) {
    return [];
  }

  const start = filters.offset;
  const end = filters.limit === null ? undefined : start + filters.limit;
  return filtered.slice(start, end);
}
