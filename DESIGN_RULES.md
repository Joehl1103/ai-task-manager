# Design Rules for Relay Task Manager

These are the core interaction and visual design principles that guide all UI components in the Relay app.

---

## 1. Clickability & Feedback

### Rule: Clickable elements must feel clickable and provide immediate physical feedback.

**Why**: Users need to know what's interactive and receive confirmation that their click registered.

**Implementation**:

#### Visual Affordance (Before Click)
- **Cursor change**: `cursor-pointer` on all interactive elements
- **Subtle hover state**: Visual change that indicates interactivity without being distracting
  - Color transition: Text or background shifts to a more prominent color
  - Opacity change: Slight increase in opacity (e.g., `hover:opacity-80`)
  - Scale hint: Minimal scale (e.g., `hover:scale-[1.02]`)
- **Button styling**: Clear button appearance (borders, background, or distinct visual container)
- **Link styling**: Color differentiation from body text, potential underline on hover

#### Physical Feedback (During/After Click)
- **Active state**: Immediate visual response that mimics pressing a button
  - Scale down slightly: `active:scale-95` (subtle press effect)
  - Background darken: `active:bg-opacity-80` or color shift
  - Shadow reduction: `active:shadow-none` (pressed down appearance)
- **Transition timing**: Smooth 150-200ms transitions for state changes (not instant, not sluggish)
- **No lag**: Feedback must feel immediate—no loading delays before feedback appears

#### Examples

**Primary Button (CTA)**:
```tsx
<Button
  className="transition-all duration-150 active:scale-95 active:shadow-none"
  onClick={handleClick}
>
  Action
</Button>
```

**Subtle Text Link**:
```tsx
<button
  className="hover:text-[color:var(--foreground)] active:opacity-70 transition-all duration-150"
  onClick={handleClick}
  type="button"
>
  Click me
</button>
```

**Toggle/Selection Control**:
```tsx
<button
  className={cn(
    "px-3 py-1 rounded transition-all duration-150",
    "active:scale-[0.98]",
    isActive 
      ? "bg-[color:var(--foreground)] text-white" 
      : "hover:bg-[color:var(--surface-strong)] text-[color:var(--muted)]"
  )}
  onClick={handleToggle}
>
  Option
</button>
```

---

## 2. Minimalist Aesthetic

### Rule: Keep the UI clean, lightweight, and purposeful—no unnecessary chrome.

**Implementation**:
- Remove or minimize borders, shadows, and decorative elements unless they serve a function
- Use whitespace effectively to create visual hierarchy
- Text-based interfaces preferred over icon-heavy designs
- Single accent color used sparingly for important interactive elements
- Semantic sizing: Small UI elements for secondary actions, larger for primary actions

**Examples**:
- Use `variant="ghost"` for secondary buttons (no background by default)
- Prefer text links over standalone icon buttons
- Minimal padding and margins—only what's necessary for clarity

---

## 3. Discoverability vs. Subtlety Balance

### Rule: Important actions should be obvious; supporting actions can be subtle.

**Priority Levels**:

**High Priority** (Must be obvious):
- Primary actions (Add task, Save, etc.)
- Modal/critical decisions
- Navigation between major sections
- Error messages and warnings
- Current active state indicators

**Medium Priority** (Should be findable):
- Secondary actions (Edit, Delete)
- Mode toggles and filters
- Configuration options
- Less common features

**Low Priority** (Can be subtle):
- Hover tooltips
- Tertiary information
- Advanced options
- Keyboard shortcuts

**Implementation**:
- High priority: Larger, more prominent color, active state styling
- Medium priority: Visible but with less visual weight, contextual placement
- Low priority: Text-based, appear on hover, use secondary colors

---

## 4. State Clarity

### Rule: Every interactive element must have clear visual states: default, hover, active, disabled.

**Required States**:
- **Default**: Neutral appearance showing what the element is
- **Hover**: Changes to indicate interactivity (color, opacity, scale)
- **Active**: Pressed/selected appearance showing click feedback
- **Disabled**: Grayed out or muted to show unavailability
- **Active/Selected**: For toggles and selections, a distinct state showing current choice

**Implementation**:
```tsx
// Example of complete state handling
<button
  className={cn(
    // Default state
    "px-3 py-1 rounded text-sm transition-all duration-150 cursor-pointer",
    
    // Hover state
    "hover:opacity-80 hover:bg-[color:var(--surface-strong)]",
    
    // Active/pressed state
    "active:scale-95 active:opacity-100",
    
    // Disabled state
    "disabled:opacity-50 disabled:cursor-not-allowed",
    
    // Selected/active indicator
    isActive && "bg-[color:var(--foreground)] text-white"
  )}
  disabled={isDisabled}
  onClick={handleClick}
>
  {label}
</button>
```

