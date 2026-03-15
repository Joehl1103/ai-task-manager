import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";

import { FormattedAgentResponse } from "./formatted-agent-response";

describe("formatted agent response", () => {
  /**
   * Verifies markdown headings, bullet lists, and inline formatting render as structured HTML.
   */
  it("renders basic markdown blocks and inline styles", () => {
    const html = renderToStaticMarkup(
      <FormattedAgentResponse
        content={[
          "## Immediate next steps",
          "",
          "- Open Yelp",
          "- Sort by rating",
          "",
          "Use **recent reviews** and `photos` for the final pick.",
        ].join("\n")}
      />,
    );

    expect(html).toContain("<h2");
    expect(html).toContain("Immediate next steps");
    expect(html).toContain("<ul");
    expect(html).toContain("<li");
    expect(html).toContain("<strong>recent reviews</strong>");
    expect(html).toContain("<code");
    expect(html).toContain("photos");
  });

  /**
   * Confirms plain HTML snippets render through the same formatter without exposing script tags.
   */
  it("renders a safe subset of HTML blocks and strips script tags", () => {
    const html = renderToStaticMarkup(
      <FormattedAgentResponse
        content={[
          "<p>Short <strong>formatted</strong> answer.</p>",
          "<ul><li>Pho</li><li>Banh mi</li></ul>",
          "<script>alert('x')</script>",
        ].join("")}
      />,
    );

    expect(html).toContain("<p");
    expect(html).toContain("<strong>formatted</strong>");
    expect(html).toContain("<ul");
    expect(html).toContain("<li>Pho</li>");
    expect(html).not.toContain("script");
    expect(html).not.toContain("alert(&#x27;x&#x27;)");
  });

  /**
   * Keeps raw code responses readable instead of flattening them into a single paragraph.
   */
  it("renders fenced and html code blocks as preformatted content", () => {
    const markdownHtml = renderToStaticMarkup(
      <FormattedAgentResponse content={"```txt\nline 1\nline 2\n```"} />,
    );
    const htmlBlock = renderToStaticMarkup(
      <FormattedAgentResponse content={"<pre><code>line 3\nline 4</code></pre>"} />,
    );

    expect(markdownHtml).toContain("<pre");
    expect(markdownHtml).toContain("line 1");
    expect(markdownHtml).toContain("line 2");
    expect(htmlBlock).toContain("<pre");
    expect(htmlBlock).toContain("line 3");
    expect(htmlBlock).toContain("line 4");
  });

  /**
   * Prevents unsafe markdown and HTML links from shipping executable protocols into the page.
   */
  it("drops unsafe links while keeping safe links clickable", () => {
    const html = renderToStaticMarkup(
      <FormattedAgentResponse
        content={[
          "[Safe](https://example.com)",
          "",
          '<a href="javascript:alert(1)">Unsafe</a>',
        ].join("\n")}
      />,
    );

    expect(html).toContain('href="https://example.com"');
    expect(html).toContain(">Safe<");
    expect(html).toContain(">Unsafe<");
    expect(html).not.toContain("javascript:alert(1)");
  });
});
