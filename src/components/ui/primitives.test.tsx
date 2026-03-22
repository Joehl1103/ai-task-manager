import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";

import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "./accordion";
import { Badge } from "./badge";
import { Button } from "./button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "./card";
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
   * Confirms the shared primitives expose the shadcn slots while using the stock semantic utility
   * classes instead of the older Relay-specific surface tokens.
   */
  it("renders button, input, textarea, and badge with stock shadcn utility contracts", () => {
    const markup = renderToStaticMarkup(
      <>
        <Button size="icon" variant="secondary">
          Open
        </Button>
        <Input defaultValue="hello" />
        <Textarea defaultValue="notes" />
        <Badge variant="outline">Active</Badge>
      </>,
    );

    expect(markup).toContain('data-slot="button"');
    expect(markup).toContain('data-slot="input"');
    expect(markup).toContain('data-slot="textarea"');
    expect(markup).toContain('data-slot="badge"');
    expect(markup).toContain("bg-secondary");
    expect(markup).toContain("border-input");
    expect(markup).toContain("placeholder:text-muted-foreground");
    expect(markup).toContain("text-foreground");
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
   * Confirms the additive primitives now expose stock shadcn surface classes instead of the older
   * custom popover and overlay styling contract.
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
    expect(markup).toContain("bg-background");
    expect(markup).toContain("bg-popover");
    expect(markup).toContain("bg-primary");
    expect(markup).toContain("bg-border");
  });

  /**
   * Confirms the configuration-specific stock shadcn surfaces stay available in the shared layer
   * instead of being rebuilt ad hoc inside workspace views.
   */
  it("renders accordion and card with named slots", () => {
    const markup = renderToStaticMarkup(
      <Accordion collapsible defaultValue="theme" type="single">
        <AccordionItem value="theme">
          <AccordionTrigger>Workspace theme</AccordionTrigger>
          <AccordionContent forceMount>
            <Card>
              <CardHeader>
                <CardTitle>Relay Original</CardTitle>
                <CardDescription>Neutral starter palette.</CardDescription>
              </CardHeader>
              <CardContent>Day and night choices</CardContent>
            </Card>
          </AccordionContent>
        </AccordionItem>
      </Accordion>,
    );

    expect(markup).toContain('data-slot="accordion"');
    expect(markup).toContain('data-slot="accordion-item"');
    expect(markup).toContain('data-slot="accordion-trigger"');
    expect(markup).toContain('data-slot="accordion-content"');
    expect(markup).toContain('data-slot="card"');
    expect(markup).toContain('data-slot="card-header"');
    expect(markup).toContain('data-slot="card-title"');
    expect(markup).toContain('data-slot="card-description"');
    expect(markup).toContain('data-slot="card-content"');
  });
});
