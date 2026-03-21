# No-Chrome Design Rules

This document preserves the Relay workspace's no-chrome design language.

Any refactor of the shell, navigation, projects, initiatives, inbox, or task views must follow these rules unless the user explicitly decides to change the aesthetic.

## Core Principle

Relay should feel light, text-forward, and calm.

The interface should communicate structure through spacing, typography, alignment, and interaction state before reaching for panels, heavy borders, shadows, pills, cards, or decorative containers.

## Hard Rules

- Default to no-chrome, not card-first UI.
- Treat extra containers, framed panels, and visual boxes as exceptions that must be justified by function.
- Do not turn every view into a grid of cards.
- Do not solve hierarchy by adding more borders.
- Do not use shadows as a default separation mechanism.
- Do not introduce dashboard-style chrome for overview pages.
- Keep the shell visually quiet even when adding navigation like a sidebar.

## Layout Rules

- Use whitespace, grouping, and type scale as the primary layout system.
- Prefer open layouts over nested boxed regions.
- Keep overview pages closer to structured lists or lightly separated rows than to dashboards.
- If a sidebar exists, it should read as a thin navigational layer, not a large decorative panel.
- The center workspace should remain visually dominant without being wrapped in unnecessary framing.
- One strong structural move is enough. If the layout already has a sidebar, the content area should become simpler, not more ornamental.

## Surface Rules

- Borders should be sparse and quiet.
- Rounded corners should stay restrained and purposeful.
- Shadows should be rare and subtle.
- Background fills should not create the feeling of stacked cards everywhere.
- Section separation should usually come from spacing, text labels, and alignment before lines or fills.

## Typography And Interaction

- Typography should carry a meaningful amount of the hierarchy.
- Labels, headings, and metadata should stay compact and disciplined.
- Clickable things still need clear hover, active, selected, and focus states.
- Clickability should come from motion, contrast, cursor behavior, and local emphasis, not from wrapping everything in a button-shaped block.
- Secondary actions should stay quiet until needed.

## Projects And Initiatives

- Projects and initiatives can be clickable and expandable without becoming chunky cards.
- Child items should feel like light list entries or structured rows.
- Overviews should prioritize scanability over “tile” aesthetics.
- Detail pages should keep context visible without surrounding every subsection in a bordered box.

## Refactor Check

Before shipping any workspace UI change, check:

1. If all borders and shadows were removed, would the layout still make sense?
2. Did we add containers because they improve comprehension, or because they were the fastest way to separate things?
3. Does the interface still feel like Relay, or does it now feel like a generic dashboard?
4. Is the navigation present but visually quiet?
5. Are typography and spacing doing more work than chrome?

If the answer to those questions is weak, the design has likely drifted away from the no-chrome direction.
