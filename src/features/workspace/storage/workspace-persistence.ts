import type {
  AgentThreadMessage,
  Initiative,
  Project,
  Task,
  ThreadOwnerRef,
  WorkspaceSnapshot,
} from "@/features/workspace/core";

/**
 * Thin abstraction over where workspace data is read from and written to.
 * Two implementations exist: ApiPersistence (database via API routes) and
 * LocalStoragePersistence (browser-only fallback).
 */
export interface WorkspacePersistence {
  /** Loads the full workspace snapshot on mount. */
  loadWorkspace(): Promise<WorkspaceSnapshot>;

  /** Persists a task after it was created or updated. */
  saveTask(task: Task): Promise<void>;
  /** Removes a task from persistent storage. */
  deleteTask(taskId: string): Promise<void>;

  /** Persists a project after it was created or updated. */
  saveProject(project: Project): Promise<void>;
  /** Removes a project from persistent storage. */
  deleteProject(projectId: string): Promise<void>;

  /** Persists an initiative after it was created or updated. */
  saveInitiative(initiative: Initiative): Promise<void>;
  /** Removes an initiative from persistent storage. */
  deleteInitiative(initiativeId: string): Promise<void>;

  /** Appends a message to an entity's thread (creating the thread if needed). */
  saveThreadMessage(owner: ThreadOwnerRef, message: AgentThreadMessage): Promise<void>;
  /** Removes a single thread message from persistent storage. */
  deleteThreadMessage(owner: ThreadOwnerRef, messageId: string): Promise<void>;
}
