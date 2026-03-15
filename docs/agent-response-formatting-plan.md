# Agent Response Formatting Plan

- Add a small formatter that safely renders basic markdown and a limited HTML subset for task-level agent responses.
- Cover the formatter with tests first so paragraphs, headings, lists, inline emphasis, code, links, and simple HTML stay stable.
- Replace the plain text agent result rendering in the task history UI with the formatted renderer.
- Run the relevant test and build checks after the UI is wired up.
