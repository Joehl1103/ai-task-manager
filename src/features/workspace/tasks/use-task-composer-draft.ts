"use client";

import { useCallback, useState } from "react";

export interface TaskComposerDraft {
  title: string;
  details: string;
  dueBy: string;
  remindOn: string;
  projectId: string;
  tags: string;
}

interface TaskComposerDraftDefaults {
  projectId?: string;
}

function createEmptyDraft(defaults?: TaskComposerDraftDefaults): TaskComposerDraft {
  return {
    title: "",
    details: "",
    dueBy: "",
    remindOn: "",
    projectId: defaults?.projectId ?? "",
    tags: "",
  };
}

/**
 * Encapsulates the six form fields shared by every task creation surface so each composer manages
 * its own draft state without duplicating useState calls.
 */
export function useTaskComposerDraft(defaults?: TaskComposerDraftDefaults) {
  const [draft, setDraft] = useState<TaskComposerDraft>(() => createEmptyDraft(defaults));

  const setField = useCallback(
    <K extends keyof TaskComposerDraft>(field: K, value: TaskComposerDraft[K]) => {
      setDraft((current) => ({ ...current, [field]: value }));
    },
    [],
  );

  const resetDraft = useCallback(
    (nextDefaults?: TaskComposerDraftDefaults) => {
      setDraft(createEmptyDraft(nextDefaults ?? defaults));
    },
    [defaults],
  );

  return { draft, setField, resetDraft } as const;
}
