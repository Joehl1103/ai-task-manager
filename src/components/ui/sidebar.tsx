import * as React from "react";

import { cn } from "@/lib/utils";

interface SidebarProps extends React.ComponentPropsWithoutRef<"aside"> {
  collapsed?: boolean;
}

const Sidebar = React.forwardRef<HTMLElement, SidebarProps>(function Sidebar(
  { className, collapsed = false, ...props },
  ref,
) {
  return (
    <aside
      className={cn("flex h-full flex-col", className)}
      data-collapsed={collapsed ? "true" : "false"}
      data-slot="sidebar"
      ref={ref}
      {...props}
    />
  );
});

const SidebarHeader = React.forwardRef<
  HTMLDivElement,
  React.ComponentPropsWithoutRef<"div">
>(function SidebarHeader({ className, ...props }, ref) {
  return (
    <div
      className={cn("flex items-center gap-2", className)}
      data-slot="sidebar-header"
      ref={ref}
      {...props}
    />
  );
});

const SidebarContent = React.forwardRef<
  HTMLDivElement,
  React.ComponentPropsWithoutRef<"div">
>(function SidebarContent({ className, ...props }, ref) {
  return (
    <div
      className={cn("flex flex-1 flex-col", className)}
      data-slot="sidebar-content"
      ref={ref}
      {...props}
    />
  );
});

const SidebarFooter = React.forwardRef<
  HTMLDivElement,
  React.ComponentPropsWithoutRef<"div">
>(function SidebarFooter({ className, ...props }, ref) {
  return (
    <div
      className={cn("mt-auto", className)}
      data-slot="sidebar-footer"
      ref={ref}
      {...props}
    />
  );
});

const SidebarGroup = React.forwardRef<
  HTMLDivElement,
  React.ComponentPropsWithoutRef<"section">
>(function SidebarGroup({ className, ...props }, ref) {
  return (
    <section
      className={cn("space-y-1", className)}
      data-slot="sidebar-group"
      ref={ref}
      {...props}
    />
  );
});

const SidebarGroupLabel = React.forwardRef<
  HTMLParagraphElement,
  React.ComponentPropsWithoutRef<"p">
>(function SidebarGroupLabel({ className, ...props }, ref) {
  return (
    <p
      className={cn(
        "px-2 text-xs font-medium uppercase tracking-[0.22em] text-[color:var(--muted)]",
        className,
      )}
      data-slot="sidebar-group-label"
      ref={ref}
      {...props}
    />
  );
});

const SidebarGroupContent = React.forwardRef<
  HTMLDivElement,
  React.ComponentPropsWithoutRef<"div">
>(function SidebarGroupContent({ className, ...props }, ref) {
  return (
    <div
      className={cn(className)}
      data-slot="sidebar-group-content"
      ref={ref}
      {...props}
    />
  );
});

const SidebarMenu = React.forwardRef<
  HTMLUListElement,
  React.ComponentPropsWithoutRef<"ul">
>(function SidebarMenu({ className, ...props }, ref) {
  return (
    <ul
      className={cn("space-y-1", className)}
      data-slot="sidebar-menu"
      ref={ref}
      {...props}
    />
  );
});

const SidebarMenuItem = React.forwardRef<
  HTMLLIElement,
  React.ComponentPropsWithoutRef<"li">
>(function SidebarMenuItem({ className, ...props }, ref) {
  return (
    <li
      className={cn(className)}
      data-slot="sidebar-menu-item"
      ref={ref}
      {...props}
    />
  );
});

interface SidebarMenuButtonProps extends React.ComponentPropsWithoutRef<"button"> {
  isActive?: boolean;
}

const SidebarMenuButton = React.forwardRef<
  HTMLButtonElement,
  SidebarMenuButtonProps
>(function SidebarMenuButton({ className, isActive = false, type = "button", ...props }, ref) {
  return (
    <button
      className={cn(
        "flex w-full items-center gap-3 rounded-lg px-2.5 py-2 text-left transition-colors outline-none",
        "focus-visible:ring-2 focus-visible:ring-[color:var(--focus-ring)]",
        isActive
          ? "bg-[color:var(--row-active)] text-[color:var(--foreground)]"
          : "text-[color:var(--muted-strong)] hover:bg-[color:var(--row-hover)] hover:text-[color:var(--foreground)]",
        className,
      )}
      data-active={isActive ? "true" : "false"}
      data-slot="sidebar-menu-button"
      ref={ref}
      type={type}
      {...props}
    />
  );
});

const SidebarRail = React.forwardRef<
  HTMLElement,
  React.ComponentPropsWithoutRef<"aside">
>(function SidebarRail({ className, ...props }, ref) {
  return (
    <aside
      className={cn("flex h-full w-8 shrink-0 border-r border-[color:var(--row-divider)]", className)}
      data-slot="sidebar-rail"
      ref={ref}
      {...props}
    />
  );
});

export {
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
  SidebarRail,
};
