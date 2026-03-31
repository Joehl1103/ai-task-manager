"use client";

import { useEffect, useRef, useState } from "react";

import { featureFlags } from "@/features/feature-flags";
import { AgentConfigurationView } from "@/features/workspace/agent-configuration-view";
import { ArchiveView } from "@/features/workspace/archive-view";
import {
  type AgentConfigState,
  type Initiative,
  type ProviderId,
  type Project,
  type ThreadDraft,
  type ThreadOwnerRef,
} from "@/features/workspace/core";
import { DocumentationView } from "@/features/workspace/documentation";
import { InboxView } from "@/features/workspace/inbox-view";
import {
  addInitiative,
  deleteInitiative,
  updateInitiative,
} from "@/features/workspace/initiatives";
import {
  InitiativeDetailView,
  InitiativeView,
} from "@/features/workspace/initiative-view";
import {
  createDefaultWorkspaceMenu,
  type WorkspaceMenu,
  WorkspaceCollapsedRail,
  WorkspaceSidebar,
} from "@/features/workspace/navigation";
import {
  filterVisibleProjects,
  readProjectPickerValue,
  addProject,
  deleteProject,
  updateProject,
} from "@/features/workspace/projects";
import {
  ProjectDetailView,
  ProjectView,
} from "@/features/workspace/project-view";
import { TasksView } from "@/features/workspace/tasks-view";
import {
  agentConfigStorageKey,
  createApiKeyId,
  createDefaultAgentConfig,
  createDefaultProviderSettings,
  getProviderLabel,
  normalizeAgentConfig,
  providerCatalog,
} from "@/features/workspace/providers";
import {
  buildGlobalSearchResults,
  filterGlobalSearchResults,
  GlobalSearchDialog,
  resolveGlobalSearchSelection,
  type GlobalSearchResult,
} from "@/features/workspace/search";
import {
  createApiPersistence,
  createDefaultWorkspaceSnapshot,
  createLocalStoragePersistence,
  type WorkspacePersistence,
  workspaceStorageKey,
} from "@/features/workspace/storage";
import {
  buildDeleteTaskConfirmationMessage,
  buildDeleteThreadMessageConfirmationMessage,
  collectTaskTags,
  addTask,
  appendAgentThreadMessage,
  appendHumanThreadMessage,
  deleteTask,
  deleteThreadMessage,
  type TaskComposerSubmitData,
  QuickAddDialog,
  readSelectedTask,
  toggleTaskCompleted,
  updateTask,
} from "@/features/workspace/tasks";
import {
  buildThreadContextSummary,
  buildThreadOwnerKey,
  readThreadOwnerName,
  ThreadSidePanel,
} from "@/features/workspace/threads";
import {
  buildWorkspaceThemeStyle,
  defaultWorkspaceThemeSelection,
  normalizeWorkspaceThemeSelection,
  workspaceThemeSelectionStorageKey,
  type WorkspaceThemeSelection,
} from "@/features/workspace/theme";
import {
  createDefaultShortcutMap,
  matchesBinding,
  normalizeShortcutMap,
  type WorkspaceShortcutMap,
  workspaceShortcutsStorageKey,
} from "@/features/workspace/shortcuts";
import { cn } from "@/lib/utils";

/**
 * Hosts the app shell, view switching, and task/configuration state wiring.
 */