---

## 5. Color Usage

### Rule: Use colors intentionally for function, not decoration.

**Current Palette**:
- `--foreground`: Primary text and important elements
- `--muted`: Secondary text, hints
- `--muted-strong`: Medium emphasis text
- `--surface`: Light backgrounds
- `--border`: Dividers and subtle separators
- `--accent`: Primary action color

**Rules**:
- Use color to indicate state (active, hover, disabled)
- Use color hierarchy to guide attention
- Maintain sufficient contrast for accessibility (WCAG AA minimum)
- Tag badges: Darker grey (#9ca3af) with white text for high contrast

---

## 6. Spacing & Typography

### Rule: Consistent spacing and typography create visual harmony.

**Spacing**:
- Use Tailwind spacing scale consistently (gap-1, gap-2, gap-3, etc.)
- Vertical rhythm: Related items grouped closer, unrelated items further apart
- Breathing room: Don't overcrowd—whitespace is active design

**Typography**:
- Use `text-xs`, `text-sm`, `text-base` for consistent hierarchy
- Font weights: `font-normal` (default), `font-medium` (emphasis), `font-semibold` (headings)
- Line-height: Ensure readability, especially in long-form text

---

## 7. Interaction Timing

### Rule: Animations and transitions should be fast enough to feel responsive, not slow enough to feel sluggish.

**Recommended Timings**:
- State transitions (hover, active): **150ms**
- Loading indicators: **200-300ms**
- Modal appearances: **200ms**
- Page transitions: **300ms maximum**
- Use `transition-all` for simple, coordinated changes

**Easing**:
- Use Tailwind defaults (`ease-in-out`) for most transitions
- Prefer `linear` for continuous animations (loading spinners)

---

## 8. Accessibility

### Rule: All interactive elements must be keyboard accessible and screen-reader friendly.

**Implementation**:
- Use semantic HTML: `<button>` for actions, `<a>` for navigation
- Provide clear `aria-labels` for icon-only buttons
- Ensure focus states are visible (default browser focus is acceptable)
- Test with keyboard navigation (Tab, Enter, Space)
- Color should never be the only indicator of state—use additional visual cues

---

## 9. Responsive Behavior

### Rule: The app should work on desktop; mobile is out of scope for now.

**Current Focus**:
- Desktop-first design
- Minimum viewport: 1024px width (typical laptop)
- No media queries required at this stage

---

## 10. Testing Interactive Elements

### Checklist for any new clickable element:

- [ ] Cursor changes to pointer on hover
- [ ] Visual feedback on hover (color, opacity, or subtle scale)
- [ ] Visual feedback on active/click (press effect or state change)
- [ ] Click registers immediately (no perceived lag)
- [ ] Disabled state is clearly visually different if applicable
- [ ] Works with keyboard (Tab to focus, Enter/Space to activate)
- [ ] Tooltip or label explains the action (if not obvious)
- [ ] Consistent with existing button styles in the app
- [ ] Passes accessibility color contrast checks

---

## Examples: Good vs. Bad

### ❌ Bad: No Feedback
```tsx
// Looks clickable but feels dead
<button onClick={handleClick} className="text-sm">
  Click me
</button>
```

### ✅ Good: Clear Feedback
```tsx
// Feels responsive and interactive
<button
  onClick={handleClick}
  className="px-2 py-1 text-sm transition-all duration-150 cursor-pointer hover:opacity-80 active:scale-95"
>
  Click me
</button>
```

### ❌ Bad: Overly Busy
```tsx
// Too much animation, feels aggressive
<button
  onClick={handleClick}
  className="animate-pulse shadow-lg hover:shadow-2xl active:shadow-xl transform hover:scale-125"
>
  Click me
</button>
```

### ✅ Good: Subtle but Present
```tsx
// Minimal but clearly interactive
<button
  onClick={handleClick}
  className="px-2 py-1 text-xs text-[color:var(--muted)] transition-colors duration-150 hover:text-[color:var(--foreground)] active:opacity-70"
  type="button"
>
  Toggle mode
</button>
```

---

## Summary

1. **Feel**: Clickable things must feel clickable with immediate feedback
2. **Minimalism**: Keep chrome light; let content dominate
3. **Discovery**: Important actions obvious, supporting actions subtle
4. **States**: Every element needs default, hover, active, and disabled states
5. **Colors**: Use intentionally, not decoratively
6. **Spacing**: Consistent and purposeful
7. **Timing**: Fast (150-300ms), not sluggish or instant
8. **Access**: Keyboard navigable, screen-reader friendly
9. **Desktop-first**: Optimize for laptop/desktop screens
10. **Test**: Verify every clickable element follows these rules

