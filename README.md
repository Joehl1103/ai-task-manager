# Relay Tasks Starter

Relay is now a very small task manager starter.

## Current Scope

- One compact overview list holding all tasks
- One drill-down view for a selected task
- Add a task
- Edit a task inside the drill-down
- Delete a task
- Call one built-in agent from inside a task drill-down
- Configure OpenAI with a local API key and model
- Make live OpenAI-backed agent calls through the app
- Persist tasks and agent history in browser local storage

## Stack

- Next.js 16
- TypeScript
- Tailwind CSS v4
- Small component primitives
- Vitest

## Commands

```bash
npm install
npm run dev
npm run lint
npm test
npm run build
```

## Git Version Control

The app lives inside the existing git repository for this project.

- Source files in the repo root are intended to be tracked by git
- Build output, dependencies, env files, csv files, and xlsx files are ignored
- Typical workflow: `git status`, `git add .`, `git commit`

## File Map

- `src/app/page.tsx`: page entry
- `src/app/api/agent-call/route.ts`: provider proxy route for live agent calls
- `src/features/workspace/workspace-app.tsx`: task overview and drill-down UI
- `src/features/workspace/operations.ts`: pure task and agent-call updates
- `src/features/workspace/mock-data.ts`: starter tasks and sample agent history
- `src/features/workspace/provider-api.ts`: shared provider request and response helpers
- `src/features/workspace/task-overview.ts`: compact task-summary helpers for overview cards
- `src/features/workspace/workspace-storage.ts`: workspace local storage helpers and normalization
- `src/components/ui/*`: reusable UI primitives

## Product Assumptions

- The goal right now is simplicity, not completeness.
- There is one built-in agent flow rather than multiple agent types.
- Provider settings, tasks, and agent history are stored in browser local storage for this prototype.
- OpenAI is the only live provider wired in during this pass.
- More task-manager features can be layered in after this baseline feels right.

## Suggested Next Steps

- Add persistence beyond browser local storage when multi-device or shared access matters
- Add task completion state
- Add ordering, filtering, or grouping if needed
- Add stronger security around provider secrets before any shared deployment