export function WorkspaceApp() {
  const [workspace, setWorkspace] = useState(createDefaultWorkspaceSnapshot);
  const [agentConfig, setAgentConfig] = useState<AgentConfigState>(createDefaultAgentConfig);
  const [hasLoadedWorkspace, setHasLoadedWorkspace] = useState(false);
  const [hasLoadedAgentConfig, setHasLoadedAgentConfig] = useState(false);
  const [hasLoadedThemeSelection, setHasLoadedThemeSelection] = useState(false);
  const [hasLoadedShortcuts, setHasLoadedShortcuts] = useState(false);
  const [persistenceMode, setPersistenceMode] = useState<"api" | "local" | null>(null);
  const [activeMenu, setActiveMenu] = useState(createDefaultWorkspaceMenu);
  const [isSidebarVisible, setIsSidebarVisible] = useState(true);
  const [isProjectsExpanded, setIsProjectsExpanded] = useState(true);
  const [isInitiativesExpanded, setIsInitiativesExpanded] = useState(true);
  const [selectedProjectId, setSelectedProjectId] = useState<string | null>(null);
  const [selectedInitiativeId, setSelectedInitiativeId] = useState<string | null>(null);
  const [themeSelection, setThemeSelection] = useState<WorkspaceThemeSelection>(
    defaultWorkspaceThemeSelection,
  );
  const [shortcutMap, setShortcutMap] = useState<WorkspaceShortcutMap>(createDefaultShortcutMap);
  const [isGlobalSearchOpen, setIsGlobalSearchOpen] = useState(false);
  const [globalSearchQuery, setGlobalSearchQuery] = useState("");
  const [activeGlobalSearchIndex, setActiveGlobalSearchIndex] = useState(0);
  const [inboxComposerFocusSignal, setInboxComposerFocusSignal] = useState(0);
  const [selectedTaskId, setSelectedTaskId] = useState<string | null>(null);
  const [editingTaskId, setEditingTaskId] = useState<string | null>(null);
  const [editTitle, setEditTitle] = useState("");
  const [editDetails, setEditDetails] = useState("");
  const [editRemindOn, setEditRemindOn] = useState("");
  const [editDueBy, setEditDueBy] = useState("");
  const [editProject, setEditProject] = useState("");
  const [editTags, setEditTags] = useState("");
  const [threadDrafts, setThreadDrafts] = useState<Record<string, ThreadDraft>>({});
  const [pendingThreadOwnerKey, setPendingThreadOwnerKey] = useState<string | null>(null);
  const [threadPanelOwner, setThreadPanelOwner] = useState<ThreadOwnerRef | null>(null);
  const [fetchingModelsKeyId, setFetchingModelsKeyId] = useState<string | null>(null);
  const [isFetchingModels, setIsFetchingModels] = useState(false);
  const [modelErrorKeyId, setModelErrorKeyId] = useState<string | null>(null);
  const [modelFetchError, setModelFetchError] = useState<string | null>(null);
  const [isQuickAddOpen, setIsQuickAddOpen] = useState(false);
  const [databaseErrorMessage, setDatabaseErrorMessage] = useState<string | null>(null);

  const activeProvider: ProviderId = "openai";
  const activeProviderSettings = agentConfig.providers.openai;
  const activeProviderLabel = getProviderLabel(activeProvider);
  const isActiveProviderReady = Boolean(
    activeProviderSettings.apiKey.trim() && activeProviderSettings.model.trim(),
  );
  const visibleProjects = filterVisibleProjects(workspace.projects);
  const activeTasks = workspace.tasks.filter((task) => !task.completed);
  const completedTasks = workspace.tasks.filter((task) => task.completed);
  const selectedProject = readProjectById(workspace.projects, selectedProjectId);
  const selectedInitiative = readInitiativeById(workspace.initiatives, selectedInitiativeId);
  const globalSearchResults = filterGlobalSearchResults(
    buildGlobalSearchResults(workspace),
    globalSearchQuery,
  );
  const allTaskTags = collectTaskTags(workspace.tasks);

  const persistenceRef = useRef<WorkspacePersistence>(createLocalStoragePersistence());

  /**
   * Hydrates workspace data after mount. Tries the API first (PostgreSQL-backed),
   * then falls back to localStorage if the API is unavailable.
   */
  useEffect(() => {
    let cancelled = false;

    async function hydrate() {
      const apiPersistence = createApiPersistence();

      try {
        const snapshot = await apiPersistence.loadWorkspace();

        if (!cancelled) {
          persistenceRef.current = apiPersistence;
          setPersistenceMode("api");
          setDatabaseErrorMessage(null);
          setWorkspace(snapshot);
          setHasLoadedWorkspace(true);
          return;
        }
      } catch (error) {
        if (!cancelled) {
          setDatabaseErrorMessage(
            error instanceof Error && error.message.trim()
              ? error.message.trim()
              : "Relay could not load the workspace database.",
          );
        }

        // API unavailable — fall back to localStorage
      }

      if (cancelled) return;

      const localPersistence = createLocalStoragePersistence();

      try {
        const snapshot = await localPersistence.loadWorkspace();

        if (!cancelled) {
          persistenceRef.current = localPersistence;
          setPersistenceMode("local");
          setWorkspace(snapshot);
        }
      } catch {
        if (!cancelled) {
          setPersistenceMode("local");
          setWorkspace(createDefaultWorkspaceSnapshot());
        }
      }

      if (!cancelled) {
        setHasLoadedWorkspace(true);
      }
    }

    hydrate();

    return () => {
      cancelled = true;
    };
  }, []);

  /**
   * Persists tasks and agent history locally after the initial browser hydration is complete.
   */
  useEffect(() => {
    if (!hasLoadedWorkspace) {
      return;
    }

    window.localStorage.setItem(workspaceStorageKey, JSON.stringify(workspace));
  }, [workspace, hasLoadedWorkspace]);

  /**
   * Hydrates saved provider settings after mount so browser-only storage stays optional.
   */
  useEffect(() => {
    const savedConfig = window.localStorage.getItem(agentConfigStorageKey);

    if (!savedConfig) {
      setHasLoadedAgentConfig(true);
      return;
    }

    try {
      setAgentConfig(normalizeAgentConfig(JSON.parse(savedConfig)));
    } catch {
      setAgentConfig(createDefaultAgentConfig());
    }

    setHasLoadedAgentConfig(true);
  }, []);

  /**
   * Persists provider settings locally after the initial browser hydration is complete.
   */
  useEffect(() => {
    if (!hasLoadedAgentConfig) {
      return;
    }

    window.localStorage.setItem(agentConfigStorageKey, JSON.stringify(agentConfig));
  }, [agentConfig, hasLoadedAgentConfig]);

  /**
   * Hydrates the selected theme option and mode after mount so previews persist across refreshes.
   */
  useEffect(() => {
    const savedSelection = window.localStorage.getItem(workspaceThemeSelectionStorageKey);

    if (!savedSelection) {
      setHasLoadedThemeSelection(true);
      return;
    }

    try {
      setThemeSelection(normalizeWorkspaceThemeSelection(JSON.parse(savedSelection)));
    } catch {
      setThemeSelection(defaultWorkspaceThemeSelection);
    }

    setHasLoadedThemeSelection(true);
  }, []);

  /**
   * Persists the active theme option after the initial browser hydration is complete.
   */
  useEffect(() => {
    if (!hasLoadedThemeSelection) {
      return;
    }

    window.localStorage.setItem(
      workspaceThemeSelectionStorageKey,
      JSON.stringify(themeSelection),
    );
  }, [themeSelection, hasLoadedThemeSelection]);

  /**
   * Hydrates saved keyboard shortcuts after mount so user customizations persist across refreshes.
   */
  useEffect(() => {
    const savedShortcuts = window.localStorage.getItem(workspaceShortcutsStorageKey);

    if (!savedShortcuts) {
      setHasLoadedShortcuts(true);
      return;
    }

    try {
      setShortcutMap(normalizeShortcutMap(JSON.parse(savedShortcuts)));
    } catch {
      setShortcutMap(createDefaultShortcutMap());
    }

    setHasLoadedShortcuts(true);
  }, []);

  /**
   * Persists keyboard shortcuts locally after the initial browser hydration is complete.
   */
  useEffect(() => {
    if (!hasLoadedShortcuts) {
      return;
    }

    window.localStorage.setItem(workspaceShortcutsStorageKey, JSON.stringify(shortcutMap));
  }, [shortcutMap, hasLoadedShortcuts]);

  /**
   * Unified keyboard shortcut listener that dispatches both command and navigation actions
   * from the user-configurable shortcut map.
   */
  useEffect(() => {
    function handleWindowKeyDown(event: KeyboardEvent) {
      /* --- Command shortcuts (fire even from text inputs) --- */

      const globalSearchBinding = shortcutMap.commands["global-search"];

      if (globalSearchBinding && matchesBinding(event, globalSearchBinding)) {
        event.preventDefault();

        if (!isGlobalSearchOpen) {
          setGlobalSearchQuery("");
          setActiveGlobalSearchIndex(0);
          setIsGlobalSearchOpen(true);
        }

        return;
      }

      const newInboxTaskBinding = shortcutMap.commands["new-inbox-task"];

      if (newInboxTaskBinding && matchesBinding(event, newInboxTaskBinding)) {
        if (activeMenu !== "inbox" || selectedTaskId !== null) {
          return;
        }

        event.preventDefault();
        setInboxComposerFocusSignal((currentSignal) => currentSignal + 1);
        return;
      }

      const quickAddBinding = shortcutMap.commands["quick-add"];

      if (quickAddBinding && matchesBinding(event, quickAddBinding)) {
        event.preventDefault();

        if (!isQuickAddOpen) {
          setIsQuickAddOpen(true);
        }

        return;
      }

      /* --- Navigation shortcuts (skip when focus is inside text inputs) --- */

      const target = event.target as HTMLElement | null;

      if (
        target &&
        (target.tagName === "INPUT" ||
          target.tagName === "TEXTAREA" ||
          target.isContentEditable)
      ) {
        return;
      }

      if (isGlobalSearchOpen) {
        return;
      }

      for (const menu of Object.keys(shortcutMap.navigation) as Array<
        keyof typeof shortcutMap.navigation
      >) {
        const binding = shortcutMap.navigation[menu];

        if (binding && matchesBinding(event, binding)) {
          event.preventDefault();
          handleSelectMenu(menu);
          return;
        }
      }
    }

    window.addEventListener("keydown", handleWindowKeyDown);

    return () => {
      window.removeEventListener("keydown", handleWindowKeyDown);
    };
  }, [shortcutMap, isGlobalSearchOpen, isQuickAddOpen, activeMenu, selectedTaskId]);

  /**
   * Clears project-detail task editing state when the selected task no longer belongs to the
   * active project, such as after reassignment or cross-project navigation.
   */
  useEffect(() => {
    if (activeMenu !== "projects" || !selectedProjectId || !selectedTaskId) {
      return;
    }

    const activeTask = readSelectedTask(workspace.tasks, selectedTaskId);

    if (activeTask && activeTask.projectId === selectedProjectId) {
      return;
    }

    clearTaskFocus();
  }, [activeMenu, selectedProjectId, selectedTaskId, workspace.tasks]);

  /**
   * Resets the highlighted search row whenever the query changes so Enter always targets the
   * first visible match by default.
   */
  useEffect(() => {
    setActiveGlobalSearchIndex(0);
  }, [globalSearchQuery, isGlobalSearchOpen]);

  /**
   * Clamps the highlighted search row if the result list shrinks after workspace or query updates.
   */
  useEffect(() => {
    if (globalSearchResults.length === 0) {
      setActiveGlobalSearchIndex(0);
      return;
    }

    setActiveGlobalSearchIndex((currentIndex) =>
      currentIndex >= globalSearchResults.length
        ? globalSearchResults.length - 1
        : currentIndex,
    );
  }, [globalSearchResults.length]);

  function handleToggleSidebar() {
    setIsSidebarVisible((currentValue) => !currentValue);
  }

  /**
   * Reads the display name for the thread panel header based on the current owner.
   */
  function readThreadPanelOwnerName(): string {
    if (!threadPanelOwner) {
      return "";
    }

    return readThreadOwnerName(workspace, threadPanelOwner);
  }

  /**
   * Opens the thread side panel for a given owner entity.
   */
  function handleOpenThreadPanel(owner: ThreadOwnerRef) {
    setThreadPanelOwner(owner);
  }

  /**
   * Closes the thread side panel.
   */
  function handleCloseThreadPanel() {
    setThreadPanelOwner(null);
  }

  /**
   * Switches top-level destinations and resets entity-specific detail pages when the parent row
   * itself is clicked from the sidebar.
   */
  function handleSelectMenu(nextMenu: WorkspaceMenu) {
    setActiveMenu(nextMenu);
    setIsSidebarVisible(true);

    if (nextMenu === "projects") {
      clearTaskFocus();
      setSelectedProjectId(null);
      setSelectedInitiativeId(null);
      return;
    }

    if (nextMenu === "initiatives") {
      clearTaskFocus();
      setSelectedProjectId(null);
      setSelectedInitiativeId(null);
      return;
    }

    setSelectedProjectId(null);
    setSelectedInitiativeId(null);
    clearTaskFocus();
  }

  /**
   * Switches the active theme option so the user can compare directions in real time.
   */
  function handleSelectTheme(nextSelection: WorkspaceThemeSelection) {
    setThemeSelection(nextSelection);
  }

  function handleAddInitiative(data: { name: string; description: string; deadline: string }) {
    setWorkspace((current) => {
      const next = addInitiative(current, data);
      const created = next.initiatives.find((i) => !current.initiatives.some((ci) => ci.id === i.id));

      if (created) {
        persistenceRef.current.saveInitiative(created);
      }

      return next;
    });
  }

  function handleUpdateInitiative(data: { id: string; name: string; description: string; deadline: string }) {
    setWorkspace((current) => {
      const next = updateInitiative(current, {
        initiativeId: data.id,
        name: data.name,
        description: data.description,
        deadline: data.deadline,
      });
      const updated = next.initiatives.find((i) => i.id === data.id);

      if (updated) {
        persistenceRef.current.saveInitiative(updated);
      }

      return next;
    });
  }

  function handleDeleteInitiative(id: string) {
    setWorkspace((current) => deleteInitiative(current, id));
    persistenceRef.current.deleteInitiative(id);

    if (selectedInitiativeId === id) {
      setSelectedInitiativeId(null);
    }
  }

  function handleSelectInitiative(initiativeId: string) {
    clearTaskFocus();
    setActiveMenu("initiatives");
    setSelectedProjectId(null);
    setSelectedInitiativeId(initiativeId);
    setIsInitiativesExpanded(true);
    setIsSidebarVisible(true);
  }

  function handleAddProject(data: { name: string; initiativeId: string; deadline: string }) {
    setWorkspace((current) => {
      const next = addProject(current, data);
      const created = next.projects.find((p) => !current.projects.some((cp) => cp.id === p.id));

      if (created) {
        persistenceRef.current.saveProject(created);
      }

      return next;
    });
  }

  function handleUpdateProject(data: { id: string; name: string; initiativeId: string; deadline: string }) {
    setWorkspace((current) => {
      const next = updateProject(current, {
        projectId: data.id,
        name: data.name,
        initiativeId: data.initiativeId,
        deadline: data.deadline,
      });
      const updated = next.projects.find((p) => p.id === data.id);

      if (updated) {
        persistenceRef.current.saveProject(updated);
      }

      return next;
    });
  }

  function handleDeleteProject(id: string) {
    setWorkspace((current) => deleteProject(current, id));
    persistenceRef.current.deleteProject(id);

    if (selectedProjectId === id) {
      setSelectedProjectId(null);
    }
  }

  /**
   * Shared handler for all task composers — receives the final submit payload and persists it.
   */
  function handleAddTaskFromComposer(data: TaskComposerSubmitData) {
    setWorkspace((current) => {
      const next = addTask(current, data);
      const created = next.tasks.find((t) => !current.tasks.some((ct) => ct.id === t.id));

      if (created) {
        persistenceRef.current.saveTask(created);
      }

      return next;
    });
  }

  function handleSelectProject(projectId: string) {
    clearTaskFocus();
    setActiveMenu("projects");
    setSelectedInitiativeId(null);
    setSelectedProjectId(projectId);
    setIsProjectsExpanded(true);
    setIsSidebarVisible(true);
  }

  /**
   * Parses comma-separated tags string into an array.
   */
  function parseTagsFromString(tagsString: string): string[] {
    return tagsString
      .split(",")
      .map((tag) => tag.trim())
      .filter((tag) => tag.length > 0);
  }

  /**
   * Clears task-detail-specific UI state without mutating the underlying task data.
   */
  function clearTaskFocus() {
    handleCancelEdit();
  }

  /**
   * Opens a task directly into inline edit mode by mirroring its current values into local draft
   * state.
   */
  function handleOpenTask(taskId: string) {
    const task = workspace.tasks.find((candidate) => candidate.id === taskId);

    if (!task) {
      return;
    }

    if (editingTaskId === task.id && selectedTaskId === task.id) {
      return;
    }

    setSelectedTaskId(task.id);
    setEditingTaskId(task.id);
    setEditTitle(task.title);
    setEditDetails(task.details);
    setEditRemindOn(task.remindOn);
    setEditDueBy(task.dueBy);
    setEditProject(readProjectPickerValue(task.projectId));
    setEditTags(task.tags.join(", "));
  }

  /**
   * Persists the current edit draft back into the task list and closes edit mode.
   */
  function handleSaveEdit(taskId: string) {
    if (!editTitle.trim()) {
      return;
    }

    const nextTitle = editTitle;
    const nextDetails = editDetails;
    const nextRemindOn = editRemindOn;
    const nextDueBy = editDueBy;
    const nextProject = editProject;
    const nextTags = parseTagsFromString(editTags);

    setWorkspace((currentWorkspace) => {
      const next = updateTask(currentWorkspace, {
        taskId,
        title: nextTitle,
        details: nextDetails,
        remindOn: nextRemindOn,
        dueBy: nextDueBy,
        projectId: nextProject,
        tags: nextTags,
      });
      const updated = next.tasks.find((t) => t.id === taskId);

      if (updated) {
        persistenceRef.current.saveTask(updated);
      }

      return next;
    });
    handleCancelEdit();
  }

  /**
   * Cancels row editing and clears the temporary draft values.
   */
  function handleCancelEdit() {
    setSelectedTaskId(null);
    setEditingTaskId(null);
    setEditTitle("");
    setEditDetails("");
    setEditRemindOn("");
    setEditDueBy("");
    setEditProject("");
    setEditTags("");
    setThreadPanelOwner(null);
  }

  /**
   * Deletes a task from the single list and closes related UI if that task was active.
   */
  function handleDeleteTask(taskId: string) {
    const task = workspace.tasks.find((candidate) => candidate.id === taskId);

    if (!task) {
      return;
    }

    if (
      !window.confirm(
        buildDeleteTaskConfirmationMessage({
          taskTitle: task.title,
          messageCount: task.agentThread.messages.length,
        }),
      )
    ) {
      return;
    }

    setWorkspace((currentWorkspace) => deleteTask(currentWorkspace, taskId));
    persistenceRef.current.deleteTask(taskId);

    if (editingTaskId === taskId || selectedTaskId === taskId) {
      handleCancelEdit();
    }

    if (
      pendingThreadOwnerKey ===
      buildThreadOwnerKey({
        ownerType: "task",
        ownerId: taskId,
      })
    ) {
      setPendingThreadOwnerKey(null);
    }
  }

  /**
   * Toggles the completed state of a task.
   */
  function handleToggleTaskCompleted(taskId: string) {
    setWorkspace((currentWorkspace) => {
      const next = toggleTaskCompleted(currentWorkspace, taskId);
      const updated = next.tasks.find((t) => t.id === taskId);

      if (updated) {
        persistenceRef.current.saveTask(updated);
      }

      return next;
    });
  }

  /**
   * Deletes one saved thread message while keeping the owning entity intact.
   */
  function handleDeleteThreadMessage(owner: ThreadOwnerRef, messageId: string) {
    const thread = readThreadForOwner(workspace, owner);

    if (!thread || !thread.messages.some((message) => message.id === messageId)) {
      return;
    }

    if (
      !window.confirm(
        buildDeleteThreadMessageConfirmationMessage({
          ownerType: owner.ownerType,
          ownerName: readThreadOwnerName(workspace, owner),
        }),
      )
    ) {
      return;
    }

    setWorkspace((currentWorkspace) => deleteThreadMessage(currentWorkspace, owner, messageId));
    persistenceRef.current.deleteThreadMessage(owner, messageId);
  }

  /**
   * Stores the selected model on the targeted saved key and mirrors it onto the active provider.
   */
  function handleSavedKeyModelChange(providerId: ProviderId, keyId: string, model: string) {
    setAgentConfig((currentConfig) => {
      const providerState = currentConfig.providers[providerId];
      const targetKey = providerState.savedKeys.find((savedKey) => savedKey.id === keyId);

      if (!targetKey) {
        return currentConfig;
      }

      const updatedKeys = providerState.savedKeys.map((savedKey) =>
        savedKey.id === keyId ? { ...savedKey, model } : savedKey,
      );

      return {
        ...currentConfig,
        providers: {
          ...currentConfig.providers,
          [providerId]: {
            ...providerState,
            model: providerState.activeKeyId === keyId ? model : providerState.model,
            savedKeys: updatedKeys,
          },
        },
      };
    });
    setModelErrorKeyId(null);
    setModelFetchError(null);
  }

  /**
   * Updates the saved label or API key for an existing entry while preserving its selection state.
   */
  function handleUpdateSavedKey(
    providerId: ProviderId,
    keyId: string,
    label: string,
    apiKey: string,
  ) {
    setAgentConfig((currentConfig) => {
      const providerState = currentConfig.providers[providerId];
      const targetKey = providerState.savedKeys.find((savedKey) => savedKey.id === keyId);

      if (!targetKey) {
        return currentConfig;
      }

      const trimmedLabel = label.trim();
      const trimmedApiKey = apiKey.trim();
      const apiKeyChanged = targetKey.apiKey !== trimmedApiKey;
      const updatedKeys = providerState.savedKeys.map((savedKey) =>
        savedKey.id === keyId
          ? {
              ...savedKey,
              label: trimmedLabel,
              apiKey: trimmedApiKey,
              availableModels: apiKeyChanged ? [] : savedKey.availableModels,
            }
          : savedKey,
      );

      return {
        ...currentConfig,
        providers: {
          ...currentConfig.providers,
          [providerId]: {
            ...providerState,
            apiKey: providerState.activeKeyId === keyId ? trimmedApiKey : providerState.apiKey,
            savedKeys: updatedKeys,
          },
        },
      };
    });
    setFetchingModelsKeyId(null);
    setModelErrorKeyId(null);
    setModelFetchError(null);
  }

  /**
   * Fetches models for the targeted saved key and keeps the result attached to that key.
   */
  async function handleFetchModels(providerId: ProviderId, keyId: string) {
    const providerState = agentConfig.providers[providerId];
    const targetKey = providerState.savedKeys.find((savedKey) => savedKey.id === keyId);
    const apiKey = targetKey?.apiKey.trim() ?? "";

    if (!apiKey) {
      setModelErrorKeyId(keyId);
      setModelFetchError("Enter an API key before fetching models.");
      return;
    }

    setIsFetchingModels(true);
    setFetchingModelsKeyId(keyId);
    setModelErrorKeyId(null);
    setModelFetchError(null);

    try {
      const response = await fetch("/api/models", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ apiKey }),
      });

      const payload = (await response.json()) as Record<string, unknown>;

      if (!response.ok) {
        setModelErrorKeyId(keyId);
        setModelFetchError(
          typeof payload.error === "string" ? payload.error : "Failed to fetch models.",
        );
        return;
      }

      const models = Array.isArray(payload.models) ? (payload.models as string[]) : [];

      if (models.length === 0) {
        setModelErrorKeyId(keyId);
        setModelFetchError("No chat models found for this API key.");
        return;
      }

      setModelErrorKeyId(null);
      setModelFetchError(null);

      setAgentConfig((currentConfig) => {
        const currentProviderState = currentConfig.providers[providerId];
        const currentTargetKey = currentProviderState.savedKeys.find(
          (savedKey) => savedKey.id === keyId,
        );

        if (!currentTargetKey) {
          return currentConfig;
        }

        const nextModel = models.includes(currentTargetKey.model)
          ? currentTargetKey.model
          : models[0];
        const updatedKeys = currentProviderState.savedKeys.map((savedKey) =>
          savedKey.id === keyId
            ? {
                ...savedKey,
                model: nextModel,
                availableModels: models,
              }
            : savedKey,
        );

        return {
          ...currentConfig,
          providers: {
            ...currentConfig.providers,
            [providerId]: {
              ...currentProviderState,
              model:
                currentProviderState.activeKeyId === keyId
                  ? nextModel
                  : currentProviderState.model,
              savedKeys: updatedKeys,
            },
          },
        };
      });
    } catch (error) {
      setModelErrorKeyId(keyId);
      setModelFetchError(
        error instanceof Error ? error.message : "Failed to fetch models.",
      );
    } finally {
      setIsFetchingModels(false);
      setFetchingModelsKeyId(null);
    }
  }

  /**
   * Saves a new named API key for the given provider and sets it as the active key.
   */
  function handleSaveApiKey(providerId: ProviderId, label: string, apiKey: string) {
    const newKey = {
      id: createApiKeyId(),
      label,
      apiKey,
      model: providerCatalog[providerId].defaultModel,
      availableModels: [],
    };

    setAgentConfig((currentConfig) => ({
      ...currentConfig,
      providers: {
        ...currentConfig.providers,
        [providerId]: {
          ...currentConfig.providers[providerId],
          apiKey,
          model: newKey.model,
          savedKeys: [...currentConfig.providers[providerId].savedKeys, newKey],
          activeKeyId: newKey.id,
        },
      },
    }));
    setFetchingModelsKeyId(null);
    setModelErrorKeyId(null);
    setModelFetchError(null);
  }

  /**
   * Marks one saved key as active so only that key drives live requests and model selection.
   */
  function handleSetActiveKey(providerId: ProviderId, keyId: string) {
    setAgentConfig((currentConfig) => {
      const providerState = currentConfig.providers[providerId];
      const targetKey = providerState.savedKeys.find((savedKey) => savedKey.id === keyId);

      if (!targetKey) {
        return currentConfig;
      }

      return {
        ...currentConfig,
        providers: {
          ...currentConfig.providers,
          [providerId]: {
            ...providerState,
            apiKey: targetKey.apiKey,
            model: targetKey.model,
            activeKeyId: keyId,
          },
        },
      };
    });
    setFetchingModelsKeyId(null);
    setModelErrorKeyId(null);
    setModelFetchError(null);
  }

  /**
   * Removes a saved key and promotes the next remaining key when the active one is deleted.
   */
  function handleDeleteSavedKey(providerId: ProviderId, keyId: string) {
    setAgentConfig((currentConfig) => {
      const providerState = currentConfig.providers[providerId];
      const remainingKeys = providerState.savedKeys.filter((savedKey) => savedKey.id !== keyId);
      const wasActive = providerState.activeKeyId === keyId;
      const defaultProviderState = createDefaultProviderSettings(providerId);

      /* Keep the current active key when possible, otherwise fall forward to the next saved key. */
      const nextActiveKey = wasActive
        ? (remainingKeys[0] ?? null)
        : remainingKeys.find((savedKey) => savedKey.id === providerState.activeKeyId) ?? null;

      return {
        ...currentConfig,
        providers: {
          ...currentConfig.providers,
          [providerId]: {
            ...providerState,
            apiKey: nextActiveKey ? nextActiveKey.apiKey : defaultProviderState.apiKey,
            model: nextActiveKey ? nextActiveKey.model : defaultProviderState.model,
            savedKeys: remainingKeys,
            activeKeyId: nextActiveKey ? nextActiveKey.id : null,
          },
        },
      };
    });
    setFetchingModelsKeyId(null);
    setModelErrorKeyId(null);
    setModelFetchError(null);
  }

  /**
   * Stores the latest thread draft text for any supported owner and clears stale errors.
   */
  function handleThreadDraftChange(owner: ThreadOwnerRef, message: string) {
    const ownerKey = buildThreadOwnerKey(owner);

    setThreadDrafts((currentDrafts) => ({
      ...currentDrafts,
      [ownerKey]: {
        message,
        error: null,
      },
    }));
  }

  /**
   * Makes a live provider request for the current owner and stores the outcome in its thread.
   */
  async function handleSendThreadMessage(owner: ThreadOwnerRef) {
    const ownerKey = buildThreadOwnerKey(owner);
    const thread = readThreadForOwner(workspace, owner);
    const entityName = readThreadOwnerName(workspace, owner);
    const entityContext = buildThreadContextSummary(workspace, owner);
    const draft = readThreadDraft(threadDrafts, owner);
    const trimmedMessage = draft.message.trim();

    if (!thread) {
      return;
    }

    if (!trimmedMessage) {
      setThreadDrafts((currentDrafts) => ({
        ...currentDrafts,
        [ownerKey]: {
          ...draft,
          error: `Add a message for this ${owner.ownerType} thread.`,
        },
      }));
      return;
    }

    if (!activeProviderSettings.apiKey.trim()) {
      setThreadDrafts((currentDrafts) => ({
        ...currentDrafts,
        [ownerKey]: {
          ...draft,
          error: `Add a ${activeProviderLabel} API key in Configuration before making a live call.`,
        },
      }));
      return;
    }

    if (!activeProviderSettings.model.trim()) {
      setThreadDrafts((currentDrafts) => ({
        ...currentDrafts,
        [ownerKey]: {
          ...draft,
          error: `Add a ${activeProviderLabel} model in Configuration before making a live call.`,
        },
      }));
      return;
    }

    const createdAt = formatCallTimestamp(new Date());
    const nextHumanMessage = {
      id: `message-${thread.messages.length + 1}`,
      role: "human" as const,
      content: trimmedMessage,
      createdAt,
    };

    setPendingThreadOwnerKey(ownerKey);
    setThreadDrafts((currentDrafts) => ({
      ...currentDrafts,
      [ownerKey]: {
        ...createEmptyThreadDraft(),
        error: null,
      },
    }));
    setWorkspace((currentWorkspace) =>
      appendHumanThreadMessage(currentWorkspace, {
        owner,
        content: trimmedMessage,
        now: createdAt,
      }),
    );
    persistenceRef.current.saveThreadMessage(owner, nextHumanMessage);

    try {
      const response = await fetch("/api/agent-call", {
        method: "POST",
        headers: {
          "content-type": "application/json",
        },
        body: JSON.stringify({
          providerId: activeProvider,
          apiKey: activeProviderSettings.apiKey,
          model: activeProviderSettings.model,
          ownerType: owner.ownerType,
          entityName,
          entityContext,
          messages: [...thread.messages, nextHumanMessage],
        }),
      });
      const payload = await readJsonSafely(response);

      if (!response.ok) {
        const errorMessage = readApiErrorMessage(payload);

        setWorkspace((currentWorkspace) => {
          const next = appendAgentThreadMessage(currentWorkspace, {
            owner,
            providerId: activeProvider,
            model: activeProviderSettings.model.trim(),
            now: createdAt,
            status: "error",
            content: errorMessage,
          });
          persistNewThreadMessage(next, currentWorkspace, owner);

          return next;
        });
        setThreadDrafts((currentDrafts) => ({
          ...currentDrafts,
          [ownerKey]: {
            ...readThreadDraft(currentDrafts, owner),
            error: errorMessage,
          },
        }));
        return;
      }

      setWorkspace((currentWorkspace) => {
        const next = appendAgentThreadMessage(currentWorkspace, {
          owner,
          providerId: activeProvider,
          model: readApiModel(payload, activeProviderSettings.model),
          now: createdAt,
          status: "done",
          content: readApiResult(payload),
        });
        persistNewThreadMessage(next, currentWorkspace, owner);

        return next;
      });
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : "The live thread reply failed unexpectedly.";

      setWorkspace((currentWorkspace) => {
        const next = appendAgentThreadMessage(currentWorkspace, {
          owner,
          providerId: activeProvider,
          model: activeProviderSettings.model.trim(),
          now: createdAt,
          status: "error",
          content: errorMessage,
        });
        persistNewThreadMessage(next, currentWorkspace, owner);

        return next;
      });
      setThreadDrafts((currentDrafts) => ({
        ...currentDrafts,
        [ownerKey]: {
          ...readThreadDraft(currentDrafts, owner),
          error: errorMessage,
        },
      }));
    } finally {
      setPendingThreadOwnerKey(null);
    }
  }

  /**
   * Finds the newest thread message that was added between two workspace snapshots and persists it.
   */
  function persistNewThreadMessage(
    next: import("@/features/workspace/core").WorkspaceSnapshot,
    prev: import("@/features/workspace/core").WorkspaceSnapshot,
    owner: ThreadOwnerRef,
  ) {
    const nextThread = readThreadForOwner(next, owner);
    const prevThread = readThreadForOwner(prev, owner);

    if (!nextThread) return;

    const prevMessageIds = new Set(prevThread?.messages.map((m) => m.id) ?? []);
    const newMessage = nextThread.messages.find((m) => !prevMessageIds.has(m.id));

    if (newMessage) {
      persistenceRef.current.saveThreadMessage(owner, newMessage);
    }
  }

  /**
   * Closes and resets the global search dialog so each open starts from a clean query.
   */
  function handleCloseGlobalSearch() {
    setIsGlobalSearchOpen(false);
    setGlobalSearchQuery("");
    setActiveGlobalSearchIndex(0);
  }

  /**
   * Applies one selected search result to the app shell by switching both the top-level menu and
   * the focused center-pane destination when needed.
   */
  function handleSelectGlobalSearchResult(result: GlobalSearchResult) {
    const selection = resolveGlobalSearchSelection(result, workspace);

    setActiveMenu(selection.activeMenu);
    setSelectedProjectId(selection.selectedProjectId);
    setSelectedInitiativeId(selection.selectedInitiativeId);
    setIsSidebarVisible(true);

    if (selection.selectedProjectId) {
      setIsProjectsExpanded(true);
    }

    if (selection.selectedInitiativeId) {
      setIsInitiativesExpanded(true);
    }

    if (selection.selectedTaskId) {
      handleOpenTask(selection.selectedTaskId);
    } else {
      clearTaskFocus();
    }

    handleCloseGlobalSearch();
  }

  function renderActiveCenterContent() {
    if (activeMenu === "inbox") {
      return (
        <InboxView
          editDetails={editDetails}
          editDueBy={editDueBy}
          editingTaskId={editingTaskId}
          focusTitleInputSignal={inboxComposerFocusSignal}
          editProject={editProject}
          editRemindOn={editRemindOn}
          editTags={editTags}
          editTitle={editTitle}
          onAddTask={handleAddTaskFromComposer}
          onCancelEdit={handleCancelEdit}
          onDeleteTask={handleDeleteTask}
          onOpenTask={handleOpenTask}
          onOpenThreadPanel={(taskId) =>
            handleOpenThreadPanel({ ownerType: "task", ownerId: taskId })
          }
          onSaveEdit={handleSaveEdit}
          onSetEditDetails={setEditDetails}
          onSetEditDueBy={setEditDueBy}
          onSetEditProject={setEditProject}
          onSetEditRemindOn={setEditRemindOn}
          onSetEditTags={setEditTags}
          onSetEditTitle={setEditTitle}
          onToggleTaskCompleted={handleToggleTaskCompleted}
          projects={visibleProjects}
          tasks={activeTasks}
        />
      );
    }

    if (activeMenu === "tasks") {
      return (
        <TasksView
          editDetails={editDetails}
          editDueBy={editDueBy}
          editingTaskId={editingTaskId}
          editProject={editProject}
          editRemindOn={editRemindOn}
          editTags={editTags}
          editTitle={editTitle}
          onAddTask={handleAddTaskFromComposer}
          onCancelEdit={handleCancelEdit}
          onDeleteTask={handleDeleteTask}
          onOpenTask={handleOpenTask}
          onOpenThreadPanel={(taskId) =>
            handleOpenThreadPanel({ ownerType: "task", ownerId: taskId })
          }
          onSaveEdit={handleSaveEdit}
          onSetEditDetails={setEditDetails}
          onSetEditDueBy={setEditDueBy}
          onSetEditProject={setEditProject}
          onSetEditRemindOn={setEditRemindOn}
          onSetEditTags={setEditTags}
          onSetEditTitle={setEditTitle}
          onToggleTaskCompleted={handleToggleTaskCompleted}
          projects={visibleProjects}
          tasks={activeTasks}
        />
      );
    }

    if (activeMenu === "initiatives" && featureFlags.initiatives) {
      if (selectedInitiative) {
        return (
          <InitiativeDetailView
            initiative={selectedInitiative}
            onAddProject={handleAddProject}
            onBack={() => setSelectedInitiativeId(null)}
            onDeleteInitiative={handleDeleteInitiative}
            onOpenThreadPanel={(initiativeId) =>
              handleOpenThreadPanel({ ownerType: "initiative", ownerId: initiativeId })
            }
            onSelectProject={handleSelectProject}
            onUpdateInitiative={handleUpdateInitiative}
            projects={visibleProjects}
          />
        );
      }

      return (
        <InitiativeView
          initiatives={workspace.initiatives}
          onAddInitiative={handleAddInitiative}
          onSelectInitiative={handleSelectInitiative}
          projects={visibleProjects}
        />
      );
    }

    if (activeMenu === "projects") {
      if (selectedProject) {
        return (
          <ProjectDetailView
            editDetails={editDetails}
            editDueBy={editDueBy}
            editingTaskId={editingTaskId}
            editProject={editProject}
            editRemindOn={editRemindOn}
            editTags={editTags}
            editTitle={editTitle}
            initiatives={workspace.initiatives}
            onAddTask={handleAddTaskFromComposer}
            onBack={() => setSelectedProjectId(null)}
            onCancelEdit={handleCancelEdit}
            onDeleteProject={handleDeleteProject}
            onDeleteTask={handleDeleteTask}
            onOpenInitiative={handleSelectInitiative}
            onOpenTask={handleOpenTask}
            onOpenTaskThreadPanel={(taskId) =>
              handleOpenThreadPanel({ ownerType: "task", ownerId: taskId })
            }
            onOpenThreadPanel={(projectId) =>
              handleOpenThreadPanel({ ownerType: "project", ownerId: projectId })
            }
            onSaveEdit={handleSaveEdit}
            onSetEditDetails={setEditDetails}
            onSetEditDueBy={setEditDueBy}
            onSetEditProject={setEditProject}
            onSetEditRemindOn={setEditRemindOn}
            onSetEditTags={setEditTags}
            onSetEditTitle={setEditTitle}
            onUpdateProject={handleUpdateProject}
            project={selectedProject}
            projects={visibleProjects}
            tasks={activeTasks}
          />
        );
      }

      return (
        <ProjectView
          initiatives={workspace.initiatives}
          onAddProject={handleAddProject}
          onSelectProject={handleSelectProject}
          projects={visibleProjects}
          tasks={activeTasks}
        />
      );
    }

    if (activeMenu === "archive") {
      return (
        <ArchiveView
          completedTasks={completedTasks}
          onToggleTaskCompleted={handleToggleTaskCompleted}
          projects={visibleProjects}
        />
      );
    }

    if (activeMenu === "documentation") {
      return <DocumentationView />;
    }

    return (
      <AgentConfigurationView
        activeProvider={activeProvider}
        activeProviderLabel={activeProviderLabel}
        activeProviderSettings={activeProviderSettings}
        fetchingModelsKeyId={fetchingModelsKeyId}
        isActiveProviderReady={isActiveProviderReady}
        isFetchingModels={isFetchingModels}
        modelErrorKeyId={modelErrorKeyId}
        modelFetchError={modelFetchError}
        onDeleteSavedKey={handleDeleteSavedKey}
        onFetchModels={handleFetchModels}
        onOpenDocumentation={() => handleSelectMenu("documentation")}
        onSaveApiKey={handleSaveApiKey}
        onSavedKeyModelChange={handleSavedKeyModelChange}
        onSetActiveKey={handleSetActiveKey}
        onShortcutMapChange={setShortcutMap}
        onUpdateSavedKey={handleUpdateSavedKey}
        onThemeSelectionChange={handleSelectTheme}
        shortcutMap={shortcutMap}
        themeSelection={themeSelection}
      />
    );
  }

  return (
    <main
      className="workspace-theme-stage min-h-screen text-[color:var(--foreground)]"
      data-theme-mode={themeSelection.mode}
      data-theme-pair={themeSelection.themeId}
      style={buildWorkspaceThemeStyle(themeSelection)}
    >
      <GlobalSearchDialog
        activeIndex={activeGlobalSearchIndex}
        isOpen={isGlobalSearchOpen}
        onActiveIndexChange={setActiveGlobalSearchIndex}
        onClose={handleCloseGlobalSearch}
        onQueryChange={setGlobalSearchQuery}
        onSelectResult={handleSelectGlobalSearchResult}
        query={globalSearchQuery}
        results={globalSearchResults}
      />
      <QuickAddDialog
        allTags={allTaskTags}
        isOpen={isQuickAddOpen}
        onClose={() => setIsQuickAddOpen(false)}
        onSubmit={handleAddTaskFromComposer}
        projects={visibleProjects}
      />
      {persistenceMode === "local" && (
        <DatabaseUnavailableOverlay message={databaseErrorMessage} />
      )}

      <div className="flex h-screen">
        {/* Main content — shrinks when thread panel is open, scrolls independently */}
        <div className="min-w-0 flex-1 overflow-y-auto py-6">
          <div
            className={cn(
              "flex min-h-[calc(100vh-3rem)]",
              isSidebarVisible ? "gap-8" : "gap-0",
            )}
          >
            <div
              className={cn(
                "shrink-0 pl-[5px] transition-all duration-200 ease-out",
                isSidebarVisible ? "w-[272px] opacity-100" : "w-8 opacity-100",
              )}
            >
              {isSidebarVisible ? (
                <WorkspaceSidebar
                  activeMenu={activeMenu}
                  initiatives={workspace.initiatives}
                  isInitiativesExpanded={isInitiativesExpanded}
                  isProjectsExpanded={isProjectsExpanded}
                  onSelectInitiative={handleSelectInitiative}
                  onSelectMenu={handleSelectMenu}
                  onSelectProject={handleSelectProject}
                  onToggleInitiatives={() =>
                    setIsInitiativesExpanded((currentValue) => !currentValue)
                  }
                  onToggleProjects={() =>
                    setIsProjectsExpanded((currentValue) => !currentValue)
                  }
                  onToggleSidebar={handleToggleSidebar}
                  projects={workspace.projects}
                  selectedInitiativeId={selectedInitiativeId}
                  selectedProjectId={selectedProjectId}
                />
              ) : (
                <WorkspaceCollapsedRail onExpand={handleToggleSidebar} />
              )}
            </div>

            <section className="min-w-0 flex-1">
              <div className="mx-auto max-w-7xl">
                <div className="min-h-full px-1 py-2 sm:px-3">
                  {renderActiveCenterContent()}
                </div>
              </div>
            </section>
          </div>
        </div>

        {/* Thread side panel — tied to the active task/project/initiative */}
        {threadPanelOwner && (() => {
          const thread = readThreadForOwner(workspace, threadPanelOwner);
          if (!thread) return null;

          return (
            <ThreadSidePanel
              activeProviderLabel={activeProviderLabel}
              activeProviderModel={activeProviderSettings.model}
              draft={readThreadDraft(threadDrafts, threadPanelOwner)}
              isPending={pendingThreadOwnerKey === buildThreadOwnerKey(threadPanelOwner)}
              onClose={handleCloseThreadPanel}
              onDeleteMessage={(messageId) =>
                handleDeleteThreadMessage(threadPanelOwner, messageId)
              }
              onDraftChange={(message) =>
                handleThreadDraftChange(threadPanelOwner, message)
              }
              onSend={() => handleSendThreadMessage(threadPanelOwner)}
              ownerName={readThreadPanelOwnerName()}
              thread={thread}
            />
          );
        })()}
      </div>
    </main>
  );
}

