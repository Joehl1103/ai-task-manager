"use client";

import { type ReactNode } from "react";
import {
  Archive,
  ChevronDown,
  ChevronRight,
  FolderKanban,
  Inbox,
  PanelLeftClose,
  Settings2,
  Sparkles,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { Collapsible, CollapsibleContent } from "@/components/ui/collapsible";
import { Separator } from "@/components/ui/separator";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar";
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
 * Rebuilds the workspace sidebar with stock shadcn-style sidebar composition while keeping the
 * existing navigation state and quiet Relay presentation.
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
      <Sidebar
        aria-label="Workspace sidebar"
        className="workspace-sidebar-shell border-r border-[color:var(--row-divider)] pr-5"
      >
        <SidebarHeader className="justify-end pb-4">
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
        </SidebarHeader>

        <SidebarContent className="gap-6">
          <SidebarGroup>
            <SidebarGroupLabel>Views</SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu>
                <SidebarMenuItem>
                  <WorkspaceSidebarMenuButton
                    active={activeMenu === "inbox"}
                    hint={readWorkspaceMenuHint("inbox")}
                    icon={<Inbox className="size-4" />}
                    label={readWorkspaceMenuLabel("inbox")}
                    onClick={() => onSelectMenu("inbox")}
                  />
                </SidebarMenuItem>
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>

          <WorkspaceSidebarSection
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
              <SidebarMenuItem key={project.id}>
                <WorkspaceSidebarChildButton
                  active={selectedProjectId === project.id}
                  label={project.name}
                  onClick={() => onSelectProject(project.id)}
                />
              </SidebarMenuItem>
            ))}
          </WorkspaceSidebarSection>

          {featureFlags.initiatives ? (
            <WorkspaceSidebarSection
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
                <SidebarMenuItem key={initiative.id}>
                  <WorkspaceSidebarChildButton
                    active={selectedInitiativeId === initiative.id}
                    label={initiative.name}
                    onClick={() => onSelectInitiative(initiative.id)}
                  />
                </SidebarMenuItem>
              ))}
            </WorkspaceSidebarSection>
          ) : null}

          <SidebarGroup>
            <SidebarGroupContent>
              <SidebarMenu>
                <SidebarMenuItem>
                  <WorkspaceSidebarMenuButton
                    active={activeMenu === "archive"}
                    hint={readWorkspaceMenuHint("archive")}
                    icon={<Archive className="size-4" />}
                    label={readWorkspaceMenuLabel("archive")}
                    onClick={() => onSelectMenu("archive")}
                  />
                </SidebarMenuItem>
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        </SidebarContent>

        <SidebarFooter className="pt-4">
          <Separator className="mb-4" />
          <SidebarMenu>
            <SidebarMenuItem>
              <WorkspaceSidebarMenuButton
                active={activeMenu === "configuration"}
                hint={readWorkspaceMenuHint("configuration")}
                icon={<Settings2 className="size-4" />}
                label={readWorkspaceMenuLabel("configuration")}
                onClick={() => onSelectMenu("configuration")}
              />
            </SidebarMenuItem>
          </SidebarMenu>
        </SidebarFooter>
      </Sidebar>
    </TooltipProvider>
  );
}

interface WorkspaceSidebarMenuButtonProps {
  active: boolean;
  hint: string;
  icon: ReactNode;
  label: string;
  onClick: () => void;
}

function WorkspaceSidebarMenuButton({
  active,
  hint,
  icon,
  label,
  onClick,
}: WorkspaceSidebarMenuButtonProps) {
  return (
    <SidebarMenuButton
      aria-current={active ? "page" : undefined}
      className="items-start"
      isActive={active}
      onClick={onClick}
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
    </SidebarMenuButton>
  );
}

interface WorkspaceSidebarSectionProps {
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

function WorkspaceSidebarSection({
  active,
  children,
  icon,
  isExpanded,
  itemCount,
  onSelect,
  onToggle,
  title,
  toggleLabel,
}: WorkspaceSidebarSectionProps) {
  return (
    <Collapsible open={isExpanded}>
      <SidebarGroup className="space-y-2">
        <div className="flex items-start gap-2">
          <SidebarMenuButton
            aria-current={active ? "page" : undefined}
            className="min-w-0 flex-1 items-start"
            isActive={active}
            onClick={onSelect}
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
          </SidebarMenuButton>

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

        <CollapsibleContent className="ml-4 border-l border-[color:var(--row-divider)] pl-4">
          <SidebarMenu className="space-y-0.5">{children}</SidebarMenu>
        </CollapsibleContent>
      </SidebarGroup>
    </Collapsible>
  );
}

interface WorkspaceSidebarChildButtonProps {
  active: boolean;
  label: string;
  onClick: () => void;
}

function WorkspaceSidebarChildButton({
  active,
  label,
  onClick,
}: WorkspaceSidebarChildButtonProps) {
  return (
    <SidebarMenuButton
      aria-current={active ? "page" : undefined}
      className="py-2"
      isActive={active}
      onClick={onClick}
    >
      <span className="truncate text-xs font-medium">{label}</span>
    </SidebarMenuButton>
  );
}
