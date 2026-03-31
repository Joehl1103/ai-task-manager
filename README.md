# Relay Tasks Starter

Relay is now a very small task manager starter.

This app lives at the repository root (`ai-task-manager/`).

## Current Scope

- One compact overview list holding all tasks
- One dedicated Tasks view for all active tasks, with project/date filters and project/tag grouping
- One Archive view for completed tasks
- One quieter inbox composer with inline tag autocomplete plus `Cmd+N` and `Cmd+Enter` keyboard flows
- One shared inline task editor that expands beneath the selected row across inbox, task lists, and project detail
- A thin desktop top menu that opens from the current-view label
- Theme options in Configuration with 6 paired day/night UI directions, including Relay Original
- Add a task
- Edit a task inline without leaving the list
- Delete a task
- Configure OpenAI with named local API keys and key-specific model selection
- Make live OpenAI-backed agent calls through project and initiative threads
- Render basic markdown and safe HTML formatting inside saved agent responses
- Persist tasks and thread history in PostgreSQL (falls back to browser local storage when DB is unavailable)
- Browse an in-app Documentation section with an API wiki that is linked from Configuration

## Stack

- Next.js 16
- TypeScript
- Tailwind CSS v4
- shadcn-style primitives with shared design tokens and Radix-backed Select, Dialog, DropdownMenu, Tooltip, Label, and Separator behavior
- PostgreSQL + Drizzle ORM for persistence
- Vitest

## Setup

### Database (optional)

Relay can run without a database — it falls back to browser localStorage. To enable PostgreSQL persistence:

1. Start the database:
   ```bash
   docker compose up -d
   ```

2. Copy the env file:
   ```bash
   cp .env.example .env
   ```

   If you replace the sample DB URL with a hosted Postgres URL, percent-encode reserved password characters such as `$` and `#` inside `DATABASE_URL`.
   Supabase-hosted setups can also use `SUPABASE_DATABASE_URL`.
   If `.env.local` also defines the same database keys, `.env.local` wins.

   After changing `.env`, restart `npm run dev`. Reloading the browser alone does not refresh server env vars.

3. Push the schema:
   ```bash
   npm run db:push
   ```

The app auto-detects whether the database is available on mount. If the API returns an error, it falls back to localStorage.

### In-app documentation

Relay now includes a first-party API wiki inside the product:

- Open `Configuration` and use `Open API docs`
- Or navigate directly to `Documentation -> API`

## Commands

Run these from the repository root:

```bash
npm install
npm run dev
npm run lint
npm test
npm run build
```

### Database commands

```bash
npm run db:push       # Push schema to database
npm run db:generate   # Generate migration files
npm run db:migrate    # Apply migrations
npm run db:studio     # Open Drizzle Studio
```

`npm run dev` now enables polling-based file watching automatically so edits inside worktrees and tmp-based directories are picked up without changing the dev-server command.

You can also run multiple `npm run dev` instances at the same time now. The wrapper chooses an available port and gives each dev instance its own build directory under `.next/instances/port-<port>`, which avoids Next.js lock-file collisions between concurrent servers.

Each instance also gets its own generated tsconfig under `.next/instances/port-<port>/tsconfig.json`, so Next can write port-specific type includes without mutating the tracked root `tsconfig.json`.

The Next.js dev config also derives `allowedDevOrigins` from the machine's current IPv4 addresses so HMR stays connected when your LAN IP changes. If you use a custom local hostname, you can add it with `ALLOWED_DEV_ORIGINS=relay.local npm run dev`.

## Git Version Control

The app is the primary project in this repository.

- Source files at the repository root are intended to be tracked by git
- Build output, dependencies, env files, csv files, and xlsx files are ignored
- Git commands should be run from the repository root
- Typical workflow: `git status`, `git add .`, `git commit`

## File Map

- `src/app/page.tsx`: page entry
- `src/app/globals.css`: global theme tokens and Tailwind token mappings
- `src/app/api/agent-call/route.ts`: provider proxy route for live agent calls
- `components.json`: shadcn/ui configuration aligned with the existing alias and Tailwind setup
- `src/features/workspace/workspace-app.tsx`: app shell and state wiring for top-level views
- `src/features/workspace/tasks-view.tsx`: all active tasks with filtering and grouping
- `src/features/workspace/inbox-view.tsx`: inbox-focused task view
- `src/features/workspace/project-view.tsx`: project list and drill-in view
- `src/features/workspace/initiative-view.tsx`: initiative list and drill-in view
- `src/features/workspace/archive-view.tsx`: completed-task archive grouped by completion date
- `src/features/workspace/agent-configuration-view.tsx`: provider setup view
- `src/features/workspace/documentation/*`: in-app wiki content and API reference view
- `src/features/workspace/mock-data.ts`: starter tasks and sample agent history
- `src/features/workspace/core/*`: shared workspace types
- `src/features/workspace/tasks/*`: shared task editor, inline editor, tag-combobox, operations, grouping, overview, and confirmation helpers
- `src/features/workspace/projects/*`: inbox-system-project helpers, project operations, and selection helpers
- `src/features/workspace/initiatives/*`: initiative operations
- `src/features/workspace/providers/*`: provider config and API helpers
- `src/features/workspace/threads/*`: thread UI plus owner/context helpers
- `src/features/workspace/search/*`: global search helpers and dialog
- `src/features/workspace/storage/*`: workspace persistence (API + localStorage fallback) and normalization
- `src/db/*`: Drizzle ORM schema and database connection
- `src/features/workspace/theme/*`: theme registry and selector
- `src/features/workspace/navigation/*`: top-menu UI and menu metadata
- `config/next/*`: Next dev-server config helpers and tests
- `src/components/ui/*`: reusable shadcn-style UI primitives, with Radix used where accessibility or composition needs it across Select, Dialog, DropdownMenu, Tooltip, Label, and Separator

## Product Assumptions

- The goal right now is simplicity, not completeness.
- There is one built-in agent flow rather than multiple agent types.
- Tasks and provider configuration should stay visually separate.
- Tasks, projects, initiatives, and agent threads are persisted in PostgreSQL when available, with localStorage as offline fallback.
- Provider settings (API keys) remain in browser local storage only — they are never sent to the database.
- Only one saved OpenAI key is active at a time, and each saved key keeps its own fetched model list.
- OpenAI is the only live provider wired in during this pass.
- The in-app Documentation section is the source of truth for the current API surface that ships with the app.
- More Relay features can be layered in after this baseline feels right.

## Suggested Next Steps

- Add persistence beyond browser local storage when multi-device or shared access matters
- Add sorting once the Tasks view filtering and grouping patterns feel stable
- Add stronger security around provider secrets before any shared deployment
