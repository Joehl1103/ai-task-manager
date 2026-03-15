# Delete Agent Contribution Plan

## Goal

Add the ability to delete one saved agent contribution from a task drill-down without deleting the task itself.

## Steps

1. Add a pure workspace operation that removes a single agent call from one task.
2. Cover that operation with tests so count and latest-activity behavior stay correct.
3. Wire a delete control into the agent activity cards in the task drill-down.
4. Update the project docs and run lint, tests, and a production build.
