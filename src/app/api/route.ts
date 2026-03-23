import { NextResponse } from "next/server";

const apiManifest = {
  name: "Relay Agent API",
  version: "1.0.0",
  endpoints: [
    {
      path: "/api",
      methods: ["GET"],
      description: "Returns this API manifest for agent discovery.",
    },
    {
      path: "/api/workspace",
      methods: ["GET"],
      description: "Returns the full workspace snapshot.",
    },
    {
      path: "/api/tasks",
      methods: ["GET", "POST", "PUT", "DELETE"],
      description: "Task collection endpoints.",
      query: {
        get: ["status=active|completed", "projectId", "tag", "search", "limit", "offset"],
        delete: ["id"],
      },
    },
    {
      path: "/api/tasks/:id",
      methods: ["GET", "PATCH", "DELETE"],
      description: "Single task endpoint with thread data on GET.",
    },
    {
      path: "/api/tasks/bulk",
      methods: ["POST", "PATCH", "DELETE"],
      description: "Bulk task create/update/delete operations.",
    },
    {
      path: "/api/projects",
      methods: ["GET", "POST", "PUT", "DELETE"],
      description: "Project collection endpoints.",
      query: {
        get: ["initiativeId", "search", "limit", "offset"],
        delete: ["id"],
      },
    },
    {
      path: "/api/projects/:id",
      methods: ["GET", "PATCH", "DELETE"],
      description: "Single project endpoint.",
    },
    {
      path: "/api/initiatives",
      methods: ["GET", "POST", "PUT", "DELETE"],
      description: "Initiative collection endpoints.",
      query: {
        get: ["search", "limit", "offset"],
        delete: ["id"],
      },
    },
    {
      path: "/api/initiatives/:id",
      methods: ["GET", "PATCH", "DELETE"],
      description: "Single initiative endpoint.",
    },
    {
      path: "/api/threads/:ownerId",
      methods: ["GET", "POST", "DELETE"],
      description: "Thread and thread message endpoints for a task/project/initiative owner.",
    },
    {
      path: "/api/models",
      methods: ["POST"],
      description: "Fetches chat-capable OpenAI model ids for a provided API key.",
    },
    {
      path: "/api/agent-call",
      methods: ["POST"],
      description: "Forwards a task, project, or initiative thread request to the configured provider.",
    },
  ],
} as const;

export async function GET() {
  return NextResponse.json(apiManifest);
}
