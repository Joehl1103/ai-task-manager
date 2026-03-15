# Relay Tasks Starter

## Project Overview

Relay is currently a minimal web starter for task management with two primary ideas:

- A compact task overview list
- A selected-task drill-down for editing and agent activity

The current goal is to keep the product as small as possible before layering on more capabilities.

## Architecture

- `src/app/page.tsx`: app entry point
- `src/features/workspace/formatted-agent-response.tsx`: safe formatter for basic markdown and HTML agent responses
- `src/features/workspace/workspace-app.tsx`: compact task overview plus selected-task drill-down UI
- `src/features/workspace/mock-data.ts`: local seed data for tasks and sample agent history
- `src/features/workspace/operations.ts`: pure task and agent-call helpers
- `src/features/workspace/provider-api.ts`: provider request and response helpers
- `src/features/workspace/task-overview.ts`: compact summary helpers for overview cards
- `src/features/workspace/workspace-storage.ts`: workspace local storage helpers
- `src/app/api/agent-call/route.ts`: live provider-backed agent endpoint
- `src/components/ui/*`: small shared UI primitives

## Projects and Tasks

Current focus:

- Keep the app very small
- Preserve add, edit, delete, task-level agent calls, and deletion of saved agent contributions
- Keep the main overview compact and move agent history into task drill-down
- Keep the agent model to one built-in path, not multiple agent types
- Support local OpenAI configuration for real task-level agent calls first
- Keep task-level agent responses readable with safe basic markdown and HTML formatting
- Persist tasks and task-scoped agent history locally in the browser

Likely next tasks:

- Add persistence beyond browser local storage when shared sync becomes important
- Add completion state
- Add ordering and filtering only if they are truly needed
- Harden secret handling before any shared deployment
