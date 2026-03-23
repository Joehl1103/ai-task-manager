import { eq } from "drizzle-orm";
import { NextResponse } from "next/server";

import {
  internalServerError,
  normalizeTags,
  readJsonObject,
  readStringField,
  validationError,
} from "@/app/api/_shared";
import { getDb, tasks } from "@/db";

interface TaskPayload {
  id: string;
  title: string;
  details: string;
  completed: boolean;
  projectId: string | null;
  deadline: string;
  tags: string[];
  completedAt: string;
  remindOn: string;
  dueBy: string;
}

export async function POST(request: Request) {
  try {
    const json = await readJsonObject(request);

    if (!json.ok) {
      return json.response;
    }

    const entries = json.value.tasks;

    if (!Array.isArray(entries) || entries.length === 0) {
      return validationError("tasks must be a non-empty array.", {
        tasks: "required_non_empty_array",
      });
    }

    const tasksToCreate: TaskPayload[] = [];

    for (let index = 0; index < entries.length; index += 1) {
      const entry = entries[index] as Record<string, unknown>;
      const id = readStringField(entry.id);
      const title = readStringField(entry.title);

      if (!id || !title) {
        return validationError("Each task needs id and title.", {
          [`tasks.${index}.id`]: id ? "" : "required",
          [`tasks.${index}.title`]: title ? "" : "required",
        });
      }

      const tags = normalizeTags(entry.tags);

      if (!tags.ok) {
        return validationError("Each task tags field must be an array of strings.", {
          [`tasks.${index}.tags`]: "expected_string_array",
        });
      }

      tasksToCreate.push({
        id,
        title,
        details: typeof entry.details === "string" ? entry.details.trim() : "",
        completed: entry.completed === true,
        projectId: readStringField(entry.projectId) || null,
        deadline: typeof entry.deadline === "string" ? entry.deadline : "",
        tags: tags.tags,
        completedAt: typeof entry.completedAt === "string" ? entry.completedAt : "",
        remindOn: typeof entry.remindOn === "string" ? entry.remindOn : "",
        dueBy: typeof entry.dueBy === "string" ? entry.dueBy : "",
      });
    }

    const db = getDb();
    const created = await db.insert(tasks).values(tasksToCreate).returning();

    return NextResponse.json({ tasks: created }, { status: 201 });
  } catch (error) {
    return internalServerError("Failed to bulk-create tasks.", error);
  }
}

export async function PATCH(request: Request) {
  try {
    const json = await readJsonObject(request);

    if (!json.ok) {
      return json.response;
    }

    const idsInput = json.value.ids;
    const patch = json.value.patch;

    if (!Array.isArray(idsInput) || idsInput.length === 0) {
      return validationError("ids must be a non-empty array.", {
        ids: "required_non_empty_array",
      });
    }

    if (!patch || typeof patch !== "object" || Array.isArray(patch)) {
      return validationError("patch must be an object.", {
        patch: "required_object",
      });
    }

    const ids = idsInput.filter((entry): entry is string => typeof entry === "string" && entry.trim().length > 0);

    if (ids.length === 0) {
      return validationError("ids must contain at least one valid task id.", {
        ids: "empty_after_normalization",
      });
    }

    const db = getDb();
    const updated: unknown[] = [];

    for (const id of ids) {
      const [row] = await db
        .update(tasks)
        .set({ ...(patch as Record<string, unknown>), updatedAt: new Date() })
        .where(eq(tasks.id, id))
        .returning();

      if (row) {
        updated.push(row);
      }
    }

    return NextResponse.json({ tasks: updated });
  } catch (error) {
    return internalServerError("Failed to bulk-update tasks.", error);
  }
}

export async function DELETE(request: Request) {
  try {
    const json = await readJsonObject(request);

    if (!json.ok) {
      return json.response;
    }

    const idsInput = json.value.ids;

    if (!Array.isArray(idsInput) || idsInput.length === 0) {
      return validationError("ids must be a non-empty array.", {
        ids: "required_non_empty_array",
      });
    }

    const ids = idsInput.filter((entry): entry is string => typeof entry === "string" && entry.trim().length > 0);

    if (ids.length === 0) {
      return validationError("ids must contain at least one valid task id.", {
        ids: "empty_after_normalization",
      });
    }

    const db = getDb();
    let deletedCount = 0;

    for (const id of ids) {
      const [deleted] = await db.delete(tasks).where(eq(tasks.id, id)).returning();
      if (deleted) {
        deletedCount += 1;
      }
    }

    return NextResponse.json({ deletedCount });
  } catch (error) {
    return internalServerError("Failed to bulk-delete tasks.", error);
  }
}
