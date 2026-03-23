import { NextResponse } from "next/server";

export type FieldErrorMap = Record<string, string>;

export interface StructuredApiError {
  error: "validation_error" | "not_found" | "internal_error";
  message: string;
  fields?: FieldErrorMap;
}

export function validationError(message: string, fields: FieldErrorMap): NextResponse<StructuredApiError> {
  return NextResponse.json({ error: "validation_error", message, fields }, { status: 400 });
}

export function notFoundError(message: string): NextResponse<StructuredApiError> {
  return NextResponse.json({ error: "not_found", message }, { status: 404 });
}

export function internalServerError(message: string, cause?: unknown): NextResponse<StructuredApiError> {
  if (cause) {
    console.error(message, cause);
  }

  return NextResponse.json({ error: "internal_error", message }, { status: 500 });
}

export async function readJsonObject(request: Request): Promise<{ ok: true; value: Record<string, unknown> } | { ok: false; response: NextResponse<StructuredApiError> }> {
  try {
    const parsed = await request.json();

    if (!isObject(parsed)) {
      return {
        ok: false,
        response: validationError("Request body must be a JSON object.", {
          body: "expected_object",
        }),
      };
    }

    return { ok: true, value: parsed };
  } catch {
    return {
      ok: false,
      response: validationError("Request body must be valid JSON.", {
        body: "invalid_json",
      }),
    };
  }
}

export function readPositiveIntParam(value: string | null, fieldName: string): { value: number | null; error?: string } {
  if (value === null || value === "") {
    return { value: null };
  }

  const parsed = Number.parseInt(value, 10);

  if (!Number.isInteger(parsed) || parsed < 0) {
    return { value: null, error: `${fieldName} must be a non-negative integer.` };
  }

  return { value: parsed };
}

export function readStringField(value: unknown): string | null {
  if (typeof value !== "string") {
    return null;
  }

  return value.trim();
}

export function readOptionalStringField(value: unknown): string | undefined {
  if (value === undefined) {
    return undefined;
  }

  if (typeof value !== "string") {
    return undefined;
  }

  return value.trim();
}

export function readDateLikeString(value: unknown): string {
  if (value instanceof Date) {
    return value.toISOString();
  }

  if (typeof value === "string") {
    return value;
  }

  return "";
}

export function normalizeTags(value: unknown): { ok: true; tags: string[] } | { ok: false } {
  if (!Array.isArray(value)) {
    return { ok: false };
  }

  return {
    ok: true,
    tags: value
      .filter((entry): entry is string => typeof entry === "string")
      .map((entry) => entry.trim())
      .filter((entry) => entry.length > 0),
  };
}

export function isObject(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

export function pickDefined<T extends Record<string, unknown>>(input: T): Partial<T> {
  const output: Partial<T> = {};

  for (const [key, value] of Object.entries(input)) {
    if (value !== undefined) {
      output[key as keyof T] = value as T[keyof T];
    }
  }

  return output;
}
