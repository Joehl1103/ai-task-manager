import { type WorkspaceSnapshot } from "./types";

export const workspaceSeed: WorkspaceSnapshot = {
  tasks: [
    {
      id: "task-1",
      title: "Define the smallest possible task manager",
      project: "Relay foundation",
      details: "Keep only create, edit, delete, and call-agent actions.",
      agentCalls: [],
    },
    {
      id: "task-2",
      title: "List the next three product decisions",
      project: "Product direction",
      details: "Use this as an example of a normal editable task.",
      agentCalls: [
        {
          id: "call-1",
          providerId: "openai",
          model: "gpt-5",
          brief: "Return with three examples of minimalist task manager layouts.",
          status: "done",
          createdAt: "Earlier today",
          result: [
            "## Starter direction",
            "",
            "- Use one clean list",
            "- Keep metadata light",
            "- Keep agent actions inside each task",
          ].join("\n"),
        },
      ],
    },
  ],
};
