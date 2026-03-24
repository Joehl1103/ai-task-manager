"use client";

import { useCallback, useEffect, useState } from "react";

import { Button } from "@/components/ui/button";
import { readWorkspaceMenuLabel, workspaceMenus } from "@/features/workspace/navigation";
import type { WorkspaceMenu } from "@/features/workspace/navigation";

import {
  type ShortcutAction,
  type WorkspaceCommandId,
  type WorkspaceShortcutMap,
  createDefaultShortcutMap,
  findShortcutConflict,
  formatShortcutLabel,
  parseKeyboardEvent,
  readCommandLabel,
} from "./workspace-shortcuts";

const allCommands: WorkspaceCommandId[] = ["global-search", "new-inbox-task"];

interface ShortcutConfigurationPanelProps {
  shortcutMap: WorkspaceShortcutMap;
  onShortcutMapChange: (nextMap: WorkspaceShortcutMap) => void;
}

/**
 * Renders the shortcut assignment rows inside the configuration disclosure panel.
 */
export function ShortcutConfigurationPanel({
  shortcutMap,
  onShortcutMapChange,
}: ShortcutConfigurationPanelProps) {
  const [recordingAction, setRecordingAction] = useState<ShortcutAction | null>(null);
  const [conflictMessage, setConflictMessage] = useState<string | null>(null);

  /**
   * Listens for the next keypress while in recording mode and assigns or rejects the binding.
   */
  const handleCaptureKeyDown = useCallback(
    (event: KeyboardEvent) => {
      if (!recordingAction) return;

      event.preventDefault();
      event.stopPropagation();

      const parsed = parseKeyboardEvent(event);

      if (!parsed) return;

      if (event.key === "Escape") {
        setRecordingAction(null);
        setConflictMessage(null);
        return;
      }

      const conflict = findShortcutConflict(shortcutMap, parsed, recordingAction);

      if (conflict) {
        setConflictMessage(`Already bound to "${conflict}"`);
        return;
      }

      const binding = { ...parsed, action: recordingAction };

      if (recordingAction.type === "navigate") {
        onShortcutMapChange({
          ...shortcutMap,
          navigation: {
            ...shortcutMap.navigation,
            [recordingAction.menu]: binding,
          },
        });
      } else {
        onShortcutMapChange({
          ...shortcutMap,
          commands: {
            ...shortcutMap.commands,
            [recordingAction.commandId]: binding,
          },
        });
      }

      setRecordingAction(null);
      setConflictMessage(null);
    },
    [recordingAction, shortcutMap, onShortcutMapChange],
  );

  useEffect(() => {
    if (!recordingAction) return;

    window.addEventListener("keydown", handleCaptureKeyDown, true);

    return () => {
      window.removeEventListener("keydown", handleCaptureKeyDown, true);
    };
  }, [recordingAction, handleCaptureKeyDown]);

  function handleStartRecording(action: ShortcutAction) {
    setRecordingAction(action);
    setConflictMessage(null);
  }

  function handleClearBinding(action: ShortcutAction) {
    if (action.type === "navigate") {
      onShortcutMapChange({
        ...shortcutMap,
        navigation: {
          ...shortcutMap.navigation,
          [action.menu]: null,
        },
      });
    } else {
      onShortcutMapChange({
        ...shortcutMap,
        commands: {
          ...shortcutMap.commands,
          [action.commandId]: null,
        },
      });
    }

    if (
      recordingAction &&
      recordingAction.type === action.type &&
      ((action.type === "navigate" &&
        recordingAction.type === "navigate" &&
        action.menu === recordingAction.menu) ||
        (action.type === "command" &&
          recordingAction.type === "command" &&
          action.commandId === recordingAction.commandId))
    ) {
      setRecordingAction(null);
      setConflictMessage(null);
    }
  }

  function handleResetAll() {
    onShortcutMapChange(createDefaultShortcutMap());
    setRecordingAction(null);
    setConflictMessage(null);
  }

  function isRecording(action: ShortcutAction): boolean {
    if (!recordingAction) return false;

    if (action.type === "navigate" && recordingAction.type === "navigate") {
      return action.menu === recordingAction.menu;
    }

    if (action.type === "command" && recordingAction.type === "command") {
      return action.commandId === recordingAction.commandId;
    }

    return false;
  }

  return (
    <div className="space-y-5">
      <section className="space-y-2">
        <p className="text-xs font-medium uppercase tracking-[0.18em] text-[color:var(--muted)]">
          Commands
        </p>
        <div className="space-y-1">
          {allCommands.map((commandId) => {
            const action: ShortcutAction = { type: "command", commandId };
            const binding = shortcutMap.commands[commandId];
            const recording = isRecording(action);

            return (
              <ShortcutRow
                binding={binding ? formatShortcutLabel(binding) : null}
                conflictMessage={recording ? conflictMessage : null}
                isRecording={recording}
                key={commandId}
                label={readCommandLabel(commandId)}
                onClear={() => handleClearBinding(action)}
                onRecord={() => handleStartRecording(action)}
              />
            );
          })}
        </div>
      </section>

      <section className="space-y-2">
        <p className="text-xs font-medium uppercase tracking-[0.18em] text-[color:var(--muted)]">
          Navigation
        </p>
        <div className="space-y-1">
          {workspaceMenus.map((menu: WorkspaceMenu) => {
            const action: ShortcutAction = { type: "navigate", menu };
            const binding = shortcutMap.navigation[menu];
            const recording = isRecording(action);

            return (
              <ShortcutRow
                binding={binding ? formatShortcutLabel(binding) : null}
                conflictMessage={recording ? conflictMessage : null}
                isRecording={recording}
                key={menu}
                label={readWorkspaceMenuLabel(menu)}
                onClear={() => handleClearBinding(action)}
                onRecord={() => handleStartRecording(action)}
              />
            );
          })}
        </div>
      </section>

      <div className="pt-1">
        <Button onClick={handleResetAll} size="sm" type="button" variant="ghost">
          Reset all to defaults
        </Button>
      </div>
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/*  Row                                                                       */
/* -------------------------------------------------------------------------- */

interface ShortcutRowProps {
  label: string;
  binding: string | null;
  isRecording: boolean;
  conflictMessage: string | null;
  onRecord: () => void;
  onClear: () => void;
}

/**
 * One row inside the shortcut configuration panel.
 */
function ShortcutRow({
  label,
  binding,
  isRecording,
  conflictMessage,
  onRecord,
  onClear,
}: ShortcutRowProps) {
  return (
    <div className="flex items-center justify-between gap-3 rounded-md px-2 py-2 transition-colors hover:bg-[color:var(--row-hover)]">
      <span className="min-w-0 text-sm font-medium text-[color:var(--foreground)]">
        {label}
      </span>

      <div className="flex shrink-0 items-center gap-2">
        {isRecording ? (
          <span className="text-xs text-[color:var(--muted)]">
            {conflictMessage ?? "Press a key combo…"}
          </span>
        ) : binding ? (
          <kbd className="rounded border border-[color:var(--border)] bg-[color:var(--surface-muted)] px-2 py-0.5 text-xs font-medium text-[color:var(--foreground)]">
            {binding}
          </kbd>
        ) : (
          <span className="text-xs text-[color:var(--muted)]">Not set</span>
        )}

        <Button
          className="h-7 text-xs"
          onClick={onRecord}
          size="sm"
          type="button"
          variant={isRecording ? "outline" : "ghost"}
        >
          {isRecording ? "Cancel" : "Record"}
        </Button>

        {binding && !isRecording ? (
          <Button
            className="h-7 text-xs"
            onClick={onClear}
            size="sm"
            type="button"
            variant="ghost"
          >
            Clear
          </Button>
        ) : null}
      </div>
    </div>
  );
}
