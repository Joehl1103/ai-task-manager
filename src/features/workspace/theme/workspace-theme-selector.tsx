"use client";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { cn } from "@/lib/utils";

import {
  readWorkspaceThemeFlag,
  readWorkspaceThemeLabel,
  type WorkspaceThemeMode,
  type WorkspaceThemeSelection,
  workspaceThemeFlags,
} from "./workspace-theme";

interface WorkspaceThemeSelectorProps {
  showHeader?: boolean;
  selection: WorkspaceThemeSelection;
  onSelectTheme: (selection: WorkspaceThemeSelection) => void;
}

/**
 * Renders day and night theme options so each workspace palette can be previewed from Configuration.
 */
export function WorkspaceThemeSelector({
  showHeader = true,
  selection,
  onSelectTheme,
}: WorkspaceThemeSelectorProps) {
  const activeThemeFlag = readWorkspaceThemeFlag(selection.themeId);

  return (
    <section aria-label="Theme options" className="space-y-4">
      {showHeader ? (
        <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_20rem] lg:items-start">
          <div className="max-w-3xl">
            <p className="text-xs font-medium uppercase tracking-[0.22em] text-[color:var(--muted)]">
              Theme Options
            </p>
            <h2 className="mt-2 text-xl font-semibold tracking-[-0.02em] text-[color:var(--foreground)]">
              Choose a workspace palette and its day or night pair
            </h2>
            <p className="mt-2 max-w-2xl text-sm leading-6 text-[color:var(--muted)]">
              Relay Original restores the starter look, while the other options explore warmer,
              greener, coastal, clay, and citrus-leaning shadcn-inspired directions.
            </p>
          </div>

          <CurrentThemeCard
            activeThemeFlag={activeThemeFlag}
            selection={selection}
          />
        </div>
      ) : null}

      <div className={cn("grid gap-3 md:grid-cols-2 xl:grid-cols-3", showHeader && "pt-1")}>
        {workspaceThemeFlags.map((themeFlag) => {
          const isActiveTheme = selection.themeId === themeFlag.id;

          return (
            <ThemeOptionCard
              isActiveTheme={isActiveTheme}
              key={themeFlag.id}
              onSelectTheme={onSelectTheme}
              selection={selection}
              themeFlag={themeFlag}
            />
          );
        })}
      </div>
    </section>
  );
}

interface CurrentThemeCardProps {
  activeThemeFlag: ReturnType<typeof readWorkspaceThemeFlag>;
  selection: WorkspaceThemeSelection;
}

/**
 * Keeps the active theme visible without depending on the larger custom showcase panel.
 */
function CurrentThemeCard({ activeThemeFlag, selection }: CurrentThemeCardProps) {
  return (
    <Card className="bg-[color:var(--surface-strong)] shadow-none">
      <CardHeader className="gap-2 p-4">
        <p className="text-xs font-medium uppercase tracking-[0.18em] text-[color:var(--muted)]">
          Current Theme
        </p>
        <CardTitle>{readWorkspaceThemeLabel(selection)}</CardTitle>
        <CardDescription>{activeThemeFlag.summary}</CardDescription>
      </CardHeader>
    </Card>
  );
}

interface ThemeOptionCardProps {
  isActiveTheme: boolean;
  onSelectTheme: (selection: WorkspaceThemeSelection) => void;
  selection: WorkspaceThemeSelection;
  themeFlag: typeof workspaceThemeFlags[number];
}

/**
 * Uses a stock card layout so each theme reads as a simple selectable option instead of a custom
 * preview block.
 */
function ThemeOptionCard({
  isActiveTheme,
  onSelectTheme,
  selection,
  themeFlag,
}: ThemeOptionCardProps) {
  return (
    <Card
      className={cn(
        "h-full bg-[color:var(--surface-strong)] shadow-none transition-colors",
        isActiveTheme && "border-[color:var(--border-strong)] bg-[color:var(--surface)]",
      )}
    >
      <CardHeader className="gap-3 p-4">
        <div className="flex items-start justify-between gap-3">
          <CardTitle className="min-w-0">{themeFlag.name}</CardTitle>

          {isActiveTheme ? <Badge variant="secondary">Active</Badge> : null}
        </div>

        <CardDescription>{themeFlag.summary}</CardDescription>
      </CardHeader>

      <CardContent className="space-y-3 px-4 pb-4 pt-0">
        <div className="flex flex-wrap gap-2">
          <ThemeModeButton
            isActive={isActiveTheme && selection.mode === "day"}
            label="Day"
            mode="day"
            onSelectTheme={onSelectTheme}
            themeId={themeFlag.id}
          />
          <ThemeModeButton
            isActive={isActiveTheme && selection.mode === "night"}
            label="Night"
            mode="night"
            onSelectTheme={onSelectTheme}
            themeId={themeFlag.id}
          />
        </div>

        <p className="text-xs leading-5 text-[color:var(--muted)]">
          {readThemeSupportText(isActiveTheme, selection.mode)}
        </p>
      </CardContent>
    </Card>
  );
}

interface ThemeModeButtonProps {
  themeId: WorkspaceThemeSelection["themeId"];
  mode: WorkspaceThemeMode;
  label: string;
  isActive: boolean;
  onSelectTheme: (selection: WorkspaceThemeSelection) => void;
}

/**
 * Exposes one explicit day-or-night toggle for a single theme option.
 */
function ThemeModeButton({
  themeId,
  mode,
  label,
  isActive,
  onSelectTheme,
}: ThemeModeButtonProps) {
  return (
    <Button
      aria-label={`${readWorkspaceThemeFlag(themeId).name} ${label.toLowerCase()} theme`}
      aria-pressed={isActive}
      className="min-w-20"
      onClick={() =>
        onSelectTheme({
          themeId,
          mode,
        })
      }
      size="sm"
      variant={isActive ? "default" : "outline"}
    >
      {label}
    </Button>
  );
}

/**
 * Keeps the helper copy short while still confirming the currently selected mode when relevant.
 */
function readThemeSupportText(isActiveTheme: boolean, mode: WorkspaceThemeMode) {
  if (isActiveTheme) {
    return `Currently using the ${mode} pair for this workspace palette.`;
  }

  return "Choose Day or Night to switch the workspace onto this palette.";
}
