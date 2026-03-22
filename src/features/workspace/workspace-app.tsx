"use client";

import { useCallback, useEffect, useState } from "react";

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
  createDefaultWorkspaceSnapshot,
  defaultTaskGroupingMode,
  normalizeTaskGroupingMode,
  normalizeWorkspaceSnapshot,
  taskGroupingModeStorageKey,
  type TaskGroupingMode,
  workspaceStorageKey,
} from "@/features/workspace/storage";
import {
  buildDeleteTaskConfirmationMessage,
  buildDeleteThreadMessageConfirmationMessage,
  addTask,
  appendAgentThreadMessage,
  appendHumanThreadMessage,
  deleteTask,
  deleteThreadMessage,
  readSelectedTask,
  toggleTaskCompleted,
  updateTask,
} from "@/features/workspace/tasks";
import {
  buildThreadContextSummary,
  buildThreadOwnerKey,
  readThreadOwnerName,
} from "@/features/workspace/threads";
import {
  buildWorkspaceThemeStyle,
  defaultWorkspaceThemeSelection,
  normalizeWorkspaceThemeSelection,
  workspaceThemeSelectionStorageKey,
  type WorkspaceThemeSelection,
} from "@/features/workspace/theme";
import { cn } from "@/lib/utils";

/**
 * Hosts the app shell, view switching, and task/configuration state wiring.
 */
