"use client";

import { cn } from "@/lib/utils";

import {
  readWorkspaceThemeFlag,
  readWorkspaceThemeLabel,
  type WorkspaceThemeMode,
  type WorkspaceThemePalette,
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
    <section
      aria-label="Theme options"
      className={cn(
        "workspace-theme-panel rounded-[28px] border border-[color:var(--border)] px-4 py-4 sm:px-5 sm:py-5",
        !showHeader && "border-none bg-transparent px-0 py-0 shadow-none backdrop-blur-none",
      )}
    >
      {showHeader ? (
        <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div className="max-w-3xl">
            <p className="text-[11px] font-medium uppercase tracking-[0.22em] text-[color:var(--muted)]">
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

          <div className="rounded-2xl border border-[color:var(--border)] bg-[color:var(--surface-strong)] px-4 py-3 shadow-[0_16px_40px_-28px_var(--shadow-color)]">
            <p className="text-[11px] font-medium uppercase tracking-[0.18em] text-[color:var(--muted)]">
              Current Theme
            </p>
            <p className="mt-2 text-sm font-medium text-[color:var(--foreground)]">
              {readWorkspaceThemeLabel(selection)}
            </p>
            <p className="mt-1 text-xs text-[color:var(--muted)]">{activeThemeFlag.summary}</p>
          </div>
        </div>
      ) : null}

      <div className={cn("grid gap-3 xl:grid-cols-3 md:grid-cols-2", showHeader && "mt-5")}>
        {workspaceThemeFlags.map((themeFlag, index) => {
          const isActiveTheme = selection.themeId === themeFlag.id;

          return (
            <article
              className={cn(
                "rounded-[24px] border px-4 py-4 transition-all duration-200",
                isActiveTheme
                  ? "border-[color:var(--border-strong)] bg-[color:var(--surface)] shadow-[0_24px_50px_-32px_var(--shadow-color)]"
                  : "border-[color:var(--border)] bg-[color:var(--surface-strong)]",
              )}
              key={themeFlag.id}
            >
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="text-[11px] font-medium uppercase tracking-[0.18em] text-[color:var(--muted)]">
                    Option {String(index + 1).padStart(2, "0")}
                  </p>
                  <h3 className="mt-2 text-sm font-semibold text-[color:var(--foreground)]">
                    {themeFlag.name}
                  </h3>
                </div>

                {isActiveTheme ? (
                  <span className="rounded-full bg-[color:var(--surface-muted)] px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.18em] text-[color:var(--muted-strong)]">
                    Active
                  </span>
                ) : null}
              </div>

              <p className="mt-3 min-h-[4.5rem] text-sm leading-6 text-[color:var(--muted)]">
                {themeFlag.summary}
              </p>

              <div className="mt-4 grid grid-cols-2 gap-2">
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

              <div className="mt-4 grid grid-cols-2 gap-2">
                <ThemePalettePreview label="Day" palette={themeFlag.day} />
                <ThemePalettePreview label="Night" palette={themeFlag.night} />
              </div>
            </article>
          );
        })}
      </div>
    </section>
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
    <button
      aria-label={`${readWorkspaceThemeFlag(themeId).name} ${label.toLowerCase()} theme`}
      aria-pressed={isActive}
      className={cn(
        "cursor-pointer rounded-2xl border px-3 py-2 text-sm font-medium transition-all duration-150",
        isActive
          ? "border-[color:var(--border-strong)] bg-[color:var(--accent)] text-[color:var(--accent-foreground)] shadow-[0_16px_32px_-22px_var(--shadow-color)]"
          : "border-[color:var(--border)] bg-[color:var(--surface-muted)] text-[color:var(--foreground)] hover:border-[color:var(--border-strong)] hover:bg-[color:var(--surface)]",
      )}
      onClick={() =>
        onSelectTheme({
          themeId,
          mode,
        })
      }
      type="button"
    >
      {label}
    </button>
  );
}

interface ThemePalettePreviewProps {
  label: string;
  palette: WorkspaceThemePalette;
}

/**
 * Shows a compact visual swatch so unselected theme options can still be compared at a glance.
 */
function ThemePalettePreview({ label, palette }: ThemePalettePreviewProps) {
  return (
    <div
      className="rounded-[18px] border p-2"
      style={{
        background: palette.surface,
        borderColor: palette.border,
        boxShadow: `0 10px 26px -24px ${palette.shadowColor}`,
      }}
    >
      <div className="flex items-center justify-between gap-2">
        <span
          className="text-[10px] font-semibold uppercase tracking-[0.16em]"
          style={{ color: palette.muted }}
        >
          {label}
        </span>
        <span
          className="text-[10px] font-medium uppercase tracking-[0.12em]"
          style={{ color: palette.mutedStrong }}
        >
          {label === "Day" ? "Sun" : "Moon"}
        </span>
      </div>

      <div className="mt-2 grid grid-cols-[1.2fr_1fr] gap-2">
        <div
          className="h-9 rounded-xl"
          style={{
            background: `linear-gradient(135deg, ${palette.accent}, ${palette.surfaceMuted})`,
          }}
        />

        <div className="space-y-1">
          <div className="h-4 rounded-lg" style={{ background: palette.background }} />
          <div
            className="h-4 rounded-lg border"
            style={{
              background: palette.surfaceStrong,
              borderColor: palette.border,
            }}
          />
        </div>
      </div>
    </div>
  );
}
