import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";

import {
  Command,
  CommandEmpty,
  CommandInput,
  CommandItem,
  CommandList,
} from "./command";
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarRail,
} from "./sidebar";

describe("workspace shell primitives", () => {
  /**
   * Confirms the shared shell primitives expose stable slots without needing bespoke workspace-only
   * test coverage for the underlying composition layer.
   */
  it("renders command and sidebar primitives with named slots", () => {
    const markup = renderToStaticMarkup(
      <>
        <Command>
          <CommandInput placeholder="Search" />
          <CommandList>
            <CommandItem selected>Inbox</CommandItem>
            <CommandEmpty>No results</CommandEmpty>
          </CommandList>
        </Command>

        <Sidebar aria-label="Workspace sidebar">
          <SidebarContent>
            <SidebarGroup>
              <SidebarGroupLabel>Views</SidebarGroupLabel>
              <SidebarGroupContent>
                <SidebarMenu>
                  <SidebarMenuItem>
                    <SidebarMenuButton isActive>Inbox</SidebarMenuButton>
                  </SidebarMenuItem>
                </SidebarMenu>
              </SidebarGroupContent>
            </SidebarGroup>
          </SidebarContent>
        </Sidebar>

        <SidebarRail aria-label="Collapsed workspace sidebar" />
      </>,
    );

    expect(markup).toContain('data-slot="command"');
    expect(markup).toContain('data-slot="command-input"');
    expect(markup).toContain('data-slot="command-item"');
    expect(markup).toContain('data-slot="command-empty"');
    expect(markup).toContain('data-slot="sidebar"');
    expect(markup).toContain('data-slot="sidebar-content"');
    expect(markup).toContain('data-slot="sidebar-group-label"');
    expect(markup).toContain('data-slot="sidebar-menu-button"');
    expect(markup).toContain('data-slot="sidebar-rail"');
  });
});
