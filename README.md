# Relay Tasks Starter

Relay is now a very small task manager starter.

This app lives at the repository root (`ai-task-manager/`).

## Current Scope

- One compact overview list holding all tasks
- One quieter inbox composer with inline tag autocomplete plus `Cmd+N` and `Cmd+Enter` keyboard flows
- One shared inline task editor that expands beneath the selected row across inbox, task lists, and project detail
- A thin desktop top menu that opens from the current-view label
- Theme options in Configuration with 6 paired day/night UI directions, including Relay Original
- Configuration sections built on shadcn-style accordion and card surfaces instead of custom disclosure markup
- Add a task
- Edit a task inline without leaving the list
- Delete a task
- Configure OpenAI with named local API keys and key-specific model selection
- Make live OpenAI-backed agent calls through project and initiative threads
- Render basic markdown and safe HTML formatting inside saved agent responses
- Persist tasks and thread history in browser local storage

## Stack

- Next.js 16
- TypeScript
- Tailwind CSS v4
- shadcn-style primitives with shared design tokens, plus sidebar, command-palette, and configuration-surface patterns built on Select, Dialog, DropdownMenu, Tooltip, Label, Separator, Accordion, and Card components
- Vitest

## Commands

Run these from the repository root:

```bash
npm install
npm run dev
npm run lint
npm test
npm run build
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
- `src/features/workspace/task-management-view.tsx`: task-only workspace view
- `src/features/workspace/inbox-view.tsx`: inbox-focused task view
- `src/features/workspace/project-view.tsx`: project list and drill-in view
- `src/features/workspace/initiative-view.tsx`: initiative list and drill-in view
- `src/features/workspace/agent-configuration-view.tsx`: provider setup view
- `src/features/workspace/mock-data.ts`: starter tasks and sample agent history
- `src/features/workspace/core/*`: shared workspace types
- `src/features/workspace/tasks/*`: shared task editor, inline editor, tag-combobox, operations, grouping, overview, and confirmation helpers
- `src/features/workspace/projects/*`: inbox-system-project helpers, project operations, and selection helpers
- `src/features/workspace/initiatives/*`: initiative operations
- `src/features/workspace/providers/*`: provider config and API helpers
- `src/features/workspace/threads/*`: thread UI plus owner/context helpers
- `src/features/workspace/search/*`: global search helpers and the command-palette dialog
- `src/features/workspace/storage/*`: workspace local storage helpers and normalization
- `src/features/workspace/theme/*`: theme registry and selector
- `src/features/workspace/navigation/*`: sidebar and top-navigation shell UI plus menu metadata
- `config/next/*`: Next dev-server config helpers and tests
- `src/components/ui/*`: reusable shadcn-style UI primitives, including sidebar, command, accordion, card, dialog, dropdown, tooltip, and form building blocks used across the workspace shell

## Product Assumptions

- The goal right now is simplicity, not completeness.
- There is one built-in agent flow rather than multiple agent types.
- Tasks and provider configuration should stay visually separate.
- Provider settings, tasks, and agent history are stored in browser local storage for this prototype.
- Only one saved OpenAI key is active at a time, and each saved key keeps its own fetched model list.
- OpenAI is the only live provider wired in during this pass.
- More Relay features can be layered in after this baseline feels right.

## Suggested Next Steps

- Add persistence beyond browser local storage when multi-device or shared access matters
- Add task completion state
- Add ordering, filtering, or grouping if needed
- Add stronger security around provider secrets before any shared deployment
