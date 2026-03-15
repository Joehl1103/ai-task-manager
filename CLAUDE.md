# Relay Tasks Starter

## Project Overview

Relay is currently a minimal web starter for task management with two primary ideas:

- A single task list
- A single built-in agent call action inside each task

The current goal is to keep the product as small as possible before layering on more capabilities.

## Architecture

- `src/app/page.tsx`: app entry point
- `src/features/workspace/workspace-app.tsx`: single task container UI
- `src/features/workspace/mock-data.ts`: local seed data for tasks and sample agent history
- `src/features/workspace/operations.ts`: pure task and agent-call helpers
- `src/features/workspace/provider-api.ts`: provider request and response helpers
- `src/features/workspace/workspace-storage.ts`: workspace local storage helpers
- `src/app/api/agent-call/route.ts`: live provider-backed agent endpoint
- `src/components/ui/*`: small shared UI primitives

## Projects and Tasks

Current focus:

- Keep the app very small
- Preserve add, edit, delete, and task-level agent calls
- Keep the agent model to one built-in path, not multiple agent types
- Support local OpenAI configuration for real task-level agent calls first
- Persist tasks and task-scoped agent history locally in the browser

Likely next tasks:

- Add persistence beyond browser local storage when shared sync becomes important
- Add completion state
- Add ordering and filtering only if they are truly needed
- Harden secret handling before any shared deployment
