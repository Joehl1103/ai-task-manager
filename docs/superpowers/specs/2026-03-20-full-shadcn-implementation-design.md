# Full shadcn/ui Implementation

**Date:** 2026-03-20
**Status:** Approved
**Parent issue:** #20

## Summary

Expand issue #20 (font-size token alignment) into a full shadcn/ui implementation: comprehensive design tokens, migration of 5 existing hand-built primitives to real shadcn/ui components, and addition of 5 new components. Delivered in 3 sequential phases, each independently shippable.

## Goals

- Single source of truth for all visual design decisions via design tokens
- Real shadcn/ui components backed by Radix primitives for accessibility
- Preserve the no-chrome design language and 6-theme system
- Zero breaking changes to the theme injection pipeline

## Non-Goals

- Rewriting the theme system (it already works, shadcn maps to it)
- Adding components beyond the 10 identified (install later when needed)
- Mobile responsiveness (desktop-first per project guidelines)
- Semantic token migration (text-body, text-heading) — separate follow-up

## Constraints

- **No-chrome design rules** are a hard constraint. All shadcn defaults must be overridden to match Relay's text-first, spacing-driven aesthetic. See `docs/no-chrome-design-rules.md`.
- **Theme system unchanged.** `buildWorkspaceThemeStyle()` continues to inject CSS custom properties at runtime. shadcn components consume the same variables.
- **Import paths preserved.** shadcn installs to `@/components/ui/`, matching existing imports. View files change only where component APIs differ.

## Token Architecture

### Layer 1: Existing Color Tokens (unchanged)

The 30 CSS custom properties already defined in `globals.css` map directly to shadcn expectations:

- `--background`, `--foreground`
- `--primary`, `--primary-foreground`
- `--secondary`, `--secondary-foreground`
- `--accent`, `--accent-foreground`
- `--muted`, `--muted-strong`
- `--card`, `--card-foreground`
- `--popover`, `--popover-foreground`
- `--border`, `--border-strong`
- `--input`, `--ring`, `--focus-ring`

Relay-specific tokens (`--row-divider`, `--row-hover`, `--row-active`, `--shadow-color`, `--backdrop-*`) remain untouched.

### Layer 2: New Non-Color Tokens

