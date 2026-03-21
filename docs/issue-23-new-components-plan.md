# Issue 23 Plan

Source issue: `#23`

Reference spec: [`docs/superpowers/specs/2026-03-20-full-shadcn-implementation-design.md`](./superpowers/specs/2026-03-20-full-shadcn-implementation-design.md)

## Execution Notes

- Install the phase-3 Radix packages for dialog, dropdown menu, tooltip, label, and separator.
- Add shadcn-style `Dialog`, `DropdownMenu`, `Tooltip`, `Label`, and `Separator` primitives with Relay's quieter no-chrome overrides.
- Replace the hand-built global search overlay with the shared dialog primitive while preserving keyboard navigation and selection behavior.
- Use dropdown menus for quiet secondary task, project, and initiative actions instead of scattering multiple inline ghost buttons.
- Use tooltips on sidebar icon controls and icon-only action buttons so compact controls still explain themselves.
- Wire the API key editor fields to explicit labels and replace the touched view dividers with the shared separator primitive where it improves semantics without adding extra chrome.
- Verify the touched primitives and workspace views with targeted tests, lint, and a production build.