export function WorkspaceApp() {
  const [workspace, setWorkspace] = useState(createDefaultWorkspaceSnapshot);
  const [agentConfig, setAgentConfig] = useState<AgentConfigState>(createDefaultAgentConfig);
  const [hasLoadedWorkspace, setHasLoadedWorkspace] = useState(false);
  const [hasLoadedAgentConfig, setHasLoadedAgentConfig] = useState(false);
  const [hasLoadedGroupingMode, setHasLoadedGroupingMode] = useState(false);
  const [hasLoadedThemeSelection, setHasLoadedThemeSelection] = useState(false);
  const [activeMenu, setActiveMenu] = useState(createDefaultWorkspaceMenu);
  const [isSidebarVisible, setIsSidebarVisible] = useState(true);
  const [isProjectsExpanded, setIsProjectsExpanded] = useState(true);
  const [isInitiativesExpanded, setIsInitiativesExpanded] = useState(true);
  const [selectedProjectId, setSelectedProjectId] = useState<string | null>(null);
  const [selectedInitiativeId, setSelectedInitiativeId] = useState<string | null>(null);
  const [taskGroupingMode, setTaskGroupingMode] = useState<TaskGroupingMode>(
    defaultTaskGroupingMode,
  );
  const [themeSelection, setThemeSelection] = useState<WorkspaceThemeSelection>(
    defaultWorkspaceThemeSelection,
  );
  const [isGlobalSearchOpen, setIsGlobalSearchOpen] = useState(false);
  const [globalSearchQuery, setGlobalSearchQuery] = useState("");
  const [activeGlobalSearchIndex, setActiveGlobalSearchIndex] = useState(0);
  const [newTaskTitle, setNewTaskTitle] = useState("");
  const [newTaskDetails, setNewTaskDetails] = useState("");
  const [newTaskProject, setNewTaskProject] = useState("");
  const [newTaskTags, setNewTaskTags] = useState("");
  const [isInboxComposerOpen, setIsInboxComposerOpen] = useState(false);
  const [inboxComposerFocusSignal, setInboxComposerFocusSignal] = useState(0);
  const [selectedTaskId, setSelectedTaskId] = useState<string | null>(null);
  const [editingTaskId, setEditingTaskId] = useState<string | null>(null);
  const [editTitle, setEditTitle] = useState("");
  const [editDetails, setEditDetails] = useState("");
  const [editProject, setEditProject] = useState("");
  const [editTags, setEditTags] = useState("");
  const [threadDrafts, setThreadDrafts] = useState<Record<string, ThreadDraft>>({});
  const [pendingThreadOwnerKey, setPendingThreadOwnerKey] = useState<string | null>(null);
  const [fetchingModelsKeyId, setFetchingModelsKeyId] = useState<string | null>(null);
  const [isFetchingModels, setIsFetchingModels] = useState(false);
  const [modelErrorKeyId, setModelErrorKeyId] = useState<string | null>(null);
  const [modelFetchError, setModelFetchError] = useState<string | null>(null);

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

  /**
   * Clears task-detail-specific UI state without mutating the underlying task data.
   */
  const clearTaskFocus = useCallback(() => {
    setSelectedTaskId(null);
    setEditingTaskId(null);
    setEditTitle("");
    setEditDetails("");
    setEditProject("");
    setEditTags("");
  }, []);

  /**
   * Hydrates saved workspace data after mount so task edits survive a browser refresh.
   */
  useEffect(() => {
    const savedWorkspace = window.localStorage.getItem(workspaceStorageKey);

    if (!savedWorkspace) {
      setHasLoadedWorkspace(true);
      return;
    }

    try {
      setWorkspace(normalizeWorkspaceSnapshot(JSON.parse(savedWorkspace)));
    } catch {
      setWorkspace(createDefaultWorkspaceSnapshot());
    }

    setHasLoadedWorkspace(true);
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
   * Hydrates saved task grouping mode preference after mount.
   */
  useEffect(() => {
    const savedMode = window.localStorage.getItem(taskGroupingModeStorageKey);

    if (!savedMode) {
      setHasLoadedGroupingMode(true);
      return;
    }

    try {
      setTaskGroupingMode(normalizeTaskGroupingMode(savedMode));
    } catch {
      setTaskGroupingMode(defaultTaskGroupingMode);
    }

    setHasLoadedGroupingMode(true);
  }, []);

  /**
   * Persists task grouping mode preference after the initial browser hydration is complete.
   */
  useEffect(() => {
    if (!hasLoadedGroupingMode) {
      return;
    }

    window.localStorage.setItem(taskGroupingModeStorageKey, taskGroupingMode);
  }, [taskGroupingMode, hasLoadedGroupingMode]);

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
   * Opens the global search dialog from anywhere in the workspace with the platform-standard
   * quick-search shortcut.
   */
  useEffect(() => {
    function handleWindowKeyDown(event: KeyboardEvent) {
      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === "k") {
        event.preventDefault();

        if (isGlobalSearchOpen) {
          return;
        }

        setGlobalSearchQuery("");
        setActiveGlobalSearchIndex(0);
        setIsGlobalSearchOpen(true);
      }
    }

    window.addEventListener("keydown", handleWindowKeyDown);

    return () => {
      window.removeEventListener("keydown", handleWindowKeyDown);
    };
  }, [isGlobalSearchOpen]);

  /**
   * Opens the inbox composer from the platform-standard new-item shortcut only when the inbox
   * overview is active and no inline task editor is open.
   */
  useEffect(() => {
    function handleWindowKeyDown(event: KeyboardEvent) {
      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === "n") {
        if (activeMenu !== "inbox" || selectedTaskId !== null) {
          return;
        }

        event.preventDefault();
        if (!isInboxComposerOpen) {
          setNewTaskProject("");
          setIsInboxComposerOpen(true);
        }

        setInboxComposerFocusSignal((currentSignal) => currentSignal + 1);
      }
    }

    window.addEventListener("keydown", handleWindowKeyDown);

    return () => {
      window.removeEventListener("keydown", handleWindowKeyDown);
    };
  }, [activeMenu, isInboxComposerOpen, selectedTaskId]);

  /**
   * Clears inbox-only draft state when the user leaves the inbox view so stale composer state does
   * not leak into later visits.
   */
  useEffect(() => {
    if (activeMenu === "inbox") {
      return;
    }

    setIsInboxComposerOpen(false);
    setNewTaskTitle("");
    setNewTaskDetails("");
    setNewTaskProject("");
    setNewTaskTags("");
  }, [activeMenu]);

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
  }, [activeMenu, clearTaskFocus, selectedProjectId, selectedTaskId, workspace.tasks]);

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
    setWorkspace((current) => addInitiative(current, data));
  }

  function handleUpdateInitiative(data: { id: string; name: string; description: string; deadline: string }) {
    setWorkspace((current) =>
      updateInitiative(current, {
        initiativeId: data.id,
        name: data.name,
        description: data.description,
        deadline: data.deadline,
      }),
    );
  }

  function handleDeleteInitiative(id: string) {
    setWorkspace((current) => deleteInitiative(current, id));

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
    setWorkspace((current) => addProject(current, data));
  }

  function handleUpdateProject(data: { id: string; name: string; initiativeId: string; deadline: string }) {
    setWorkspace((current) =>
      updateProject(current, {
        projectId: data.id,
        name: data.name,
        initiativeId: data.initiativeId,
        deadline: data.deadline,
      }),
    );
  }

  function handleDeleteProject(id: string) {
    setWorkspace((current) => deleteProject(current, id));

    if (selectedProjectId === id) {
      setSelectedProjectId(null);
    }
  }

  function handleAddTaskFromProject(data: { title: string; details: string; projectId: string; tags: string[] }) {
    setWorkspace((current) => addTask(current, data));
  }

  function handleSelectProject(projectId: string) {
    clearTaskFocus();
    setActiveMenu("projects");
    setSelectedInitiativeId(null);
    setSelectedProjectId(projectId);
    setIsProjectsExpanded(true);
    setIsSidebarVisible(true);
    setNewTaskProject(projectId);
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
   * Creates a task when the title is present, then clears the draft fields for the next entry.
   */
  function handleAddTask() {
    if (!newTaskTitle.trim()) {
      return;
    }

    setWorkspace((currentWorkspace) =>
      addTask(currentWorkspace, {
        title: newTaskTitle,
        details: newTaskDetails,
        projectId: newTaskProject,
        tags: parseTagsFromString(newTaskTags),
      }),
    );
    setNewTaskTitle("");
    setNewTaskDetails("");
    setNewTaskProject("");
    setNewTaskTags("");
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

    if (activeMenu === "inbox") {
      setIsInboxComposerOpen(false);
    }

    setSelectedTaskId(task.id);
    setEditingTaskId(task.id);
    setEditTitle(task.title);
    setEditDetails(task.details);
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
    const nextProject = editProject;
    const nextTags = parseTagsFromString(editTags);

    setWorkspace((currentWorkspace) =>
      updateTask(currentWorkspace, {
        taskId,
        title: nextTitle,
        details: nextDetails,
        projectId: nextProject,
        tags: nextTags,
      }),
    );
    handleCancelEdit();
  }

  /**
   * Cancels row editing and clears the temporary draft values.
   */
  function handleCancelEdit() {
    clearTaskFocus();
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
    setWorkspace((currentWorkspace) => toggleTaskCompleted(currentWorkspace, taskId));
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

        setWorkspace((currentWorkspace) =>
          appendAgentThreadMessage(currentWorkspace, {
            owner,
            providerId: activeProvider,
            model: activeProviderSettings.model.trim(),
            now: createdAt,
            status: "error",
            content: errorMessage,
          }),
        );
        setThreadDrafts((currentDrafts) => ({
          ...currentDrafts,
          [ownerKey]: {
            ...readThreadDraft(currentDrafts, owner),
            error: errorMessage,
          },
        }));
        return;
      }

      setWorkspace((currentWorkspace) =>
        appendAgentThreadMessage(currentWorkspace, {
          owner,
          providerId: activeProvider,
          model: readApiModel(payload, activeProviderSettings.model),
          now: createdAt,
          status: "done",
          content: readApiResult(payload),
        }),
      );
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : "The live thread reply failed unexpectedly.";

      setWorkspace((currentWorkspace) =>
        appendAgentThreadMessage(currentWorkspace, {
          owner,
          providerId: activeProvider,
          model: activeProviderSettings.model.trim(),
          now: createdAt,
          status: "error",
          content: errorMessage,
        }),
      );
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
    const selection = resolveGlobalSearchSelection(result);

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
          editingTaskId={editingTaskId}
          focusTitleInputSignal={inboxComposerFocusSignal}
          editProject={editProject}
          editTags={editTags}
          editTitle={editTitle}
          isComposerExpanded={isInboxComposerOpen}
          newTaskDetails={newTaskDetails}
          newTaskProject={newTaskProject}
          newTaskTags={newTaskTags}
          newTaskTitle={newTaskTitle}
          onAddTask={handleAddTask}
          onCancelEdit={handleCancelEdit}
          onSetComposerExpanded={setIsInboxComposerOpen}
          onDeleteTask={handleDeleteTask}
          onOpenTask={handleOpenTask}
          onSaveEdit={handleSaveEdit}
          onSetEditDetails={setEditDetails}
          onSetEditProject={setEditProject}
          onSetEditTags={setEditTags}
          onSetEditTitle={setEditTitle}
          onSetNewTaskDetails={setNewTaskDetails}
          onSetNewTaskProject={setNewTaskProject}
          onSetNewTaskTags={setNewTaskTags}
          onSetNewTaskTitle={setNewTaskTitle}
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
            activeProviderLabel={activeProviderLabel}
            activeProviderModel={activeProviderSettings.model}
            initiative={selectedInitiative}
            onAddProject={handleAddProject}
            onBack={() => setSelectedInitiativeId(null)}
            onDeleteInitiative={handleDeleteInitiative}
            onDeleteThreadMessage={(initiativeId, messageId) =>
              handleDeleteThreadMessage(
                {
                  ownerType: "initiative",
                  ownerId: initiativeId,
                },
                messageId,
              )
            }
            onSelectProject={handleSelectProject}
            onSendThreadMessage={(initiativeId) =>
              handleSendThreadMessage({
                ownerType: "initiative",
                ownerId: initiativeId,
              })
            }
            onThreadDraftChange={(initiativeId, message) =>
              handleThreadDraftChange(
                {
                  ownerType: "initiative",
                  ownerId: initiativeId,
                },
                message,
              )
            }
            onUpdateInitiative={handleUpdateInitiative}
            pendingThreadId={
              pendingThreadOwnerKey?.startsWith("initiative:")
                ? pendingThreadOwnerKey.slice("initiative:".length)
                : null
            }
            projects={visibleProjects}
            readThreadDraft={(initiativeId) =>
              readThreadDraft(threadDrafts, {
                ownerType: "initiative",
                ownerId: initiativeId,
              })
            }
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
            activeProviderLabel={activeProviderLabel}
            activeProviderModel={activeProviderSettings.model}
            editDetails={editDetails}
            editingTaskId={editingTaskId}
            editProject={editProject}
            editTags={editTags}
            editTitle={editTitle}
            initiatives={workspace.initiatives}
            onAddTask={handleAddTaskFromProject}
            onBack={() => setSelectedProjectId(null)}
            onCancelEdit={handleCancelEdit}
            onDeleteProject={handleDeleteProject}
            onDeleteThreadMessage={(projectId, messageId) =>
              handleDeleteThreadMessage(
                {
                  ownerType: "project",
                  ownerId: projectId,
                },
                messageId,
              )
            }
            onDeleteTask={handleDeleteTask}
            onOpenInitiative={handleSelectInitiative}
            onOpenTask={handleOpenTask}
            onSaveEdit={handleSaveEdit}
            onSendThreadMessage={(projectId) =>
              handleSendThreadMessage({
                ownerType: "project",
                ownerId: projectId,
              })
            }
            onSetEditDetails={setEditDetails}
            onSetEditProject={setEditProject}
            onSetEditTags={setEditTags}
            onSetEditTitle={setEditTitle}
            onThreadDraftChange={(projectId, message) =>
              handleThreadDraftChange(
                {
                  ownerType: "project",
                  ownerId: projectId,
                },
                message,
              )
            }
            onUpdateProject={handleUpdateProject}
            pendingThreadId={
              pendingThreadOwnerKey?.startsWith("project:")
                ? pendingThreadOwnerKey.slice("project:".length)
                : null
            }
            project={selectedProject}
            projects={visibleProjects}
            readThreadDraft={(projectId) =>
              readThreadDraft(threadDrafts, {
                ownerType: "project",
                ownerId: projectId,
              })
            }
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
        onSaveApiKey={handleSaveApiKey}
        onSavedKeyModelChange={handleSavedKeyModelChange}
        onSetActiveKey={handleSetActiveKey}
        onUpdateSavedKey={handleUpdateSavedKey}
        onThemeSelectionChange={handleSelectTheme}
        themeSelection={themeSelection}
      />
    );
  }

  return (
    <main
      className="workspace-theme-stage min-h-screen px-4 py-6 text-[color:var(--foreground)]"
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
      <div className="mx-auto max-w-7xl">
        <div
          className={cn(
            "flex min-h-[calc(100vh-3rem)]",
            isSidebarVisible ? "gap-8" : "gap-0",
          )}
        >
          <div
            className={cn(
              "shrink-0 transition-all duration-200 ease-out",
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
            <div className="min-h-full px-1 py-2 sm:px-3">
              {renderActiveCenterContent()}
            </div>
          </section>
        </div>
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
