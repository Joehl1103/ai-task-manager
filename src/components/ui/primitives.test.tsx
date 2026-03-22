import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";

import { Badge } from "./badge";
import { Button } from "./button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogTitle,
} from "./dialog";
import { Input } from "./input";
import { Label } from "./label";
import { Popover, PopoverContent, PopoverTrigger } from "./popover";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "./dropdown-menu";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "./select";
import { Separator } from "./separator";
import { Textarea } from "./textarea";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "./tooltip";

describe("workspace ui primitives", () => {
  /**
   * Confirms the shared primitives expose the shadcn-style data slots so later overrides can stay
   * localized to the component layer instead of leaking through view files.
   */
  it("renders button, input, textarea, and badge with named slots", () => {
    const markup = renderToStaticMarkup(
      <>
        <Button size="icon" variant="outline">
          Open
        </Button>
        <Input defaultValue="hello" />
        <Textarea defaultValue="notes" />
        <Badge variant="secondary">Active</Badge>
      </>,
    );

    expect(markup).toContain('data-slot="button"');
    expect(markup).toContain('data-slot="input"');
    expect(markup).toContain('data-slot="textarea"');
    expect(markup).toContain('data-slot="badge"');
    expect(markup).toContain("Active");
  });

  /**
   * Ensures the Select primitive has moved to the Radix compound API rather than the old native
   * select wrapper.
   */
  it("renders the select trigger as a combobox", () => {
    const markup = renderToStaticMarkup(
      <Select defaultValue="gpt-5">
        <SelectTrigger aria-label="Model">
          <SelectValue placeholder="Choose a model" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="gpt-5">gpt-5</SelectItem>
          <SelectItem value="gpt-5-mini">gpt-5-mini</SelectItem>
        </SelectContent>
      </Select>,
    );

    expect(markup).toContain('data-slot="select-trigger"');
    expect(markup).toContain('role="combobox"');
    expect(markup).toContain('aria-expanded="false"');
    expect(markup).not.toContain("<option");
  });

  /**
   * Confirms the additive overlay and form primitives expose stable slots so their no-chrome
   * overrides stay encapsulated in the shared component layer.
   */
  it("renders dialog, dropdown menu, tooltip, popover, label, and separator with named slots", () => {
    const markup = renderToStaticMarkup(
      <TooltipProvider>
        <Dialog open>
          <DialogContent>
            <DialogTitle>Global search</DialogTitle>
            <DialogDescription>Search tasks, projects, and initiatives.</DialogDescription>
          </DialogContent>
        </Dialog>

        <DropdownMenu open>
          <DropdownMenuTrigger>Actions</DropdownMenuTrigger>
          <DropdownMenuContent>
            <DropdownMenuItem>Open task</DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>

        <Tooltip defaultOpen>
          <TooltipTrigger>Hover me</TooltipTrigger>
          <TooltipContent>Helpful context</TooltipContent>
        </Tooltip>

        <Popover open>
          <PopoverTrigger>Tags</PopoverTrigger>
          <PopoverContent forceMount>Choose tags</PopoverContent>
        </Popover>

        <Label htmlFor="api-key">API key</Label>
        <Input id="api-key" />
        <Separator />
      </TooltipProvider>,
    );

    expect(markup).toContain('data-slot="dialog-content"');
    expect(markup).toContain('data-slot="dialog-title"');
    expect(markup).toContain('data-slot="dialog-description"');
    expect(markup).toContain('data-slot="dropdown-menu-trigger"');
    expect(markup).toContain('data-slot="dropdown-menu-content"');
    expect(markup).toContain('data-slot="dropdown-menu-item"');
    expect(markup).toContain('data-slot="tooltip-trigger"');
    expect(markup).toContain('data-slot="tooltip-content"');
    expect(markup).toContain('data-slot="popover-trigger"');
    expect(markup).toContain('data-slot="label"');
    expect(markup).toContain('data-slot="separator"');
  });
});
