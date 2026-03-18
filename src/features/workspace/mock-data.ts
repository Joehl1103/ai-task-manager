import { type WorkspaceSnapshot } from "./types";

export const workspaceSeed: WorkspaceSnapshot = {
  initiatives: [
    {
      id: "initiative-1",
      name: "Q2 Product Launch",
      description: "All work related to the Q2 product launch including MVP and marketing.",
      deadline: "2026-06-30",
    },
  ],
  projects: [
    {
      id: "project-1",
      name: "Relay MVP",
      initiativeId: "initiative-1",
      deadline: "2026-04-15",
    },
    {
      id: "project-2",
      name: "Personal",
      initiativeId: "",
      deadline: "",
    },
  ],
  tasks: [
    {
      id: "task-1",
      title: "Define the smallest possible task manager",
      details: "Keep only create, edit, delete, and call-agent actions.",
      projectId: "project-1",
      deadline: "2026-04-05",
      tags: ["planning", "design"],
      agentCalls: [],
    },
    {
      id: "task-2",
      title: "List the next three product decisions",
      details: "Use this as an example of a normal editable task.",
      projectId: "project-1",
      deadline: "2026-04-10",
      tags: ["high-priority", "design"],
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
      projectId: "",
      deadline: "",
      tags: ["review"],
      agentCalls: [],
    },
  ],
};
