import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it, vi } from "vitest";

import { buildGlobalSearchResults, GlobalSearchDialog } from "@/features/workspace/search";
import { workspaceSeed } from "./mock-data";

describe("global search dialog", () => {
  /**
   * Ensures the dialog shows mixed result labels and parent context so similarly named items
   * remain understandable in the MVP.
   */
  it("renders labeled mixed results with contextual metadata", () => {
    const markup = renderToStaticMarkup(
      <GlobalSearchDialog
        activeIndex={0}
        isOpen
        onActiveIndexChange={vi.fn()}
        onClose={vi.fn()}
        onQueryChange={vi.fn()}
        onSelectResult={vi.fn()}
        query=""
        results={buildGlobalSearchResults(workspaceSeed)}
      />,
    );

    expect(markup).toContain("Task");
    expect(markup).toContain("Project");
    expect(markup).toContain("Initiative");
    expect(markup).toContain("Project: Relay MVP");
    expect(markup).toContain("Q2 Product Launch");
    expect(markup).toContain('data-slot="command"');
    expect(markup).toContain('data-slot="command-input"');
    expect(markup).toContain('data-slot="command-item"');
    expect(markup).toContain('data-slot="dialog-content"');
    expect(markup).toContain('data-slot="dialog-title"');
    expect(markup).toContain('data-slot="command-separator"');
  });

  /**
   * Keeps the empty state explicit when the current query has no matches.
   */
  it("renders a helpful empty state when there are no matches", () => {
    const markup = renderToStaticMarkup(
      <GlobalSearchDialog
        activeIndex={0}
        isOpen
        onActiveIndexChange={vi.fn()}
        onClose={vi.fn()}
        onQueryChange={vi.fn()}
        onSelectResult={vi.fn()}
        query="missing result"
        results={[]}
      />,
    );

    expect(markup).toContain("No matches for");
    expect(markup).toContain("missing result");
    expect(markup).toContain('data-slot="command-empty"');
  });
});
