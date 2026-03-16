import { type WorkspaceSnapshot } from "./types";

export const workspaceSeed: WorkspaceSnapshot = {
  tasks: [
    {
      id: "task-1",
      title: "Define the smallest possible task manager",
      details: "Keep only create, edit, delete, and call-agent actions.",
      project: "Relay MVP",
      agentCalls: [],
    },
    {
      id: "task-2",
      title: "List the next three product decisions",
      details: "Use this as an example of a normal editable task.",
      project: "Relay MVP",
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
    {
      id: "task-3",
      title: "Review quarterly goals",
      details: "Compare current progress against initial targets.",
      project: "",
      agentCalls: [],
    },
  ],
};
