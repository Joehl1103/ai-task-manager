# Relay Tasks Starter

Relay is now a very small task manager starter.

This app lives at the repository root (`ai-task-manager/`).

## Current Scope

- One compact overview list holding all tasks
- One drill-down view for a selected task
- A thin desktop top menu that opens from the current-view label
- Theme options in Configuration with 6 paired day/night UI directions, including Relay Original
- Add a task
- Edit a task inside the drill-down
- Delete a task
- Call one built-in agent from inside a task drill-down
- Delete one saved agent contribution from a task drill-down
- Configure OpenAI with named local API keys and key-specific model selection
- Make live OpenAI-backed agent calls through the app
- Render basic markdown and safe HTML formatting inside saved agent responses
- Persist tasks and agent history in browser local storage

## Stack

- Next.js 16
- TypeScript
- Tailwind CSS v4
- Small component primitives
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

The Next.js dev config also derives `allowedDevOrigins` from the machine's current IPv4 addresses so HMR stays connected when your LAN IP changes. If you use a custom local hostname, you can add it with `ALLOWED_DEV_ORIGINS=relay.local npm run dev`.

## Git Version Control

The app is the primary project in this repository.

- Source files at the repository root are intended to be tracked by git
- Build output, dependencies, env files, csv files, and xlsx files are ignored
- Git commands should be run from the repository root
- Typical workflow: `git status`, `git add .`, `git commit`

## File Map

- `src/app/page.tsx`: page entry
- `src/app/api/agent-call/route.ts`: provider proxy route for live agent calls
- `src/features/workspace/workspace-top-menu.tsx`: thin desktop menu opened from the current-view label
- `src/features/workspace/workspace-theme.ts`: shadcn-inspired theme registry and persistence helpers
- `src/features/workspace/workspace-theme-selector.tsx`: UI toggles for the paired day/night theme options
- `src/features/workspace/task-management-view.tsx`: task-only workspace view
- `src/features/workspace/agent-configuration-view.tsx`: provider setup view
- `src/features/workspace/formatted-agent-response.tsx`: safe basic markdown and HTML renderer for agent history
- `src/features/workspace/workspace-app.tsx`: app shell and state wiring for top-level views
- `src/features/workspace/operations.ts`: pure task and agent-call updates
- `src/features/workspace/mock-data.ts`: starter tasks and sample agent history
- `src/features/workspace/provider-api.ts`: shared provider request and response helpers
- `src/features/workspace/task-overview.ts`: compact task-summary helpers for overview cards
- `src/features/workspace/workspace-storage.ts`: workspace local storage helpers and normalization
- `src/components/ui/*`: reusable UI primitives

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