function readProjectById(projects: Project[], projectId: string | null): Project | null {
  if (!projectId) {
    return null;
  }

  return projects.find((project) => project.id === projectId) ?? null;
}

function readInitiativeById(
  initiatives: Initiative[],
  initiativeId: string | null,
): Initiative | null {
  if (!initiativeId) {
    return null;
  }

  return initiatives.find((initiative) => initiative.id === initiativeId) ?? null;
}

/**
 * Supplies the default thread composer state when an owner has not drafted a message yet.
 */
function createEmptyThreadDraft(): ThreadDraft {
  return {
    message: "",
    error: null,
  };
}

/**
 * Returns a stable thread draft shape so the UI does not branch on undefined state.
 */
function readThreadDraft(
  threadDrafts: Record<string, ThreadDraft>,
  owner: ThreadOwnerRef,
): ThreadDraft {
  return threadDrafts[buildThreadOwnerKey(owner)] ?? createEmptyThreadDraft();
}

/**
 * Reads the thread for one supported owner so generic send and delete flows stay simple.
 */
function readThreadForOwner(workspace: ReturnType<typeof createDefaultWorkspaceSnapshot>, owner: ThreadOwnerRef) {
  if (owner.ownerType === "task") {
    return workspace.tasks.find((task) => task.id === owner.ownerId)?.agentThread ?? null;
  }

  if (owner.ownerType === "project") {
    return workspace.projects.find((project) => project.id === owner.ownerId)?.agentThread ?? null;
  }

  return (
    workspace.initiatives.find((initiative) => initiative.id === owner.ownerId)?.agentThread ??
    null
  );
}

