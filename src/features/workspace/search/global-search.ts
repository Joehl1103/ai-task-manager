import {
  filterVisibleProjects,
  inboxProjectName,
  isTaskInInbox,
} from "@/features/workspace/projects";
import { type WorkspaceMenu } from "@/features/workspace/navigation";
import { type WorkspaceSnapshot } from "@/features/workspace/core";

export type GlobalSearchEntityType = "task" | "project" | "initiative";

export interface GlobalSearchResult {
  id: string;
  entityType: GlobalSearchEntityType;
  title: string;
  description: string;
  contextLabel: string;
  projectId: string | null;
  initiativeId: string | null;
  normalizedSearchText: string;
}

export interface SearchNavigationIntent {
  activeMenu: WorkspaceMenu;
  selectedProjectId: string | null;
  selectedInitiativeId: string | null;
  selectedTaskId: string | null;
}

/**
 * Flattens initiatives, projects, and tasks into one searchable list with enough parent context
 * to keep duplicate names understandable in the dialog.
 */
export function buildGlobalSearchResults(
  workspace: WorkspaceSnapshot,
): GlobalSearchResult[] {
  const initiativeNameById = new Map(
    workspace.initiatives.map((initiative) => [initiative.id, initiative.name]),
  );
  const projectById = new Map(
    workspace.projects.map((project) => [project.id, project]),
  );

  const taskResults = workspace.tasks.map((task) => {
    const project = task.projectId ? projectById.get(task.projectId) : undefined;
    const projectName = project?.name ?? null;
    const initiativeName = project?.initiativeId
      ? initiativeNameById.get(project.initiativeId) ?? null
      : null;
    const isInboxTask = isTaskInInbox(task);

    return {
      id: task.id,
      entityType: "task" as const,
      title: task.title,
      description: task.details,
      contextLabel: readTaskContextLabel(projectName, initiativeName, isInboxTask),
      projectId: isInboxTask ? null : readOptionalValue(task.projectId),
      initiativeId: readOptionalValue(project?.initiativeId),
      normalizedSearchText: normalizeSearchText([
        task.title,
        task.details,
        ...task.tags,
        projectName,
        initiativeName,
      ]),
    };
  });

  const projectResults = filterVisibleProjects(workspace.projects).map((project) => {
    const initiativeName = project.initiativeId
      ? initiativeNameById.get(project.initiativeId) ?? null
      : null;

    return {
      id: project.id,
      entityType: "project" as const,
      title: project.name,
      description: "",
      contextLabel: initiativeName
        ? `Initiative: ${initiativeName}`
        : "No initiative",
      projectId: project.id,
      initiativeId: readOptionalValue(project.initiativeId),
      normalizedSearchText: normalizeSearchText([
        project.name,
        initiativeName,
      ]),
    };
  });

  const initiativeResults = workspace.initiatives.map((initiative) => ({
    id: initiative.id,
    entityType: "initiative" as const,
    title: initiative.name,
    description: initiative.description,
    contextLabel: initiative.description || "No description",
    projectId: null,
    initiativeId: initiative.id,
    normalizedSearchText: normalizeSearchText([
      initiative.name,
      initiative.description,
    ]),
  }));

  return [...taskResults, ...projectResults, ...initiativeResults];
}

/**
 * Applies simple normalized substring matching for the dialog's MVP search behavior.
 */
export function filterGlobalSearchResults(
  results: GlobalSearchResult[],
  query: string,
): GlobalSearchResult[] {
  const normalizedQuery = normalizeSearchText([query]);

  if (!normalizedQuery) {
    return results;
  }

  return results.filter((result) =>
    result.normalizedSearchText.includes(normalizedQuery),
  );
}

/**
 * Cycles the highlighted result index so keyboard navigation wraps cleanly through the list.
 */
export function cycleGlobalSearchIndex(
  currentIndex: number,
  direction: "next" | "previous",
  resultCount: number,
): number {
  if (resultCount <= 0) {
    return -1;
  }

  if (currentIndex < 0 || currentIndex >= resultCount) {
    return direction === "next" ? 0 : resultCount - 1;
  }

  if (direction === "next") {
    return currentIndex === resultCount - 1 ? 0 : currentIndex + 1;
  }

  return currentIndex === 0 ? resultCount - 1 : currentIndex - 1;
}

/**
 * Converts a selected search result into the app-shell navigation state that should be applied.
 */
export function resolveGlobalSearchSelection(
  result: GlobalSearchResult,
  _workspace: WorkspaceSnapshot,
): SearchNavigationIntent {
  switch (result.entityType) {
    case "task":
      return {
        activeMenu: "inbox",
        selectedProjectId: null,
        selectedInitiativeId: null,
        selectedTaskId: result.id,
      };
    case "project":
      return {
        activeMenu: "projects",
        selectedProjectId: result.id,
        selectedInitiativeId: null,
        selectedTaskId: null,
      };
    case "initiative":
      return {
        activeMenu: "initiatives",
        selectedProjectId: null,
        selectedInitiativeId: result.id,
        selectedTaskId: null,
      };
  }
}

/**
 * Converts an internal entity type into the short label shown in each search row.
 */
export function readGlobalSearchEntityLabel(
  entityType: GlobalSearchEntityType,
): string {
  switch (entityType) {
    case "task":
      return "Task";
    case "project":
      return "Project";
    case "initiative":
      return "Initiative";
  }
}

/**
 * Produces a stable human-readable task context string from the task's parent entities.
 */
function readTaskContextLabel(
  projectName: string | null,
  initiativeName: string | null,
  isInboxTask: boolean,
): string {
  if (isInboxTask) {
    return inboxProjectName;
  }

  if (projectName && initiativeName) {
    return `Project: ${projectName} · Initiative: ${initiativeName}`;
  }

  if (projectName) {
    return `Project: ${projectName}`;
  }

  return inboxProjectName;
}

/**
 * Normalizes search text into a single lowercase whitespace-collapsed string.
 */
function normalizeSearchText(values: Array<string | null | undefined>): string {
  return values
    .map((value) => value?.trim().toLowerCase() ?? "")
    .filter(Boolean)
    .join(" ")
    .replace(/\s+/g, " ")
    .trim();
}

/**
 * Treats empty strings as missing values so app state stays consistent across selection flows.
 */
function readOptionalValue(value: string | null | undefined): string | null {
  const trimmedValue = value?.trim();

  return trimmedValue ? trimmedValue : null;
}
