# Issue 21 Plan

Source issue: `#21`

Reference spec: [`docs/superpowers/specs/2026-03-20-full-shadcn-implementation-design.md`](./superpowers/specs/2026-03-20-full-shadcn-implementation-design.md)

## Execution Notes

- Add `components.json` with shadcn/ui defaults that match the existing Next.js and Tailwind setup.
- Establish phase-1 typography, radius, and shadow tokens in `src/app/globals.css`.
- Replace remaining arbitrary text-size utilities in the affected workspace views and shared primitives.
- Normalize configuration, project, and initiative page headings from `text-3xl` to `text-2xl`.
