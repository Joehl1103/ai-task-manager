# Stock shadcn UI Migration Plan

## Goal

Convert the app away from bespoke workspace UI patterns and toward out-of-the-box shadcn components so future effort goes into functionality, data flow, and agent behavior instead of visual tuning. The practical target is not "zero app-specific JSX," but "no custom reusable UI styling or interaction patterns unless the product logic truly requires them."

## Context

- The repo already has shadcn configured in [`components.json`](./components.json) and ships custom-styled primitives in `src/components/ui/*`.
- The current implementation still spends design energy on a Relay-specific "no-chrome" layer:
  - custom primitive styling in [`src/components/ui/button.tsx`](./src/components/ui/button.tsx), [`src/components/ui/select.tsx`](./src/components/ui/select.tsx), [`src/components/ui/dialog.tsx`](./src/components/ui/dialog.tsx), [`src/components/ui/dropdown-menu.tsx`](./src/components/ui/dropdown-menu.tsx), and [`src/components/ui/tooltip.tsx`](./src/components/ui/tooltip.tsx)
  - custom disclosure and theme-panel CSS in [`src/app/globals.css`](./src/app/globals.css)
  - custom interaction composites in workspace views such as [`src/features/workspace/navigation/workspace-sidebar.tsx`](./src/features/workspace/navigation/workspace-sidebar.tsx), [`src/features/workspace/navigation/workspace-top-menu.tsx`](./src/features/workspace/navigation/workspace-top-menu.tsx), [`src/features/workspace/agent-configuration-view.tsx`](./src/features/workspace/agent-configuration-view.tsx), [`src/features/workspace/tasks/task-editor-fields.tsx`](./src/features/workspace/tasks/task-editor-fields.tsx), [`src/features/workspace/tasks/task-tag-combobox.tsx`](./src/features/workspace/tasks/task-tag-combobox.tsx), and [`src/features/workspace/theme/workspace-theme-selector.tsx`](./src/features/workspace/theme/workspace-theme-selector.tsx)
- The user clarified the motivation: reduce time spent tweaking UI and prefer stock shadcn so attention stays on functionality.

## Decisions

- Optimize for stock shadcn defaults over preserving Relay's current no-chrome visual language.
- Treat "nothing custom" as "no bespoke reusable UI components or bespoke styling systems unless required by domain behavior."
- Keep app-specific state management and business composition custom.
- Prefer shadcn registry composites where available: `sidebar`, `collapsible`, `accordion`, `command`, `form`, `card`, `scroll-area`, `checkbox`, `badge`, `textarea`, `input`, `select`, `dropdown-menu`, `dialog`, `tooltip`, `separator`.
- Use one bounded child issue now that fits a single Codex GPT-5.4 execution pass instead of trying to migrate the whole app in one shot.

## Assumptions

- Temporary visual regressions are acceptable if they reduce custom UI maintenance.
- The 6-theme system can remain temporarily, but theme-specific polish is out of scope for the first pass.
- Some domain-specific layouts will still exist after the migration because shadcn does not provide app-specific task-management screens out of the box.

## Proposed Changes

### Parent Initiative

- Replace custom-styled shadcn primitives with stock registry implementations or the closest unmodified registry output.
- Remove bespoke workspace interaction patterns where a shadcn registry composite exists.
- Simplify or delete CSS that only exists to preserve the current Relay-specific design language.
- Standardize task, project, initiative, search, and configuration surfaces on stock shadcn building blocks.
- Update tests to verify behavior, not custom visuals.

### Context-Window-Sized Sub-Issues

#### Sub-Issue 1: Primitive Reset + Global Style Simplification

- Regenerate or normalize the local shadcn primitives to be as close to stock registry output as possible.
- Remove bespoke visual variants and simplify `globals.css` where it exists only to preserve the Relay-specific no-chrome layer.
- Keep tokens needed for correctness, but stop tuning primitives beyond minimal wiring.

#### Sub-Issue 2: Workspace Shell + Search Standardization

- Replace the custom workspace navigation shell with shadcn `sidebar` and `collapsible` patterns.
- Replace the top menu with a stock shadcn menu/disclosure pattern.
- Replace the custom global search layout with shadcn `command` inside `dialog`.
- Preserve current navigation and keyboard-search behavior while accepting stock presentation.

#### Sub-Issue 3: Configuration + Theme Surface Simplification

- Replace configuration `details/summary` disclosures with shadcn `accordion`.
- Simplify the theme selector into stock shadcn cards, buttons, and selection controls instead of custom preview-heavy presentation.
- Keep configuration behavior the same while removing custom presentation logic.

#### Sub-Issue 4: Task Editing + Tag Selection Standardization

- Replace the custom inline editor shell with stock shadcn form, textarea, button, select, and separator patterns.
- Replace the custom tag combobox with a shadcn-style popover/command or equivalent stock pattern.
- Preserve keyboard submission and editing behavior.

#### Sub-Issue 5: Project, Initiative, Archive, and Thread Views

- Convert bespoke list rows and metadata clusters into stock card/list compositions using shadcn primitives.
- Standardize action menus, empty states, and thread message presentation on stock components.
- Keep all current project, initiative, archive, and thread workflows functional.

## Files Or Systems Likely Affected

- `components.json`
- `src/app/globals.css`
- `src/components/ui/*`
- `src/features/workspace/navigation/workspace-sidebar.tsx`
- `src/features/workspace/navigation/workspace-collapsed-rail.tsx`
- `src/features/workspace/navigation/workspace-top-menu.tsx`
- `src/features/workspace/agent-configuration-view.tsx`
- `src/features/workspace/search/global-search-dialog.tsx`
- `src/features/workspace/tasks/task-editor-fields.tsx`
- `src/features/workspace/tasks/task-tag-combobox.tsx`
- `src/features/workspace/task-management-view.tsx`
- `src/features/workspace/inbox-view.tsx`
- `src/features/workspace/project-view.tsx`
- `src/features/workspace/initiative-view.tsx`
- `src/features/workspace/archive-view.tsx`
- `src/features/workspace/threads/agent-thread-panel.tsx`
- `src/features/workspace/workspace-app.tsx`
- related workspace tests under `src/features/workspace/*.test.tsx`

## Risks And Unknowns

- shadcn's stock `sidebar` pattern may require small local adaptation to fit the current desktop-only shell.
- The current theme tokens may make some stock components look slightly off until a later cleanup pass.
- The stock shadcn registry does not provide every Relay-specific pattern directly, so some "stock" replacements will still be compositions of stock building blocks.
- The custom tag combobox and theme selector are both large enough that they should stay in separate child issues.
- Some current tests may be tightly coupled to custom copy or structure and will need to be rewritten around behavior.

## Verification

1. Run targeted workspace tests covering navigation, configuration, and global search.
2. Run `npm test`, `npm run lint`, and `npm run build`.
3. Manually verify:
   - sidebar navigation still changes views correctly
   - configuration sections still expand/collapse correctly
   - global search still supports typing, arrow navigation, Enter, and Escape
   - no broken focus traps or keyboard regressions were introduced
