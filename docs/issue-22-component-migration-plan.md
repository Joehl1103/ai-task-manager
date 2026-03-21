# Issue 22 Plan

Source issue: `#22`

Reference spec: [`docs/superpowers/specs/2026-03-20-full-shadcn-implementation-design.md`](./superpowers/specs/2026-03-20-full-shadcn-implementation-design.md)

## Execution Notes

- Install `@radix-ui/react-slot` and `@radix-ui/react-select`.
- Replace Button, Input, Textarea, Badge, and Select with shadcn-style primitives that keep Relay's no-chrome visual language.
- Migrate the saved-model picker in `agent-configuration-view.tsx` to the Radix Select compound API.
- Verify the primitive output and affected workspace views with targeted tests, lint, and a production build.
