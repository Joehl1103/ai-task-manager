import { Fragment, createElement, type ReactNode } from "react";

type InlineNode =
  | { type: "text"; value: string }
  | { type: "strong"; children: InlineNode[] }
  | { type: "emphasis"; children: InlineNode[] }
  | { type: "code"; value: string }
  | { type: "link"; href: string; children: InlineNode[] }
  | { type: "line-break" };

type BlockNode =
  | { type: "paragraph"; children: InlineNode[] }
  | { type: "heading"; level: number; children: InlineNode[] }
  | { type: "unordered-list"; items: InlineNode[][] }
  | { type: "ordered-list"; items: InlineNode[][] }
  | { type: "blockquote"; blocks: BlockNode[] }
  | { type: "code-block"; code: string };

interface FormattedAgentResponseProps {
  content: string;
  className?: string;
}

/**
 * Renders agent output with lightweight markdown and safe HTML formatting so responses stay readable.
 */
export function FormattedAgentResponse({
  content,
  className,
}: FormattedAgentResponseProps) {
  const blocks = parseRichTextBlocks(content);

  if (blocks.length === 0) {
    return null;
  }

  return (
    <div
      className={[
        "space-y-3 text-sm leading-6 text-[color:var(--muted-strong)]",
        className,
      ]
        .filter(Boolean)
        .join(" ")}
    >
      {blocks.map((block, index) => renderBlock(block, `block-${index}`))}
    </div>
  );
}

/**
 * Converts raw model output into a small render tree of paragraphs, lists, headings, quotes, and code blocks.
 */
