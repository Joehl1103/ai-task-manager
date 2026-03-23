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
import { getDb, initiatives } from "@/db";

interface InitiativeRow {
  id: string;
  name: string;
  description: string;
  deadline: string;
}

/**
 * Returns initiatives ordered by creation date with optional filters.
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
      return validationError("Invalid initiative query parameters.", fields);
    }

    const db = getDb();
    const allInitiatives = (await db.select().from(initiatives).orderBy(initiatives.createdAt)) as InitiativeRow[];
    const search = url.searchParams.get("search")?.trim().toLowerCase() || null;

    const filtered = allInitiatives.filter((initiative) => {
      if (!search) {
        return true;
      }

      const haystack = `${initiative.name} ${initiative.description}`.toLowerCase();
      return haystack.includes(search);
    });

    const offset = offsetParse.value ?? 0;
    const limit = limitParse.value;
    const paged = filtered.slice(offset, limit === null ? undefined : offset + limit);

    return NextResponse.json(paged);
  } catch (error) {
    return internalServerError("Failed to fetch initiatives.", error);
  }
}

/**
 * Creates a new initiative. The caller supplies the app-generated id.
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
      return validationError("Initiative id and name are required.", {
        ...(id ? {} : { id: "required" }),
        ...(name ? {} : { name: "required" }),
      });
    }

    const [newInitiative] = await db
      .insert(initiatives)
      .values({
        id,
        name,
        description: typeof body.description === "string" ? body.description.trim() : "",
        deadline: typeof body.deadline === "string" ? body.deadline.trim() : "",
      })
      .returning();

    return NextResponse.json(newInitiative, { status: 201 });
  } catch (error) {
    return internalServerError("Failed to create initiative.", error);
  }
}

/**
 * Updates an existing initiative by id (supplied in body).
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
      return validationError("Initiative id is required.", { id: "required" });
    }

    const db = getDb();
    const [updated] = await db
      .update(initiatives)
      .set(
        pickDefined({
          name: typeof body.name === "string" ? body.name.trim() : undefined,
          description: typeof body.description === "string" ? body.description.trim() : undefined,
          deadline: typeof body.deadline === "string" ? body.deadline.trim() : undefined,
          updatedAt: new Date(),
        }),
      )
      .where(eq(initiatives.id, id))
      .returning();

    if (!updated) {
      return notFoundError("Initiative not found.");
    }

    return NextResponse.json(updated);
  } catch (error) {
    return internalServerError("Failed to update initiative.", error);
  }
}

/**
 * Deletes an initiative by id (query parameter).
 */
export async function DELETE(request: Request) {
  try {
    const db = getDb();
    const { searchParams } = new URL(request.url);
    const id = searchParams.get("id")?.trim();

    if (!id) {
      return validationError("Initiative id is required.", {
        id: "required",
      });
    }

    const [deleted] = await db.delete(initiatives).where(eq(initiatives.id, id)).returning();

    if (!deleted) {
      return notFoundError("Initiative not found.");
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    return internalServerError("Failed to delete initiative.", error);
  }
}