/**
 * Formats timestamps for thread activity in a short human-readable style.
 */
function formatCallTimestamp(date: Date) {
  return new Intl.DateTimeFormat("en-US", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(date);
}

/**
 * Reads the provider result string from the route response with a clear fallback.
 */
function readApiResult(payload: unknown) {
  if (isRecord(payload) && typeof payload.result === "string" && payload.result.trim()) {
    return payload.result.trim();
  }

  return "The provider call completed without returning visible text.";
}

/**
 * Reads the model echoed back by the route so task history reflects the actual request.
 */
function readApiModel(payload: unknown, fallbackModel: string) {
  if (isRecord(payload) && typeof payload.model === "string" && payload.model.trim()) {
    return payload.model.trim();
  }

  return fallbackModel.trim();
}

/**
 * Reads a human-friendly error string from the route response body.
 */
function readApiErrorMessage(payload: unknown) {
  if (isRecord(payload) && typeof payload.error === "string" && payload.error.trim()) {
    return payload.error.trim();
  }

  return "The live thread reply failed.";
}

/**
 * Handles route responses that may fail before sending back JSON.
 */
async function readJsonSafely(response: Response) {
  try {
    return (await response.json()) as unknown;
  } catch {
    return null;
  }
}

/**
 * Keeps small unknown-value parsing helpers readable in the client component.
 */
function isRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === "object";
}

