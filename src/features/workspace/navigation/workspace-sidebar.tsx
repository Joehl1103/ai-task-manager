"use client";

import { type ReactNode } from "react";
import {
  ChevronDown,
  ChevronRight,
  FolderKanban,
  Inbox,
  PanelLeftClose,
  Settings2,
  Sparkles,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { featureFlags } from "@/features/feature-flags";
import { type Initiative, type Project } from "@/features/workspace/core";
import { filterVisibleProjects } from "@/features/workspace/projects";
import { cn } from "@/lib/utils";

import {
  type WorkspaceMenu,
  readWorkspaceMenuHint,
  readWorkspaceMenuLabel,
} from "./workspace-navigation";

interface WorkspaceSidebarProps {
  activeMenu: WorkspaceMenu;
  initiatives: Initiative[];
  isInitiativesExpanded: boolean;
  isProjectsExpanded: boolean;
  onSelectInitiative: (initiativeId: string) => void;
  onSelectMenu: (menu: WorkspaceMenu) => void;
  onSelectProject: (projectId: string) => void;
  onToggleInitiatives: () => void;
  onToggleProjects: () => void;
  onToggleSidebar: () => void;
  projects: Project[];
  selectedInitiativeId: string | null;
  selectedProjectId: string | null;
}

/**
 * Renders the left navigation shell as a thin list-first layer instead of a framed panel.
 */
export function WorkspaceSidebar({
  activeMenu,
  initiatives,
  isInitiativesExpanded,
  isProjectsExpanded,
  onSelectInitiative,
  onSelectMenu,
  onSelectProject,
  onToggleInitiatives,
  onToggleProjects,
  onToggleSidebar,
  projects,
  selectedInitiativeId,
  selectedProjectId,
}: WorkspaceSidebarProps) {
  const visibleProjects = filterVisibleProjects(projects);
  const projectsToggleLabel = `${isProjectsExpanded ? "Collapse" : "Expand"} projects`;
  const initiativesToggleLabel = `${isInitiativesExpanded ? "Collapse" : "Expand"} initiatives`;

  return (
    <TooltipProvider>
      <aside
        aria-label="Workspace sidebar"
        className="workspace-sidebar-shell flex h-full flex-col border-r border-[color:var(--row-divider)] pr-5"
      >
        <div className="flex justify-end pb-4">
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                aria-label="Hide sidebar"
                className="mt-[-0.25rem] shrink-0"
                onClick={onToggleSidebar}
                size="icon"
                variant="ghost"
              >
                <PanelLeftClose className="size-4" />
              </Button>
            </TooltipTrigger>
            <TooltipContent side="right">Hide sidebar</TooltipContent>
          </Tooltip>
        </div>

        <nav aria-label="Workspace destinations" className="flex flex-1 flex-col gap-6">
          <section className="space-y-1">
            <p className="px-2 text-xs font-medium uppercase tracking-[0.22em] text-[color:var(--muted)]">
              Views
            </p>
            <SidebarMenuButton
              active={activeMenu === "inbox"}
              hint={readWorkspaceMenuHint("inbox")}
              icon={<Inbox className="size-4" />}
              label={readWorkspaceMenuLabel("inbox")}
              onClick={() => onSelectMenu("inbox")}
            />
          </section>

          <SidebarSection
            active={activeMenu === "projects" && selectedProjectId === null}
            icon={<FolderKanban className="size-4" />}
            isExpanded={isProjectsExpanded}
            itemCount={visibleProjects.length}
            onSelect={() => onSelectMenu("projects")}
            onToggle={onToggleProjects}
            title="Projects"
            toggleLabel={projectsToggleLabel}
          >
            {visibleProjects.map((project) => (
              <SidebarChildButton
                active={selectedProjectId === project.id}
                key={project.id}
                label={project.name}
                onClick={() => onSelectProject(project.id)}
              />
            ))}
          </SidebarSection>

          {featureFlags.initiatives ? (
            <SidebarSection
              active={activeMenu === "initiatives" && selectedInitiativeId === null}
              icon={<Sparkles className="size-4" />}
              isExpanded={isInitiativesExpanded}
              itemCount={initiatives.length}
              onSelect={() => onSelectMenu("initiatives")}
              onToggle={onToggleInitiatives}
              title="Initiatives"
              toggleLabel={initiativesToggleLabel}
            >
              {initiatives.map((initiative) => (
                <SidebarChildButton
                  active={selectedInitiativeId === initiative.id}
                  key={initiative.id}
                  label={initiative.name}
                  onClick={() => onSelectInitiative(initiative.id)}
                />
              ))}
            </SidebarSection>
          ) : null}

          <div className="mt-auto pt-4">
            <Separator className="mb-4" />
            <SidebarMenuButton
              active={activeMenu === "configuration"}
              hint={readWorkspaceMenuHint("configuration")}
              icon={<Settings2 className="size-4" />}
              label={readWorkspaceMenuLabel("configuration")}
              onClick={() => onSelectMenu("configuration")}
            />
          </div>
        </nav>
      </aside>
    </TooltipProvider>
  );
}

interface SidebarMenuButtonProps {
  active: boolean;
  hint: string;
  icon: ReactNode;
  label: string;
  onClick: () => void;
}

function SidebarMenuButton({
  active,
  hint,
  icon,
  label,
  onClick,
}: SidebarMenuButtonProps) {
  return (
    <button
      aria-current={active ? "page" : undefined}
      className={cn(
        "flex w-full items-start gap-3 rounded-md px-2 py-2 text-left transition-colors",
        active
          ? "bg-[color:var(--row-active)] text-[color:var(--foreground)]"
          : "text-[color:var(--muted-strong)] hover:bg-[color:var(--row-hover)] hover:text-[color:var(--foreground)]",
      )}
      onClick={onClick}
      type="button"
    >
      <span
        className={cn(
          "mt-0.5 shrink-0 text-[color:var(--muted)]",
          active && "text-[color:var(--foreground)]",
        )}
      >
        {icon}
      </span>
      <span className="min-w-0">
        <span className="block text-sm font-medium">{label}</span>
        <span className="mt-1 block text-xs text-[color:var(--muted)]">{hint}</span>
      </span>
    </button>
  );
}

interface SidebarSectionProps {
  active: boolean;
  children: ReactNode;
  icon: ReactNode;
  isExpanded: boolean;
  itemCount: number;
  onSelect: () => void;
  onToggle: () => void;
  title: string;
  toggleLabel: string;
}

function SidebarSection({
  active,
  children,
  icon,
  isExpanded,
  itemCount,
  onSelect,
  onToggle,
  title,
  toggleLabel,
}: SidebarSectionProps) {
  return (
    <section className="space-y-2">
      <div className="flex items-start gap-2">
        <button
          aria-current={active ? "page" : undefined}
          className={cn(
            "flex min-w-0 flex-1 items-start gap-3 rounded-md px-2 py-2 text-left transition-colors",
            active
              ? "bg-[color:var(--row-active)] text-[color:var(--foreground)]"
              : "text-[color:var(--muted-strong)] hover:bg-[color:var(--row-hover)] hover:text-[color:var(--foreground)]",
          )}
          onClick={onSelect}
          type="button"
        >
          <span
            className={cn(
              "mt-0.5 shrink-0 text-[color:var(--muted)]",
              active && "text-[color:var(--foreground)]",
            )}
          >
            {icon}
          </span>
          <span className="min-w-0">
            <span className="block text-sm font-medium">{title}</span>
            <span className="mt-1 block text-xs text-[color:var(--muted)]">
              {itemCount} {itemCount === 1 ? title.slice(0, -1).toLowerCase() : title.toLowerCase()}
            </span>
          </span>
        </button>
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              aria-expanded={isExpanded}
              aria-label={toggleLabel}
              className="mt-0.5 shrink-0"
              onClick={onToggle}
              size="icon"
              variant="ghost"
            >
              {isExpanded ? (
                <ChevronDown className="size-4" />
              ) : (
                <ChevronRight className="size-4" />
              )}
            </Button>
          </TooltipTrigger>
          <TooltipContent side="right">{toggleLabel}</TooltipContent>
        </Tooltip>
      </div>

      {isExpanded ? (
        <div className="ml-4 border-l border-[color:var(--row-divider)] pl-4">
          <div className="space-y-0.5">{children}</div>
        </div>
      ) : null}
    </section>
  );
}

interface SidebarChildButtonProps {
  active: boolean;
  label: string;
  onClick: () => void;
}

function SidebarChildButton({ active, label, onClick }: SidebarChildButtonProps) {
  return (
    <button
      aria-current={active ? "page" : undefined}
      className={cn(
        "flex w-full items-center rounded-md px-2 py-2 text-left transition-colors",
        active
          ? "bg-[color:var(--row-active)] text-[color:var(--foreground)]"
          : "text-[color:var(--muted-strong)] hover:bg-[color:var(--row-hover)] hover:text-[color:var(--foreground)]",
      )}
      onClick={onClick}
      type="button"
    >
      <span className="truncate text-xs font-medium">{label}</span>
    </button>
  );
}
