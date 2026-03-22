# Issue 30 Plan

Source issue: `#30`

## Execution Notes

- Add a small shadcn-style accordion primitive so Configuration can move off native `details` and `summary`.
- Update the configuration view tests first so they assert accordion-driven sections and the simplified theme selector structure.
- Simplify the workspace theme selector onto quieter card and button selection patterns while preserving the existing theme data and callback behavior.
- Remove custom disclosure styling that becomes unnecessary after the accordion migration.
- Verify with targeted tests, then run the broader relevant suite for regression coverage.
