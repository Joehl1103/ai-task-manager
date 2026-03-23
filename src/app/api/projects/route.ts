import { eq } from "drizzle-orm";
import { NextResponse } from "next/server";

import {
  internalServerError,
  notFoundError,
  pickDefined,
  readJsonObject,
  readPositiveIntParam,
  readStringField,
  validationError,
} from "@/app/api/_shared";
import { getDb, projects } from "@/db";

interface ProjectRow {
  id: string;
  name: string;
  initiativeId: string | null;
  deadline: string;
}

/**
 * Returns projects ordered by creation date with optional filters.
 */
export async function GET(request: Request) {
  try {
    const url = new URL(request.url);
    const fields: Record<string, string> = {};
    const limitParse = readPositiveIntParam(url.searchParams.get("limit"), "limit");
    const offsetParse = readPositiveIntParam(url.searchParams.get("offset"), "offset");

    if (limitParse.error) {
      fields.limit = limitParse.error;
    }

    if (offsetParse.error) {
      fields.offset = offsetParse.error;
    }

    if (Object.keys(fields).length > 0) {
      return validationError("Invalid project query parameters.", fields);
    }

    const db = getDb();
    const allProjects = (await db.select().from(projects).orderBy(projects.createdAt)) as ProjectRow[];
    const initiativeId = url.searchParams.get("initiativeId")?.trim() || null;
    const search = url.searchParams.get("search")?.trim().toLowerCase() || null;

    const filtered = allProjects.filter((project) => {
      if (initiativeId && project.initiativeId !== initiativeId) {
        return false;
      }

      if (search && !project.name.toLowerCase().includes(search)) {
        return false;
      }

      return true;
    });

    const offset = offsetParse.value ?? 0;
    const limit = limitParse.value;
    const paged = filtered.slice(offset, limit === null ? undefined : offset + limit);

    return NextResponse.json(paged);
  } catch (error) {
    return internalServerError("Failed to fetch projects.", error);
  }
}

/**
 * Creates a new project. The caller supplies the app-generated id.
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
    const name = readStringField(body.name);

    if (!id || !name) {
      return validationError("Project id and name are required.", {
        ...(id ? {} : { id: "required" }),
        ...(name ? {} : { name: "required" }),
      });
    }

    const [newProject] = await db
      .insert(projects)
      .values({
        id,
        name,
        initiativeId: readStringField(body.initiativeId) || null,
        deadline: typeof body.deadline === "string" ? body.deadline.trim() : "",
      })
      .returning();

    return NextResponse.json(newProject, { status: 201 });
  } catch (error) {
    return internalServerError("Failed to create project.", error);
  }
}

/**
 * Updates an existing project by id (supplied in body).
 */
export async function PUT(request: Request) {
  try {
    const json = await readJsonObject(request);

    if (!json.ok) {
      return json.response;
    }

    const body = json.value;
    const id = readStringField(body.id);

    if (!id) {
      return validationError("Project id is required.", { id: "required" });
    }

    const db = getDb();
    const [updated] = await db
      .update(projects)
      .set(
        pickDefined({
          name: typeof body.name === "string" ? body.name.trim() : undefined,
          initiativeId: typeof body.initiativeId === "string" ? body.initiativeId.trim() : undefined,
          deadline: typeof body.deadline === "string" ? body.deadline.trim() : undefined,
          updatedAt: new Date(),
        }),
      )
      .where(eq(projects.id, id))
      .returning();

    if (!updated) {
      return notFoundError("Project not found.");
    }

    return NextResponse.json(updated);
  } catch (error) {
    return internalServerError("Failed to update project.", error);
  }
}

/**
 * Deletes a project by id (query parameter).
 */
export async function DELETE(request: Request) {
  try {
    const db = getDb();
    const { searchParams } = new URL(request.url);
    const id = searchParams.get("id")?.trim();

    if (!id) {
      return validationError("Project id is required.", {
        id: "required",
      });
    }

    const [deleted] = await db.delete(projects).where(eq(projects.id, id)).returning();

    if (!deleted) {
      return notFoundError("Project not found.");
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    return internalServerError("Failed to delete project.", error);
  }
}