/**
 * A blocking overlay shown when the database-backed API was unreachable at
 * startup and the app fell back to browser localStorage. Prevents interaction
 * until the user reloads after fixing the runtime database configuration.
 */
function DatabaseUnavailableOverlay({ message }: { message: string | null }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
      <div className="mx-4 max-w-md space-y-4 rounded-lg bg-[color:var(--surface)] p-8 text-[color:var(--foreground)] shadow-lg">
        <h2 className="text-lg font-semibold">Database unavailable</h2>
        <p className="text-sm leading-relaxed text-[color:var(--muted-strong)]">
          {message ??
            "Relay could not connect to the database. The app cannot operate without the persistence layer."}
        </p>
        <p className="text-sm leading-relaxed text-[color:var(--muted-strong)]">
          Check that your{" "}
          <code className="rounded bg-[color:var(--surface-muted)] px-1.5 py-0.5 text-xs font-mono">
            SUPABASE_DATABASE_URL
          </code>{" "}
          or{" "}
          <code className="rounded bg-[color:var(--surface-muted)] px-1.5 py-0.5 text-xs font-mono">
            DATABASE_URL
          </code>{" "}
          is configured correctly, then reload the page.
        </p>
        <button
          className="mt-2 w-full rounded-md bg-[color:var(--foreground)] px-4 py-2 text-sm font-medium text-[color:var(--background)] transition-opacity hover:opacity-80"
          onClick={() => window.location.reload()}
          type="button"
        >
          Reload
        </button>
      </div>
    </div>
  );
}
