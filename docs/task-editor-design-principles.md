# Task Editor Visual Design Guide

The inbox task composer established the visual language for how task input and editing should look and feel across Relay. This guide captures those decisions so any new task-facing surface stays visually consistent.

This guide extends the [no-chrome design rules](./no-chrome-design-rules.md).

---

## The Editor at a Glance

The editor has two visual states:

**Collapsed** — a single muted text link (`+ Add task`). Nearly invisible. Takes up one line.

**Expanded** — a lightly contained form with an underlined title, borderless details area, inline tag pills, a project picker, and small text actions along the bottom.

The transition between states is instant. No animation.

---

## Input Fields

### Underline, Not Box

The title input uses a single bottom border on a transparent background. There is no surrounding box, no background fill, and no side borders. The field reads as a line of editable text with a subtle rule beneath it.

The details area goes further — it has no border at all. It is simply an open text region below the title. The user types into empty space.

Pickers (like the project selector) follow the same rule: no border, no background, no rounding. They look like plain text until interacted with.

### Focus

When a field receives focus, the bottom border color brightens slightly. Nothing else changes — no glow, no ring, no background shift. Focus is communicated through a single quiet color change.

---

## Typography

Hierarchy comes from three levers: size, weight, and color. Nothing else.

**Title** — 14px, normal weight, foreground color. The largest text in the editor.

**Details** — 12px, normal weight, foreground color. Slightly smaller than the title to establish a clear secondary reading level.

**Actions and hints** — 11px. This is the smallest text tier and covers: submit/cancel buttons, keyboard hints (`⌘↵`), tag pills, and destructive actions. These elements are present but never compete with the content being written.

**Weight** — only the submit action and the collapsed trigger use medium weight (500). Everything else is normal weight. Weight is a scarce resource.

**Color** — muted gray (`--muted`) for secondary elements. Foreground (`--foreground`) for primary content and the submit action. Destructive actions use rose (`rose-600`). Hover transitions shift muted text toward foreground — the element "wakes up" when the cursor arrives.

---

## Container

The expanded editor is one of the few places in Relay that uses an explicit container. It is deliberately understated:

- **Border:** muted color (`--border`), 1px, all sides.
- **Background:** the surface color at 90% opacity — slightly transparent so the page behind shows through.
- **Padding:** 12px horizontal, 6px vertical. Enough to frame, tight enough to avoid feeling like a card.
- **Radius:** 6px (`rounded-md`). Rounded enough to soften, not enough to feel bubbly.
- **Shadow:** none.

The container exists to visually group the editor fields. It should not feel like a panel, a card, or a modal.

---

## Spacing

Structure within the editor comes from spacing, not from dividers or nested containers.

- **Title and tags** sit side by side with 12px between them (title takes 75% width, tags take 25%).
- **Details** sits 8px below the title row.
- **Bottom controls** (project picker, action buttons) sit 8px below details, spread apart with space-between alignment.
- **Tag pills** are spaced 6px apart from each other.
- **Action buttons** in the bottom-right cluster are spaced 12px apart.

---

## Tag Pills

Selected tags render as small inline pills next to the title field.

- Fully rounded (pill shape).
- Muted background fill, 11px muted text.
- Each pill has a small X to remove it.
- On hover, the background and text brighten.
- The tag input field sits inline after the pills, maintaining a single visual line.

The autocomplete dropdown appears below the tag input with a subtle border and popover background. The active suggestion gets a muted background highlight. No bold, no accent colors.

---

## Actions

### Primary (Submit)

11px, medium weight, foreground color. The only element with weight emphasis. When disabled (empty title), opacity drops to 40% and the cursor shows not-allowed.

### Secondary (Cancel)

11px, normal weight, muted color. Transitions to foreground on hover. No background, no border, no button shape.

### Destructive (Delete)

11px, normal weight, rose-600. Darkens to rose-700 on hover. Communicates danger through color alone — no size increase, no icon, no confirmation container.

### Keyboard Hint

The `⌘↵` hint sits next to the action buttons at 11px in muted text. It is discoverable on close inspection but does not draw attention during normal use.

---

## Collapsed State

When collapsed, the editor is just a muted text button: `+ Add task`.

- 14px, medium weight, muted color.
- Transitions to foreground on hover.
- No icon, no container, no border. Just text.

This ensures the composer takes up minimal visual space when not in use and does not add clutter to the task list.

---

## Interaction Feedback

### Hover

Interactive elements use color transitions. Muted text shifts toward foreground. Muted backgrounds brighten. The change is immediate (`transition-colors`) with no delay.

### Completion

When a task is checked off, the circle fills and the row lingers for about 800ms before disappearing. This brief pause gives the user visual confirmation that the action registered. Instant removal feels jarring — the delay prevents that.

### Expansion

Opening the editor is instant. No slide, no fade. The collapsed text button is replaced by the full form. Closing is equally instant and clears all draft content.

---

## Visual Checklist

Before shipping changes to any task input surface:

1. Are fields underlined or borderless — not boxed?
2. Is hierarchy expressed through font size and color — not through added containers or decoration?
3. Does the container feel like a light frame — not a card or panel?
4. Are secondary actions visually quieter than the primary action?
5. Does the collapsed state take up one line of muted text — nothing more?
6. Are hover states present on every interactive element?
