import type { WorkspaceSnapshot } from "@/features/workspace/core";
import {
  createDefaultWorkspaceSnapshot,
  normalizeWorkspaceSnapshot,
  workspaceStorageKey,
} from "./workspace-storage";
import type { WorkspacePersistence } from "./workspace-persistence";

/**
 * Persists workspace data in browser localStorage. This is the offline
 * fallback when the PostgreSQL-backed API is unavailable.
 *
 * Unlike ApiPersistence, every mutation saves the full snapshot because
 * localStorage has no granular CRUD — it stores a single JSON blob.
 */
export function createLocalStoragePersistence(): WorkspacePersistence {
  return {
    loadWorkspace,
    saveTask: noopWrite,
    deleteTask: noopWrite,
    saveProject: noopWrite,
    deleteProject: noopWrite,
    saveInitiative: noopWrite,
    deleteInitiative: noopWrite,
    saveThreadMessage: noopWrite,
    deleteThreadMessage: noopWrite,
  };
}

/**
 * Reads the workspace from localStorage, normalizing and migrating as needed.
 */
async function loadWorkspace(): Promise<WorkspaceSnapshot> {
  if (typeof window === "undefined") {
    return createDefaultWorkspaceSnapshot();
  }

  try {
    const raw = window.localStorage.getItem(workspaceStorageKey);

    if (!raw) {
      return createDefaultWorkspaceSnapshot();
    }

    return normalizeWorkspaceSnapshot(JSON.parse(raw));
  } catch {
    return createDefaultWorkspaceSnapshot();
  }
}

/**
 * Individual writes are no-ops because workspace-app.tsx already mirrors
 * the full workspace snapshot to localStorage via its existing useEffect.
 * This avoids double-writing and keeps the localStorage persistence path
 * exactly as it was before the API layer was introduced.
 */
async function noopWrite(): Promise<void> {
  // Full snapshot is written by the existing useEffect in workspace-app.tsx.
}
