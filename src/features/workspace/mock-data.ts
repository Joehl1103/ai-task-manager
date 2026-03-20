import {
  createInboxProject,
  createNoProjectProject,
  inboxProjectId,
} from "./inbox-project";
import { createAgentThread } from "./thread-helpers";
import { type WorkspaceSnapshot } from "./types";

export const workspaceSeed: WorkspaceSnapshot = {
  initiatives: [
    {
      id: "initiative-1",
      name: "Q2 Product Launch",
      description: "All work related to the Q2 product launch including MVP and marketing.",
      deadline: "2026-06-30",
      agentThread: {
        ...createAgentThread("initiative", "initiative-1"),
        messages: [
          {
            id: "message-1",
            role: "human",
            content: "Summarize the launch initiative in one paragraph.",
            createdAt: "Earlier today",
          },
          {
            id: "message-2",
            role: "agent",
            content: "The launch initiative is focused on shipping the MVP and the minimum supporting rollout work needed to learn quickly.",
            createdAt: "Earlier today",
            providerId: "openai",
            model: "gpt-5",
            status: "done",
          },
        ],
      },
    },
  ],
  projects: [
    createInboxProject(),
    createNoProjectProject(),
    {
      id: "project-1",
      name: "Relay MVP",
      initiativeId: "initiative-1",
      deadline: "2026-04-15",
      agentThread: {
        ...createAgentThread("project", "project-1"),
        messages: [],
      },
    },
    {
      id: "project-2",
      name: "Personal",
      initiativeId: "",
      deadline: "",
      agentThread: {
        ...createAgentThread("project", "project-2"),
        messages: [],
      },
    },
  ],
  tasks: [
    {
      id: "task-1",
      title: "Define the smallest possible task manager",
      details: "Keep only create, edit, delete, and call-agent actions.",
      projectId: "project-1",
      deadline: "",
      tags: ["planning", "design"],
      agentThread: {
        ...createAgentThread("task", "task-1"),
        messages: [],
      },
    },
    {
      id: "task-2",
      title: "List the next three product decisions",
      details: "Use this as an example of a normal editable task.",
      projectId: "project-1",
      deadline: "",
      tags: ["high-priority", "design"],
      agentThread: {
        ...createAgentThread("task", "task-2"),
        messages: [
          {
            id: "message-1",
            role: "human",
            content: "Return with three examples of minimalist task manager layouts.",
            createdAt: "Earlier today",
          },
          {
            id: "message-2",
            role: "agent",
            content: [
              "## Starter direction",
              "",
              "- Use one clean list",
              "- Keep metadata light",
              "- Keep agent actions inside each task",
            ].join("\n"),
            createdAt: "Earlier today",
            providerId: "openai",
            model: "gpt-5",
            status: "done",
          },
        ],
      },
    },
    {
      id: "task-3",
      title: "Review quarterly goals",
      details: "Compare current progress against initial targets.",
      projectId: inboxProjectId,
      deadline: "",
      tags: ["review"],
      agentThread: {
        ...createAgentThread("task", "task-3"),
        messages: [],
      },
    },
  ],
};
