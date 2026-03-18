import {
  type AddInitiativeInput,
  type Initiative,
  type UpdateInitiativeInput,
  type WorkspaceSnapshot,
} from "./types";
import { createAgentThread } from "./thread-helpers";

/**
 * Adds a new initiative to the workspace.
 */
export function addInitiative(
  workspace: WorkspaceSnapshot,
  input: AddInitiativeInput,
): WorkspaceSnapshot {
  const nextInitiativeId = buildNextInitiativeId(workspace.initiatives);
  const nextInitiative: Initiative = {
    id: nextInitiativeId,
    name: input.name.trim(),
    description: input.description.trim(),
    deadline: input.deadline.trim(),
    agentThread: createAgentThread("initiative", nextInitiativeId),
  };

  return {
    ...workspace,
    initiatives: [nextInitiative, ...workspace.initiatives],
  };
}

/**
 * Updates an existing initiative.
 */
export function updateInitiative(
  workspace: WorkspaceSnapshot,
  input: UpdateInitiativeInput,
): WorkspaceSnapshot {
  return {
    ...workspace,
    initiatives: workspace.initiatives.map((initiative) =>
      initiative.id === input.initiativeId
        ? {
            ...initiative,
            name: input.name.trim(),
            description: input.description.trim(),
            deadline: input.deadline.trim(),
          }
        : initiative,
    ),
  };
}

/**
 * Deletes an initiative. Projects referencing it will have their initiativeId cleared.
 */
export function deleteInitiative(
  workspace: WorkspaceSnapshot,
  initiativeId: string,
): WorkspaceSnapshot {
  return {
    ...workspace,
    initiatives: workspace.initiatives.filter((i) => i.id !== initiativeId),
    projects: workspace.projects.map((project) =>
      project.initiativeId === initiativeId
        ? { ...project, initiativeId: "" }
        : project,
    ),
  };
}

/**
 * Counts projects belonging to an initiative.
 */
export function countProjectsInInitiative(
  workspace: WorkspaceSnapshot,
  initiativeId: string,
): number {
  return workspace.projects.filter((p) => p.initiativeId === initiativeId).length;
}

/**
 * Builds a stable incremental initiative id.
 */
function buildNextInitiativeId(initiatives: Initiative[]) {
  const nextNumber = initiatives.reduce((highest, initiative) => {
    const current = Number(initiative.id.replace("initiative-", ""));
    return Number.isNaN(current) ? highest : Math.max(highest, current);
  }, 0);

  return `initiative-${nextNumber + 1}`;
}
