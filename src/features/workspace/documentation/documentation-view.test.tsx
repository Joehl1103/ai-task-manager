import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";

import { DocumentationView } from "./documentation-view";

describe("documentation view", () => {
  /**
   * Keeps the in-app wiki grounded in the real merged API surface so users can discover endpoints
   * without leaving the product.
   */
  it("renders the API wiki with merged route coverage", () => {
    const markup = renderToStaticMarkup(<DocumentationView />);

    expect(markup).toContain(">Documentation<");
    expect(markup).toContain(">API<");
    expect(markup).toContain("Wiki sections");
    expect(markup).toContain("/api/tasks");
    expect(markup).toContain("/api/tasks/:id");
    expect(markup).toContain("/api/tasks/bulk");
    expect(markup).toContain("/api/workspace");
    expect(markup).toContain("/api/models");
    expect(markup).toContain("/api/agent-call");
    expect(markup).toContain("Project-wide API reference");
    expect(markup).toContain("Query parameters");
    expect(markup).toContain("Examples");
  });
});
