import { type AgentThread, type ThreadOwnerRef, type ThreadOwnerType } from "@/features/workspace/core";

/**
 * Builds a stable thread object for a task, project, or initiative.
 */
export function createAgentThread(ownerType: ThreadOwnerType, ownerId: string): AgentThread {
  return {
    id: `thread-${ownerType}-${ownerId}`,
    ownerType,
    ownerId,
    messages: [],
  };
}

/**
 * Reads a stable string key for thread-related UI state maps.
 */
export function buildThreadOwnerKey(owner: ThreadOwnerRef) {
  return `${owner.ownerType}:${owner.ownerId}`;
}
