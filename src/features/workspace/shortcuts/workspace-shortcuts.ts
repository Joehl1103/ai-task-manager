import {
  type WorkspaceMenu,
  readWorkspaceMenuLabel,
  workspaceMenus,
} from "@/features/workspace/navigation";

/* -------------------------------------------------------------------------- */
/*  Action model                                                              */
/* -------------------------------------------------------------------------- */

export type WorkspaceCommandId = "global-search" | "new-inbox-task" | "quick-add";

export type ShortcutAction =
  | { type: "navigate"; menu: WorkspaceMenu }
  | { type: "command"; commandId: WorkspaceCommandId };

export interface ShortcutBinding {
  action: ShortcutAction;
  key: string;
  metaKey?: boolean;
  ctrlKey?: boolean;
  shiftKey?: boolean;
  altKey?: boolean;
}

export interface WorkspaceShortcutMap {
  navigation: Record<WorkspaceMenu, ShortcutBinding | null>;
  commands: Record<WorkspaceCommandId, ShortcutBinding | null>;
}

/* -------------------------------------------------------------------------- */
/*  Storage                                                                   */
/* -------------------------------------------------------------------------- */

export const workspaceShortcutsStorageKey = "relay-workspace-shortcuts";

/* -------------------------------------------------------------------------- */
/*  Defaults                                                                  */
/* -------------------------------------------------------------------------- */

const allCommands: WorkspaceCommandId[] = ["global-search", "new-inbox-task", "quick-add"];

/**
 * Ships command shortcuts with the current hardcoded defaults and navigation shortcuts empty.
 */
export function createDefaultShortcutMap(): WorkspaceShortcutMap {
  const navigation = {} as Record<WorkspaceMenu, ShortcutBinding | null>;

  for (const menu of workspaceMenus) {
    navigation[menu] = null;
  }

  return {
    navigation,
    commands: {
      "global-search": {
        action: { type: "command", commandId: "global-search" },
        key: "k",
        metaKey: true,
      },
      "new-inbox-task": {
        action: { type: "command", commandId: "new-inbox-task" },
        key: "n",
        metaKey: true,
      },
      "quick-add": {
        action: { type: "command", commandId: "quick-add" },
        key: "n",
        metaKey: true,
        altKey: true,
        ctrlKey: true,
      },
    },
  };
}

/* -------------------------------------------------------------------------- */
/*  Display helpers                                                           */
/* -------------------------------------------------------------------------- */

const commandLabels: Record<WorkspaceCommandId, string> = {
  "global-search": "Global search",
  "new-inbox-task": "New inbox task",
  "quick-add": "Quick add task",
};

export function readCommandLabel(commandId: WorkspaceCommandId): string {
  return commandLabels[commandId];
}

/**
 * Renders a human-readable label for a shortcut binding like "⌘ K" or "⌥ ⇧ T".
 */
export function formatShortcutLabel(binding: ShortcutBinding): string {
  const parts: string[] = [];

  if (binding.ctrlKey) parts.push("⌃");
  if (binding.altKey) parts.push("⌥");
  if (binding.shiftKey) parts.push("⇧");
  if (binding.metaKey) parts.push("⌘");

  parts.push(binding.key.length === 1 ? binding.key.toUpperCase() : binding.key);

  return parts.join(" ");
}

/* -------------------------------------------------------------------------- */
/*  Event capture                                                             */
/* -------------------------------------------------------------------------- */

/** Keys that are only modifiers and should not be captured as the primary key. */
const modifierKeys = new Set(["Meta", "Control", "Alt", "Shift"]);

/**
 * Captures a keyboard event into the modifier+key shape without an action attached.
 * Returns null when only a bare modifier is pressed.
 */
export function parseKeyboardEvent(
  event: KeyboardEvent,
): Omit<ShortcutBinding, "action"> | null {
  if (modifierKeys.has(event.key)) {
    return null;
  }

  return {
    key: event.key.toLowerCase(),
    metaKey: event.metaKey || undefined,
    ctrlKey: event.ctrlKey || undefined,
    shiftKey: event.shiftKey || undefined,
    altKey: event.altKey || undefined,
  };
}

/* -------------------------------------------------------------------------- */
/*  Matching                                                                  */
/* -------------------------------------------------------------------------- */

/**
 * Returns true when a keydown event matches a stored binding.
 */
