# Grouping Toggle UI Proposals

The current implementation has a subtle toggle button ("By Project" / "By Tag") that is not immediately obvious to users. Here are several UI options ranked by visual clarity and user discoverability:

---

## Option 1: Segmented Control (Toggle Buttons) ⭐ **RECOMMENDED**

**Visual Style**: Two adjacent buttons with active state highlighting

```
┌─────────────────────────────────────────┐
│ Grouped by project                      │
│ ┌─────────────┬──────────────┐          │
│ │ By Project  │  By Tag      │          │
│ └─────────────┴──────────────┘          │
│ …tasks list…                            │
└─────────────────────────────────────────┘
```

**Implementation**:
- Two buttons side-by-side with clear visual distinction
- Active button styled with darker background or border
- Inactive button styled as lighter/muted
- Both buttons clearly visible at all times
- Common pattern from many apps (Gmail, Slack, etc.)

**Pros**:
- ✅ Immediately obvious there's a choice to be made
- ✅ Both options visible without any interaction
- ✅ Clear active state shows which mode you're in
- ✅ No extra clicks needed to switch
- ✅ Familiar pattern from popular apps

**Cons**:
- Takes slightly more horizontal space
- Could feel "busy" on mobile (though app is desktop-focused)

**Implementation Location**: Replace current "By Project" button with a two-button control in the overview header

---

## Option 2: Icon Toggle with Tooltip

**Visual Style**: Small icon button with icon indicating current mode

```
┌─────────────────────────────────────────┐
│ Grouped by project    [📊 ▼]            │
│ …tasks list…                            │
└─────────────────────────────────────────┘
```

**Implementation**:
- Single icon button with clear visual affordance
- Tooltip shows "Switch to tag view" or "Switch to project view"
- Icon changes based on mode (e.g., folder icon for projects, tag icon for tags)
- Subtle but discoverable with hover

**Pros**:
- ✅ Takes minimal space
- ✅ Clear icon communication
- ✅ Tooltips help discovery
- ✅ Visual hierarchy preserved

**Cons**:
- ❌ Users might not hover to see tooltip
- ❌ Icon meaning might not be immediately obvious
- ❌ Less clear which mode is currently active

---

## Option 3: Dropdown / Select Menu

**Visual Style**: A dropdown selector showing current and alternative modes

```
┌─────────────────────────────────────────┐
│ Grouped by: [Project ▼]                │
│ …tasks list…                            │
└─────────────────────────────────────────┘
```

**Implementation**:
- Dropdown label + chevron indicating there's a choice
- Click opens menu with "By Project" and "By Tag" options
- Selected option is checked or highlighted

**Pros**:
- ✅ Clear label "Grouped by:"
- ✅ Obvious there's a selector
- ✅ Compact

**Cons**:
- ❌ Requires extra click to see options
- ❌ Less discoverable than segmented control
- ❌ Slower interaction flow

---

## Option 4: Inline Tab-like Buttons (Current Style, Improved)

**Visual Style**: Enhanced version of current button

```
┌─────────────────────────────────────────┐
│ Grouped by project      By Project  By Tag
│ …tasks list…                            │
└─────────────────────────────────────────┘
```

**Implementation**:
- Keep both buttons visible
- Add clear active state (background color, border, or underline)
- Use consistent spacing and styling
- More prominent styling than current

**Pros**:
- ✅ Both options visible
- ✅ Clear active state
- ✅ Straightforward interaction

**Cons**:
- Could look similar to current (which users miss)
- Still might not be obvious without better active styling

---

## Option 5: Labeled Tabs Above Content

**Visual Style**: Browser-like tabs

```
┌───────────────────────────────────────────┐
│ │ By Project │ By Tag │                   │
│ ├─────────────────────────────────────────┤
│ │ …tasks list…                            │
│ │                                          │
└───────────────────────────────────────────┘
```

**Implementation**:
- Two tab-like elements above the task list
- Active tab has underline or background
- Inactive tab is muted
- Very clear visual switching metaphor

**Pros**:
- ✅ Extremely obvious there are two distinct views
- ✅ Familiar tab paradigm
- ✅ Very clear active state
- ✅ Professional look

**Cons**:
- Takes vertical space at top of content
- Might feel like "tab switching" rather than "filtering/grouping"
- Slightly more chrome than the minimal aesthetic

---

## Option 6: Floating Action Button / Pill Badge

**Visual Style**: Floating or pinned badge showing current mode

```
┌─────────────────────────────────────────┐
│ Grouped by project                      │
│ ◆ By Project  By Tag                    │
│ …tasks list…                            │
└─────────────────────────────────────────┘
```

**Implementation**:
- Pill-shaped badge with both options
- Active option in primary color/darker
- Click toggles between modes
- Positioned near the "Grouped by project" text

**Pros**:
- ✅ Compact and modern looking
- ✅ Clear active state with color
- ✅ Minimal chrome
- ✅ Good for the app's aesthetic

**Cons**:
- Could still be subtle
- Pill shape might be unexpected as a toggle

---

## Recommendation

**Go with Option 1 (Segmented Control)** because:

1. **Maximum Discoverability**: Both options visible at all times—no hovering or expanding required
2. **Clear Active State**: Visual distinction immediately shows which mode is active
3. **Industry Standard**: Users are familiar with this pattern from apps like Gmail, Twitter, Slack, etc.
4. **No Learning Curve**: Obvious that you're choosing between two modes
5. **Aligns with App Goals**: Simple, lightweight, and clear

### Implementation Details for Option 1

```tsx
// Pseudo-code for the UI structure
<div className="flex items-center justify-between mb-4">
  <p className="text-xs font-medium uppercase">Grouped by</p>
  
  <div className="flex gap-1 rounded-md border border-[color:var(--border)] p-0.5 bg-[color:var(--surface-muted)]">
    <button
      className={cn(
        "px-2 py-1 text-xs rounded transition-colors",
        taskGroupingMode === "project"
          ? "bg-white text-[color:var(--foreground)] font-medium"
          : "text-[color:var(--muted)]"
      )}
      onClick={() => setTaskGroupingMode("project")}
    >
      Project
    </button>
    
    <button
      className={cn(
        "px-2 py-1 text-xs rounded transition-colors",
        taskGroupingMode === "tag"
          ? "bg-white text-[color:var(--foreground)] font-medium"
          : "text-[color:var(--muted)]"
      )}
      onClick={() => setTaskGroupingMode("tag")}
    >
      Tag
    </button>
  </div>
</div>
```

**Visual Result**:
- Clean, compact control
- Immediate visual feedback on which mode is active
- No confusion about what the button does
- Matches minimalist aesthetic
- Highly discoverable

---

## Summary Table

| Option | Discoverability | Space | User Familiarity | Interaction Cost |
|--------|-----------------|-------|------------------|------------------|
| 1. Segmented Control | ⭐⭐⭐⭐⭐ | Good | ⭐⭐⭐⭐⭐ | 1 click |
| 2. Icon Toggle | ⭐⭐⭐ | Excellent | ⭐⭐⭐ | 1 click |
| 3. Dropdown | ⭐⭐⭐⭐ | Excellent | ⭐⭐⭐ | 2 clicks |
| 4. Enhanced Inline | ⭐⭐⭐⭐ | Good | ⭐⭐⭐ | 1 click |
| 5. Browser Tabs | ⭐⭐⭐⭐⭐ | Fair | ⭐⭐⭐⭐⭐ | 1 click |
| 6. Pill Badge | ⭐⭐⭐ | Good | ⭐⭐⭐ | 1 click |