function parseRichTextBlocks(content: string): BlockNode[] {
  const normalizedContent = normalizeRichTextInput(content);

  if (!normalizedContent) {
    return [];
  }

  const lines = normalizedContent.split("\n");
  const blocks: BlockNode[] = [];

  for (let index = 0; index < lines.length; ) {
    const line = lines[index]?.trimEnd() ?? "";

    if (!line.trim()) {
      index += 1;
      continue;
    }

    if (line.startsWith("```")) {
      const { block, nextIndex } = consumeCodeBlock(lines, index);
      blocks.push(block);
      index = nextIndex;
      continue;
    }

    const headingMatch = line.match(/^(#{1,6})\s+(.+)$/);

    if (headingMatch) {
      blocks.push({
        type: "heading",
        level: headingMatch[1].length,
        children: parseInlineContent(headingMatch[2]),
      });
      index += 1;
      continue;
    }

    if (isSectionLabelLine(lines, index)) {
      blocks.push({
        type: "heading",
        level: 4,
        children: parseInlineContent(line.trim()),
      });
      index += 1;
      continue;
    }

    if (line.startsWith(">")) {
      const quoteLines: string[] = [];

      while (index < lines.length && (lines[index]?.trim().startsWith(">") ?? false)) {
        quoteLines.push(lines[index]!.replace(/^>\s?/, ""));
        index += 1;
      }

      blocks.push({
        type: "blockquote",
        blocks: parseRichTextBlocks(quoteLines.join("\n")),
      });
      continue;
    }

    if (isListLine(line, false)) {
      const { block, nextIndex } = consumeList(lines, index, false);
      blocks.push(block);
      index = nextIndex;
      continue;
    }

    if (isListLine(line, true)) {
      const { block, nextIndex } = consumeList(lines, index, true);
      blocks.push(block);
      index = nextIndex;
      continue;
    }

    const { block, nextIndex } = consumeParagraph(lines, index);
    blocks.push(block);
    index = nextIndex;
  }

  return blocks;
}

/**
 * Normalizes a basic HTML subset into markdown-like text so the main parser can stay small and predictable.
 */
function normalizeRichTextInput(content: string): string {
  const sanitizedContent = content
    .replace(/\r\n?/g, "\n")
    .replace(/<script\b[^>]*>[\s\S]*?<\/script>/gi, "")
    .replace(/<style\b[^>]*>[\s\S]*?<\/style>/gi, "")
    .trim();

  if (!sanitizedContent) {
    return "";
  }

  const withCodeBlocks = sanitizedContent.replace(
    /<pre\b[^>]*>\s*<code\b[^>]*>([\s\S]*?)<\/code>\s*<\/pre>/gi,
    (_, code: string) => `\n\n\`\`\`\n${decodeHtmlEntities(code).trim()}\n\`\`\`\n\n`,
  );
  const withLists = replaceHtmlLists(withCodeBlocks);
  const withQuotes = withLists.replace(
    /<blockquote\b[^>]*>([\s\S]*?)<\/blockquote>/gi,
    (_, quote: string) => {
      const normalizedQuote = normalizeRichTextInput(quote);

      if (!normalizedQuote) {
        return "";
      }

      return `\n\n${normalizedQuote
        .split("\n")
        .map((line) => `> ${line}`)
        .join("\n")}\n\n`;
    },
  );
  const withHeadings = withQuotes.replace(
    /<h([1-6])\b[^>]*>([\s\S]*?)<\/h\1>/gi,
    (_, level: string, heading: string) =>
      `\n\n${"#".repeat(Number(level))} ${normalizeInlineHtml(heading)}\n\n`,
  );
  const withParagraphs = withHeadings.replace(
    /<(p|div|section|article)\b[^>]*>([\s\S]*?)<\/\1>/gi,
    (_, _tag: string, paragraph: string) => `\n\n${normalizeInlineHtml(paragraph)}\n\n`,
  );

  return withParagraphs
    .replace(/<br\s*\/?>/gi, "\n")
    .replace(/[ \t]+\n/g, "\n")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}

/**
 * Rewrites basic HTML lists into markdown-style lines while keeping inline HTML for the inline parser.
 */
function replaceHtmlLists(content: string): string {
  return content.replace(/<(ul|ol)\b[^>]*>([\s\S]*?)<\/\1>/gi, (_, tag: string, listBody: string) => {
    const itemMatches = [...listBody.matchAll(/<li\b[^>]*>([\s\S]*?)<\/li>/gi)];

    if (itemMatches.length === 0) {
      return normalizeInlineHtml(listBody);
    }

    const lines = itemMatches.map((match, index) => {
      const itemContent = normalizeInlineHtml(match[1] ?? "");
      return tag.toLowerCase() === "ol" ? `${index + 1}. ${itemContent}` : `- ${itemContent}`;
    });

    return `\n\n${lines.join("\n")}\n\n`;
  });
}

/**
 * Keeps inline HTML lightweight by preserving only text and inline tags the renderer understands.
 */
function normalizeInlineHtml(content: string): string {
  return content
    .replace(/<br\s*\/?>/gi, "\n")
    .replace(/<\/?(span|small)\b[^>]*>/gi, "")
    .trim();
}

/**
 * Collects one fenced code block and returns the next unread line index.
 */
function consumeCodeBlock(lines: string[], startIndex: number) {
  const codeLines: string[] = [];
  let index = startIndex + 1;

  while (index < lines.length && !(lines[index]?.trim().startsWith("```") ?? false)) {
    codeLines.push(lines[index] ?? "");
    index += 1;
  }

  return {
    block: {
      type: "code-block",
      code: codeLines.join("\n"),
    } satisfies BlockNode,
    nextIndex: index < lines.length ? index + 1 : index,
  };
}

/**
 * Collects one ordered or unordered list, including simple wrapped lines under each list item.
 */
function consumeList(lines: string[], startIndex: number, ordered: boolean) {
  const items: InlineNode[][] = [];
  let index = startIndex;

  while (index < lines.length && isListLine(lines[index]?.trim() ?? "", ordered)) {
    const markerPattern = ordered ? /^\d+\.\s+/ : /^[-*]\s+/;
    const itemLines = [(lines[index] ?? "").replace(markerPattern, "").trim()];
    index += 1;

    while (index < lines.length) {
      const nextLine = lines[index] ?? "";
      const trimmedNextLine = nextLine.trim();

      if (!trimmedNextLine || isListLine(trimmedNextLine, ordered) || isBlockStart(lines, index)) {
        break;
      }

      itemLines.push(trimmedNextLine);
      index += 1;
    }

    items.push(parseInlineContent(itemLines.join(" ")));
  }

  return {
    block: {
      type: ordered ? "ordered-list" : "unordered-list",
      items,
    } satisfies BlockNode,
    nextIndex: index,
  };
}

/**
 * Collects consecutive non-empty lines into one paragraph until the next structural block begins.
 */
function consumeParagraph(lines: string[], startIndex: number) {
  const paragraphLines: string[] = [];
  let index = startIndex;

  while (index < lines.length) {
    const line = lines[index] ?? "";
    const trimmedLine = line.trim();

    if (!trimmedLine || (paragraphLines.length > 0 && isBlockStart(lines, index))) {
      break;
    }

    paragraphLines.push(trimmedLine);
    index += 1;
  }

  return {
    block: {
      type: "paragraph",
      children: parseInlineContent(paragraphLines.join("\n")),
    } satisfies BlockNode,
    nextIndex: index,
  };
}

/**
 * Detects whether a line starts a list of the requested type.
 */
function isListLine(line: string, ordered: boolean) {
  return ordered ? /^\d+\.\s+/.test(line) : /^[-*]\s+/.test(line);
}

/**
 * Upgrades plain section labels into small headings when the next visible line starts a list.
 */
function isSectionLabelLine(lines: string[], index: number) {
  const currentLine = lines[index]?.trim() ?? "";
  const nextLine = lines[index + 1]?.trim() ?? "";

  if (!currentLine || !nextLine) {
    return false;
  }

  if (
    currentLine.startsWith("```") ||
    currentLine.startsWith(">") ||
    /^(#{1,6})\s+/.test(currentLine) ||
    isListLine(currentLine, false) ||
    isListLine(currentLine, true)
  ) {
    return false;
  }

  if (currentLine.length > 120 || /[.!?]$/.test(currentLine)) {
    return false;
  }

  return isListLine(nextLine, false) || isListLine(nextLine, true);
}

/**
 * Detects whether the current line should start a new block instead of extending the current paragraph.
 */
function isBlockStart(lines: string[], index: number) {
  const line = lines[index]?.trim() ?? "";

  return (
    line.startsWith("```") ||
    /^(#{1,6})\s+/.test(line) ||
    line.startsWith(">") ||
    isListLine(line, false) ||
    isListLine(line, true) ||
    isSectionLabelLine(lines, index)
  );
}

/**
 * Parses inline markdown and safe inline HTML into a small render tree.
 */
function parseInlineContent(content: string): InlineNode[] {
  const nodes: InlineNode[] = [];
  let textBuffer = "";

  /**
   * Flushes buffered plain text into the render tree while preserving line breaks.
   */
  function flushBufferedText() {
    flushTextBuffer(textBuffer, nodes);
    textBuffer = "";
  }

  for (let index = 0; index < content.length; ) {
    const htmlTag = readHtmlTag(content, index);
    const strongToken = content.startsWith("**", index) || content.startsWith("__", index);
    const emphasisToken = content[index] === "*" || content[index] === "_";

    if (htmlTag) {
      flushBufferedText();

      if (htmlTag.type === "line-break") {
        nodes.push({ type: "line-break" });
      } else if (htmlTag.type === "inline") {
        const inlineChildren = parseInlineContent(htmlTag.content);

        if (htmlTag.kind === "link") {
          const safeHref = isSafeHref(htmlTag.href) ? htmlTag.href : null;

          if (safeHref) {
            nodes.push({ type: "link", href: safeHref, children: inlineChildren });
          } else {
            nodes.push(...inlineChildren);
          }
        } else if (htmlTag.kind === "strong") {
          nodes.push({ type: "strong", children: inlineChildren });
        } else if (htmlTag.kind === "emphasis") {
          nodes.push({ type: "emphasis", children: inlineChildren });
        } else {
          nodes.push({ type: "code", value: decodeHtmlEntities(htmlTag.content) });
        }
      }

      index = htmlTag.nextIndex;
      continue;
    }

    if (strongToken) {
      const token = content.slice(index, index + 2);
      const closingIndex = content.indexOf(token, index + 2);

      if (closingIndex > index + 2) {
        flushBufferedText();
        nodes.push({
          type: "strong",
          children: parseInlineContent(content.slice(index + 2, closingIndex)),
        });
        index = closingIndex + 2;
        continue;
      }
    }

    if (emphasisToken) {
      const token = content[index]!;
      const closingIndex = content.indexOf(token, index + 1);

      if (closingIndex > index + 1) {
        flushBufferedText();
        nodes.push({
          type: "emphasis",
          children: parseInlineContent(content.slice(index + 1, closingIndex)),
        });
        index = closingIndex + 1;
        continue;
      }
    }

    if (content[index] === "`") {
      const closingIndex = content.indexOf("`", index + 1);

      if (closingIndex > index + 1) {
        flushBufferedText();
        nodes.push({
          type: "code",
          value: decodeHtmlEntities(content.slice(index + 1, closingIndex)),
        });
        index = closingIndex + 1;
        continue;
      }
    }

    if (content[index] === "[") {
      const markdownLink = readMarkdownLink(content, index);

      if (markdownLink) {
        flushBufferedText();

        if (isSafeHref(markdownLink.href)) {
          nodes.push({
            type: "link",
            href: markdownLink.href,
            children: parseInlineContent(markdownLink.label),
          });
        } else {
          nodes.push(...parseInlineContent(markdownLink.label));
        }

        index = markdownLink.nextIndex;
        continue;
      }
    }

    textBuffer += content[index];
    index += 1;
  }

  flushBufferedText();

  return nodes;
}

/**
 * Turns buffered plain text into text and line-break nodes while decoding common HTML entities.
 */
function flushTextBuffer(buffer: string, nodes: InlineNode[]) {
  if (!buffer) {
    return;
  }

  const parts = buffer.split("\n");

  parts.forEach((part, index) => {
    if (part) {
      pushTextNode(nodes, decodeHtmlEntities(part));
    }

    if (index < parts.length - 1) {
      nodes.push({ type: "line-break" });
    }
  });
}

/**
 * Reads one markdown link token in the form `[label](href)`.
 */
function readMarkdownLink(content: string, startIndex: number) {
  const labelEnd = content.indexOf("]", startIndex + 1);

  if (labelEnd === -1 || content[labelEnd + 1] !== "(") {
    return null;
  }

  const hrefEnd = content.indexOf(")", labelEnd + 2);

  if (hrefEnd === -1) {
    return null;
  }

  return {
    label: content.slice(startIndex + 1, labelEnd),
    href: content.slice(labelEnd + 2, hrefEnd).trim(),
    nextIndex: hrefEnd + 1,
  };
}

/**
 * Reads one supported HTML inline tag or returns null when the current character is not a supported tag.
 */
function readHtmlTag(content: string, startIndex: number) {
  const tagMatch = content
    .slice(startIndex)
    .match(/^<\s*(\/?)\s*([a-z0-9]+)([^>]*)>/i);

  if (!tagMatch) {
    return null;
  }

  const [, closingMarker, rawTagName, rawAttributes] = tagMatch;
  const tagName = rawTagName.toLowerCase();
  const nextIndex = startIndex + tagMatch[0].length;

  if (closingMarker) {
    return { type: "skip", nextIndex } as const;
  }

  if (tagName === "br") {
    return { type: "line-break", nextIndex } as const;
  }

  if (!["strong", "b", "em", "i", "code", "a"].includes(tagName)) {
    return { type: "skip", nextIndex } as const;
  }

  const closingTag = findMatchingClosingTag(content, tagName, nextIndex);

  if (!closingTag) {
    return { type: "skip", nextIndex } as const;
  }

  const innerContent = content.slice(nextIndex, closingTag.startIndex);

  if (tagName === "a") {
    return {
      type: "inline",
      kind: "link",
      href: readHref(rawAttributes),
      content: innerContent,
      nextIndex: closingTag.nextIndex,
    } as const;
  }

  return {
    type: "inline",
    kind:
      tagName === "strong" || tagName === "b"
        ? "strong"
        : tagName === "em" || tagName === "i"
          ? "emphasis"
          : "code",
    content: innerContent,
    nextIndex: closingTag.nextIndex,
  } as const;
}

/**
 * Finds the matching closing tag for a supported inline HTML element.
 */
function findMatchingClosingTag(content: string, tagName: string, startIndex: number) {
  const tagPattern = new RegExp(`<\\s*(/?)\\s*${tagName}\\b[^>]*>`, "gi");
  let depth = 1;

  tagPattern.lastIndex = startIndex;

  for (let match = tagPattern.exec(content); match; match = tagPattern.exec(content)) {
    depth += match[1] === "/" ? -1 : 1;

    if (depth === 0) {
      return {
        startIndex: match.index,
        nextIndex: tagPattern.lastIndex,
      };
    }
  }

  return null;
}

/**
 * Extracts an href value from a raw HTML anchor attribute string.
 */
function readHref(attributes: string) {
  const quotedHref = attributes.match(/\bhref\s*=\s*(['"])(.*?)\1/i);

  if (quotedHref?.[2]) {
    return quotedHref[2].trim();
  }

  const unquotedHref = attributes.match(/\bhref\s*=\s*([^\s>]+)/i);
  return unquotedHref?.[1]?.trim() ?? "";
}

/**
 * Allows a small set of safe navigation targets while rejecting executable protocols.
 */
function isSafeHref(href: string) {
  const trimmedHref = href.trim();

  if (!trimmedHref) {
    return false;
  }

  if (trimmedHref.startsWith("/") || trimmedHref.startsWith("#")) {
    return true;
  }

  const protocolMatch = trimmedHref.match(/^([a-z][a-z0-9+.-]*):/i);

  if (!protocolMatch) {
    return true;
  }

  return ["http", "https", "mailto", "tel"].includes(protocolMatch[1].toLowerCase());
}

/**
 * Decodes the small set of HTML entities that commonly appear in provider responses.
 */
function decodeHtmlEntities(content: string) {
  return content.replace(/&(#x?[0-9a-f]+|amp|lt|gt|quot|apos);/gi, (match, entity: string) => {
    const normalizedEntity = entity.toLowerCase();

    if (normalizedEntity === "amp") {
      return "&";
    }

    if (normalizedEntity === "lt") {
      return "<";
    }

    if (normalizedEntity === "gt") {
      return ">";
    }

    if (normalizedEntity === "quot") {
      return '"';
    }

    if (normalizedEntity === "apos") {
      return "'";
    }

    if (normalizedEntity.startsWith("#x")) {
      return String.fromCodePoint(Number.parseInt(normalizedEntity.slice(2), 16));
    }

    if (normalizedEntity.startsWith("#")) {
      return String.fromCodePoint(Number.parseInt(normalizedEntity.slice(1), 10));
    }

    return match;
  });
}

/**
 * Merges adjacent text nodes so the renderer does not create avoidable fragments.
 */
function pushTextNode(nodes: InlineNode[], value: string) {
  if (!value) {
    return;
  }

  const previousNode = nodes[nodes.length - 1];

  if (previousNode?.type === "text") {
    previousNode.value += value;
    return;
  }

  nodes.push({ type: "text", value });
}

/**
 * Renders one block node into semantic HTML with small task-history-friendly styles.
 */
function renderBlock(block: BlockNode, key: string) {
  if (block.type === "heading") {
    return createElement(
      `h${Math.min(block.level, 6)}`,
      {
        className: [
          "font-semibold text-[color:var(--foreground)]",
          block.level <= 2 ? "text-base" : "text-sm",
        ].join(" "),
        key,
      },
      renderInlineNodes(block.children, key),
    );
  }

  if (block.type === "unordered-list") {
    return (
      <ul className="ml-5 list-disc space-y-1" key={key}>
        {block.items.map((item, index) => (
          <li key={`${key}-item-${index}`}>{renderInlineNodes(item, `${key}-item-${index}`)}</li>
        ))}
      </ul>
    );
  }

  if (block.type === "ordered-list") {
    return (
      <ol className="ml-5 list-decimal space-y-1" key={key}>
        {block.items.map((item, index) => (
          <li key={`${key}-item-${index}`}>{renderInlineNodes(item, `${key}-item-${index}`)}</li>
        ))}
      </ol>
    );
  }

  if (block.type === "blockquote") {
    return (
      <blockquote
        className="border-l-2 border-[color:var(--border-strong)] pl-3 text-[color:var(--muted)]"
        key={key}
      >
        <div className="space-y-3">
          {block.blocks.map((nestedBlock, index) =>
            renderBlock(nestedBlock, `${key}-quote-${index}`),
          )}
        </div>
      </blockquote>
    );
  }

  if (block.type === "code-block") {
    return (
      <pre
        className="overflow-x-auto rounded-md bg-[color:var(--surface-muted)] px-3 py-2 font-mono text-xs leading-5 text-[color:var(--foreground)]"
        key={key}
      >
        <code>{block.code}</code>
      </pre>
    );
  }

  return (
    <p className="leading-6" key={key}>
      {renderInlineNodes(block.children, key)}
    </p>
  );
}

/**
 * Renders inline nodes into React content while keeping link and code styling consistent.
 */
function renderInlineNodes(nodes: InlineNode[], keyPrefix: string): ReactNode {
  return nodes.map((node, index) => {
    const key = `${keyPrefix}-inline-${index}`;

    if (node.type === "text") {
      return <Fragment key={key}>{node.value}</Fragment>;
    }

    if (node.type === "line-break") {
      return <br key={key} />;
    }

    if (node.type === "strong") {
      return <strong key={key}>{renderInlineNodes(node.children, key)}</strong>;
    }

    if (node.type === "emphasis") {
      return <em key={key}>{renderInlineNodes(node.children, key)}</em>;
    }

    if (node.type === "code") {
      return (
        <code
          className="rounded bg-[color:var(--surface-muted)] px-1 py-0.5 font-mono text-[0.92em] text-[color:var(--foreground)]"
          key={key}
        >
          {node.value}
        </code>
      );
    }

    const isExternalLink = /^https?:\/\//i.test(node.href);

    return (
      <a
        className="font-medium text-[color:var(--foreground)] underline decoration-[color:var(--border-strong)] underline-offset-3"
        href={node.href}
        key={key}
        rel={isExternalLink ? "noreferrer" : undefined}
        target={isExternalLink ? "_blank" : undefined}
      >
        {renderInlineNodes(node.children, key)}
      </a>
    );
  });
}
