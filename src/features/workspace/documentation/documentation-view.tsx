"use client";

import { apiDocumentation, type DocumentationMethodDetail, type DocumentationRoute } from "./documentation-content";

/**
 * Presents a lightweight in-app wiki so API docs stay reachable from the product itself.
 */
export function DocumentationView() {
  return (
    <div className="space-y-8">
      <header className="border-b border-[color:var(--border)] pb-6">
        <p className="text-xs font-medium uppercase tracking-[0.22em] text-[color:var(--muted)]">
          Documentation
        </p>
        <h1 className="mt-2 text-2xl font-semibold">{apiDocumentation.title}</h1>
        <p className="mt-2 max-w-3xl text-sm leading-6 text-[color:var(--muted)]">
          {apiDocumentation.summary}
        </p>
      </header>

      <div className="grid gap-8 lg:grid-cols-[16rem_minmax(0,1fr)]">
        <aside className="space-y-4">
          <div className="rounded-2xl border border-[color:var(--border)] bg-[color:var(--surface-strong)] p-4">
            <p className="text-sm font-medium">Wiki sections</p>
            <nav aria-label="Documentation sections" className="mt-3">
              <a
                className="block rounded-md bg-[color:var(--row-active)] px-3 py-2 text-sm font-medium text-[color:var(--foreground)]"
                href="#documentation-api"
              >
                API
              </a>
            </nav>
          </div>
        </aside>

        <article className="space-y-6" id="documentation-api">
          <section className="rounded-2xl border border-[color:var(--border)] bg-[color:var(--surface-strong)] p-5">
            <p className="text-sm font-medium">Conventions</p>
            <div className="mt-4 grid gap-4 md:grid-cols-2">
              {apiDocumentation.facts.map((fact) => (
                <div
                  className="rounded-xl border border-[color:var(--border)] bg-[color:var(--surface)] p-4"
                  key={fact.title}
                >
                  <h2 className="text-sm font-semibold">{fact.title}</h2>
                  <p className="mt-2 text-sm leading-6 text-[color:var(--muted)]">{fact.body}</p>
                </div>
              ))}
            </div>
          </section>

          {apiDocumentation.routeGroups.map((group) => (
            <section
              className="rounded-2xl border border-[color:var(--border)] bg-[color:var(--surface-strong)] p-5"
              key={group.title}
            >
              <h2 className="text-lg font-semibold">{group.title}</h2>
              <p className="mt-2 max-w-3xl text-sm leading-6 text-[color:var(--muted)]">
                {group.description}
              </p>
              <div className="mt-5 space-y-4">
                {group.routes.map((route) => (
                  <RouteCard key={route.path} route={route} />
                ))}
              </div>
            </section>
          ))}

          <section className="rounded-2xl border border-[color:var(--border)] bg-[color:var(--surface-strong)] p-5">
            <h2 className="text-lg font-semibold">Examples</h2>
            <div className="mt-5 space-y-4">
              {apiDocumentation.examples.map((example) => (
                <div
                  className="rounded-xl border border-[color:var(--border)] bg-[color:var(--surface)] p-4"
                  key={example.title}
                >
                  <h3 className="text-sm font-semibold">{example.title}</h3>
                  <p className="mt-2 text-sm leading-6 text-[color:var(--muted)]">
                    {example.description}
                  </p>
                  <CodeBlock code={example.code} language={example.language} />
                </div>
              ))}
            </div>
          </section>
        </article>
      </div>
    </div>
  );
}

interface RouteCardProps {
  route: DocumentationRoute;
}

/**
 * Groups all methods for one path so the article reads like a route catalog instead of a flat list.
 */
function RouteCard({ route }: RouteCardProps) {
  return (
    <div className="rounded-xl border border-[color:var(--border)] bg-[color:var(--surface)] p-4">
      <code className="text-sm font-semibold text-[color:var(--foreground)]">{route.path}</code>
      <div className="mt-4 space-y-4">
        {route.methods.map((detail) => (
          <MethodDetailCard detail={detail} key={`${route.path}-${detail.method}`} />
        ))}
      </div>
    </div>
  );
}

interface MethodDetailCardProps {
  detail: DocumentationMethodDetail;
}

/**
 * Renders the request contract for one HTTP method in a compact, skimmable block.
 */
function MethodDetailCard({ detail }: MethodDetailCardProps) {
  return (
    <div className="rounded-lg border border-[color:var(--border)] bg-[color:var(--surface-strong)] p-4">
      <div className="flex flex-wrap items-center gap-3">
        <MethodBadge method={detail.method} />
        <p className="text-sm font-medium">{detail.summary}</p>
      </div>

      <p className="mt-3 text-sm leading-6 text-[color:var(--muted)]">
        <span className="font-medium text-[color:var(--foreground)]">Response:</span> {detail.response}
      </p>

      {detail.query && detail.query.length > 0 ? (
        <DetailList items={detail.query} label="Query parameters" />
      ) : null}

      {detail.body && detail.body.length > 0 ? (
        <DetailList items={detail.body} label="JSON body fields" />
      ) : null}

      {detail.notes && detail.notes.length > 0 ? (
        <DetailList items={detail.notes} label="Notes" />
      ) : null}
    </div>
  );
}

interface MethodBadgeProps {
  method: DocumentationMethodDetail["method"];
}

/**
 * Uses one compact badge style for HTTP verbs so route scanning stays fast.
 */
function MethodBadge({ method }: MethodBadgeProps) {
  return (
    <span className="inline-flex min-w-14 items-center justify-center rounded-full border border-[color:var(--border)] bg-[color:var(--surface)] px-2.5 py-1 text-[11px] font-semibold uppercase tracking-[0.16em] text-[color:var(--muted-strong)]">
      {method}
    </span>
  );
}

interface DetailListProps {
  items: string[];
  label: string;
}

/**
 * Keeps query params, body fields, and implementation notes visually consistent.
 */
function DetailList({ items, label }: DetailListProps) {
  return (
    <div className="mt-3">
      <p className="text-xs font-medium uppercase tracking-[0.18em] text-[color:var(--muted)]">
        {label}
      </p>
      <div className="mt-2 flex flex-wrap gap-2">
        {items.map((item) => (
          <code
            className="rounded-md border border-[color:var(--border)] bg-[color:var(--surface)] px-2 py-1 text-xs text-[color:var(--muted-strong)]"
            key={`${label}-${item}`}
          >
            {item}
          </code>
        ))}
      </div>
    </div>
  );
}

interface CodeBlockProps {
  code: string;
  language: string;
}

/**
 * Gives examples a simple wiki-style code block without pulling in a markdown renderer.
 */
function CodeBlock({ code, language }: CodeBlockProps) {
  return (
    <pre className="mt-3 overflow-x-auto rounded-xl border border-[color:var(--border)] bg-[#101010] p-4 text-sm text-white">
      <code data-language={language}>{code}</code>
    </pre>
  );
}
