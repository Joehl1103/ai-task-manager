# Relay Tasks Starter

## Repo Location

This app lives at the repository root (`ai-task-manager/`).
Run app and git commands from the repository root.

## Project Overview

Relay is currently a minimal web starter for task management with two primary ideas:

- A compact task overview list
- A selected-task drill-down for editing and agent activity
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
- `src/features/workspace/storage/*`: workspace local storage helpers
- `src/features/workspace/theme/*`: theme registry and selector
- `src/features/workspace/navigation/*`: menu metadata and top-menu UI
- `config/next/*`: Next dev-server config helpers
- `src/app/api/agent-call/route.ts`: live provider-backed agent endpoint
- `src/components/ui/*`: small shared UI primitives

## Design Guidelines

- Keep the UI minimalist and text-first. Extra chrome, borders, and decoration should earn their place.
- Clickable controls should feel clickable: visible hover states, pointer cursors where appropriate, and immediate active feedback.
- Important actions should be obvious; secondary and destructive actions can be quieter but still discoverable.
- Interactive elements should have clear default, hover, active, disabled, and selected states when relevant.
- Use color to communicate hierarchy and state, not just decoration.
- Stay desktop-first for now, but keep keyboard access and visible focus states intact.

## Projects and Tasks

Current focus:

- Keep the app very small
- Keep the top-level shell thin and desktop-oriented
- Let the user compare six paired day/night visual directions from Configuration, including the original starter theme
- Preserve add, edit, delete, task-level agent calls, and deletion of saved agent contributions
- Keep the main overview compact and move agent history into task drill-down
- Keep configuration separate from the task workflow
- Keep the agent model to one built-in path, not multiple agent types
- Support local OpenAI configuration for real task-level agent calls first
- Keep task-level agent responses readable with safe basic markdown and HTML formatting
- Persist tasks and task-scoped agent history locally in the browser

Likely next tasks:

- Add persistence beyond browser local storage when shared sync becomes important
- Add completion state
- Add ordering and filtering only if they are truly needed
- Harden secret handling before any shared deployment