**Typography** (from original issue #20 PoC):

| Token | Value | Tailwind | Usage |
|-------|-------|----------|-------|
| `--font-size-xs` | 0.75rem (12px) | `text-xs` | timestamps, meta, badges, labels |
| `--font-size-sm` | 0.875rem (14px) | `text-sm` | body text, buttons, inputs |
| `--font-size-base` | 1rem (16px) | `text-base` | agent response headings |
| `--font-size-xl` | 1.25rem (20px) | `text-xl` | drill-down titles |
| `--font-size-2xl` | 1.5rem (24px) | `text-2xl` | page headings |

**Radius:**

| Token | Value | Notes |
|-------|-------|-------|
| `--radius` | 0.375rem | Subtler than shadcn default (0.5rem), no-chrome friendly |

**Shadows:**

| Token | Usage |
|-------|-------|
| `--shadow-sm` | Sparse — only Dialog/Popover elevation |
| `--shadow-md` | Sparse — only Dialog/Popover elevation |

Shadows are restricted per no-chrome rules: only used on elevated overlays, never on inline components.

### Layer 3: Theme Integration

```
WorkspaceThemePalette → buildWorkspaceThemeStyle() → CSS custom properties on :root
                                                        ↑
                                          shadcn components read these directly
```

Zero changes to the theme pipeline. shadcn components consume the same CSS variables that the 6 theme pairs already inject.

## Component Plan

### Migrate Existing (5 components)

| Current | shadcn/ui | Radix? | API Change | Notes |
|---------|-----------|--------|------------|-------|
| Button | Button | No (Slot only) | Minimal | Remap variant names, add size prop |
| Input | Input | No | None | Same API — styled native input |
| Textarea | Textarea | No | None | Same API — styled native textarea |
| Select | Select | Yes | Moderate | Native → Radix compound component (Trigger, Content, Item) |
| Badge | Badge | No | Minimal | Remap variants: neutral→default, accent→secondary. Keep success/warning/danger as custom. |

### Add New (5 components)

| Component | Radix? | Replaces / Enables |
|-----------|--------|--------------------|
| Dialog | Yes | Replaces hand-built modal in `global-search-dialog.tsx`. Adds focus trapping, Esc, backdrop click, screen reader announcements. |
| DropdownMenu | Yes | Task/project action menus. Quieter than inline buttons per no-chrome rules. |
| Tooltip | Yes | Sidebar icon labels, action buttons. Positioned, accessible, dismissable. |
| Label | Yes | Proper `<label>` wiring for form fields in agent configuration view. |
| Separator | Yes | Replaces ad-hoc `border-b` dividers with semantic, accessible separator. |

### New Dependencies

```
@radix-ui/react-dialog
@radix-ui/react-dropdown-menu
@radix-ui/react-tooltip
@radix-ui/react-label
@radix-ui/react-separator
@radix-ui/react-select
@radix-ui/react-slot
```

All tree-shakeable. 7 packages total.

### No-Chrome Overrides

shadcn defaults are too heavy for Relay. Override at install time via `components.json` and globals.css:

- `--radius`: 0.375rem (vs shadcn's 0.5rem)
- Shadows: only on Dialog, Popover, DropdownMenu content
- Borders: sparse, use `--border` token
- No card-first layouts in component usage

## Phase Structure

### Phase 1: Foundation (sub-issue of #20)

**Branch:** `feature/shadcn-foundation`

- Install shadcn/ui CLI, create `components.json` with no-chrome defaults
- Add font-size tokens to `globals.css` (completes original #20 scope)
- Add `--radius` and shadow tokens
- Replace all arbitrary Tailwind values (`text-[11px]`, `text-[10px]`, `text-[0.92em]`)
- Fix inconsistent heading sizes (`text-3xl` → `text-2xl`)
- Verify all 6 themes still render correctly

**Files changed:** ~13
**New deps:** None
**Risk:** Low

### Phase 2: Component Migration (sub-issue of #20)

**Branch:** `feature/shadcn-component-migration`

**Depends on:** Phase 1 merged

- Install Radix deps (`@radix-ui/react-slot`, `@radix-ui/react-select`)
- Replace Button, Input, Textarea, Badge with shadcn/ui versions
- Replace native Select with Radix Select (biggest API change)
- Apply no-chrome overrides to component styles
- Update tests

**Files changed:** 5 component files replaced, 7+ view files updated
**New deps:** `@radix-ui/react-slot`, `@radix-ui/react-select`
**Risk:** Moderate (Select API change affects multiple views)

### Phase 3: New Components (sub-issue of #20)

**Branch:** `feature/shadcn-new-components`

**Depends on:** Phase 2 merged

- Add Dialog — wire into `global-search-dialog.tsx`
- Add DropdownMenu — task/project action menus
- Add Tooltip — sidebar icons, action buttons
- Add Label — agent configuration form fields
- Add Separator — replace ad-hoc border dividers
- Verify no-chrome aesthetic across all views

**Files changed:** 5 new component files, 5+ view files updated
**New deps:** `@radix-ui/react-dialog`, `@radix-ui/react-dropdown-menu`, `@radix-ui/react-tooltip`, `@radix-ui/react-label`, `@radix-ui/react-separator`
**Risk:** Low-moderate (additive, no existing APIs change)

## What Stays the Same

- 6-theme system + runtime injection
- No-chrome design language
- Import paths (`@/components/ui/*`)
- `cn()` utility (clsx + tailwind-merge)
- Tailwind v4 + `@theme inline`
- localStorage persistence

## What's Added

- `components.json` (shadcn config)
- 7 Radix packages
- Non-color design tokens (typography, radius, shadow)
- 5 new UI primitives (Dialog, DropdownMenu, Tooltip, Label, Separator)
- Better accessibility (focus trapping, ARIA, keyboard nav)