export function matchesBinding(event: KeyboardEvent, binding: ShortcutBinding): boolean {
  if (event.key.toLowerCase() !== binding.key) return false;
  if (Boolean(binding.metaKey) !== event.metaKey) return false;
  if (Boolean(binding.ctrlKey) !== event.ctrlKey) return false;
  if (Boolean(binding.shiftKey) !== event.shiftKey) return false;
  if (Boolean(binding.altKey) !== event.altKey) return false;

  return true;
}

/**
 * Returns true when two key shapes (ignoring action) represent the same combo.
 */
function bindingsMatch(
  a: Omit<ShortcutBinding, "action">,
  b: Omit<ShortcutBinding, "action">,
): boolean {
  return (
    a.key === b.key &&
    Boolean(a.metaKey) === Boolean(b.metaKey) &&
    Boolean(a.ctrlKey) === Boolean(b.ctrlKey) &&
    Boolean(a.shiftKey) === Boolean(b.shiftKey) &&
    Boolean(a.altKey) === Boolean(b.altKey)
  );
}

/* -------------------------------------------------------------------------- */
/*  Conflict detection                                                        */
/* -------------------------------------------------------------------------- */

/**
 * Returns the display label of the conflicting action if the candidate key shape duplicates
 * an existing binding, or null when no conflict exists.
 *
 * `excludeAction` lets the caller skip the entry being edited so re-recording the same combo
 * for the same action does not flag itself as a conflict.
 */
export function findShortcutConflict(
  map: WorkspaceShortcutMap,
  candidate: Omit<ShortcutBinding, "action">,
  excludeAction?: ShortcutAction,
): string | null {
  for (const menu of workspaceMenus) {
    const binding = map.navigation[menu];

    if (!binding) continue;
    if (excludeAction?.type === "navigate" && excludeAction.menu === menu) continue;
    if (bindingsMatch(candidate, binding)) return readWorkspaceMenuLabel(menu);
  }

  for (const commandId of allCommands) {
    const binding = map.commands[commandId];

    if (!binding) continue;
    if (excludeAction?.type === "command" && excludeAction.commandId === commandId) continue;
    if (bindingsMatch(candidate, binding)) return readCommandLabel(commandId);
  }

  return null;
}

/* -------------------------------------------------------------------------- */
/*  Normalization (localStorage hydration)                                    */
/* -------------------------------------------------------------------------- */

/**
 * Normalizes saved shortcut data so malformed localStorage entries do not break the app.
 */
export function normalizeShortcutMap(value: unknown): WorkspaceShortcutMap {
  const defaults = createDefaultShortcutMap();

  if (!isRecord(value)) return defaults;

  const navigation = {} as Record<WorkspaceMenu, ShortcutBinding | null>;

  for (const menu of workspaceMenus) {
    const savedNav = isRecord(value.navigation) ? value.navigation[menu] : undefined;
    navigation[menu] = normalizeBinding(savedNav, { type: "navigate", menu });
  }

  const commands = {} as Record<WorkspaceCommandId, ShortcutBinding | null>;

  for (const commandId of allCommands) {
    const savedCmd = isRecord(value.commands) ? value.commands[commandId] : undefined;
    commands[commandId] =
      normalizeBinding(savedCmd, { type: "command", commandId }) ??
      defaults.commands[commandId];
  }

  return { navigation, commands };
}

function normalizeBinding(
  value: unknown,
  action: ShortcutAction,
): ShortcutBinding | null {
  if (value === null || value === undefined) return null;
  if (!isRecord(value)) return null;

  const key = typeof value.key === "string" ? value.key.trim().toLowerCase() : "";

  if (!key) return null;

  return {
    action,
    key,
    metaKey: value.metaKey === true || undefined,
    ctrlKey: value.ctrlKey === true || undefined,
    shiftKey: value.shiftKey === true || undefined,
    altKey: value.altKey === true || undefined,
  };
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === "object";
}

/* -------------------------------------------------------------------------- */
/*  Shortcut status summary                                                   */
/* -------------------------------------------------------------------------- */

/**
 * Builds the status text shown on the configuration disclosure header.
 */
export function readShortcutMapSummary(map: WorkspaceShortcutMap): string {
  const commandCount = allCommands.filter((id) => map.commands[id] !== null).length;
  const navCount = workspaceMenus.filter((menu) => map.navigation[menu] !== null).length;

  const parts: string[] = [];

  if (commandCount > 0) {
    parts.push(`${commandCount} ${commandCount === 1 ? "command" : "commands"}`);
  }

  if (navCount > 0) {
    parts.push(
      `${navCount} ${navCount === 1 ? "navigation shortcut" : "navigation shortcuts"}`,
    );
  }

  return parts.length > 0 ? parts.join(", ") : "No shortcuts configured";
}
