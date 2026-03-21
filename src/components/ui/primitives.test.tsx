import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";

import { Badge } from "./badge";
import { Button } from "./button";
import { Input } from "./input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "./select";
import { Textarea } from "./textarea";

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
});
