# Relay Tasks Starter

## Repo Location

This app lives at the repository root (`ai-task-manager/`).
Run app and git commands from the repository root.

## Project Overview

Relay is currently a minimal web starter for task management with two primary ideas:

- A compact task overview list
- A selected-task inline editor that expands inside the current list
- A thin top-menu shell that separates Tasks from Configuration

The current goal is to keep the product as small as possible before layering on more capabilities.

## Architecture

- `src/app/page.tsx`: app entry point
- `src/features/workspace/workspace-app.tsx`: app shell and state orchestration
- `src/features/workspace/task-management-view.tsx`: task workflow UI
- `src/features/workspace/inbox-view.tsx`: inbox-specific task workflow UI
- `src/features/workspace/project-view.tsx`: project workflow UI
- `src/features/workspace/initiative-view.tsx`: initiative workflow UI
- `src/features/workspace/agent-configuration-view.tsx`: provider configuration UI
- `src/features/workspace/mock-data.ts`: local seed data for tasks and sample agent history
- `src/features/workspace/core/*`: shared workspace types
- `src/features/workspace/tasks/*`: task operations, grouping, overview helpers, and delete messaging
- `src/features/workspace/projects/*`: inbox helpers, project operations, and project selection helpers
- `src/features/workspace/initiatives/*`: initiative operations
- `src/features/workspace/providers/*`: provider request and configuration helpers
- `src/features/workspace/threads/*`: thread rendering, ids, and context helpers
- `src/features/workspace/search/*`: command search helpers and dialog
- `src/features/workspace/storage/*`: workspace persistence abstraction (API + localStorage fallback)
- `src/features/workspace/theme/*`: theme registry and selector
- `src/features/workspace/navigation/*`: menu metadata and top-menu UI
- `src/db/*`: Drizzle ORM schema and database connection
- `src/app/api/workspace/route.ts`: full workspace snapshot endpoint
- `src/app/api/tasks/route.ts`: task CRUD endpoint
- `src/app/api/projects/route.ts`: project CRUD endpoint
- `src/app/api/initiatives/route.ts`: initiative CRUD endpoint
- `src/app/api/threads/[ownerId]/route.ts`: thread message CRUD endpoint
- `src/app/api/agent-call/route.ts`: live provider-backed agent endpoint
- `config/next/*`: Next dev-server config helpers
- `src/components/ui/*`: small shared UI primitives

## Design Guidelines

- The no-chrome aesthetic is a hard design constraint for workspace UI changes.
- Before changing the shell or any workspace-facing view, read [`docs/no-chrome-design-rules.md`](docs/no-chrome-design-rules.md).
- Keep the UI minimalist and text-first. Extra chrome, borders, and decoration should earn their place.
- Clickable controls should feel clickable: visible hover states, pointer cursors where appropriate, and immediate active feedback.
- Important actions should be obvious; secondary and destructive actions can be quieter but still discoverable.
- Interactive elements should have clear default, hover, active, disabled, and selected states when relevant.
- Use color to communicate hierarchy and state, not just decoration.
- Stay desktop-first for now, but keep keyboard access and visible focus states intact.

## Projects and Tasks

Current focus:

- Keep the app very small
- Preserve the no-chrome UI language even as the shell evolves
- Keep the top-level shell thin, desktop-oriented, and visually quiet
- Let the user compare six paired day/night visual directions from Configuration, including the original starter theme
- Preserve add, inline edit, delete, and thread access where those threads still exist
- Keep the main overview compact and keep task editing inline inside the list
- Keep the selected-task inline editor language consistent across inbox, task lists, and project detail
- Keep configuration separate from the task workflow
- Keep the agent model to one built-in path, not multiple agent types
- Support local OpenAI configuration for real project- and initiative-level agent calls first
- Keep saved agent responses readable with safe basic markdown and HTML formatting
- Persist tasks, projects, initiatives, and thread history in PostgreSQL (localStorage as offline fallback)
- Provider API keys stay in browser localStorage only — never sent to the database

Likely next tasks:

- Add date-based task filtering (today, this week, overdue)
- Add ordering and sorting if needed
- Harden secret handling before any shared deployment
