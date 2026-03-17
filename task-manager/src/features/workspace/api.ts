// API client for workspace data

export interface Initiative {
  id: string;
  name: string;
  description: string;
  deadline: string;
  createdAt: string;
  updatedAt: string;
}

export interface Project {
  id: string;
  name: string;
  initiativeId: string | null;
  deadline: string;
  createdAt: string;
  updatedAt: string;
}

export interface AgentCall {
  id: string;
  taskId: string;
  providerId: string;
  model: string;
  brief: string;
  status: string;
  result: string | null;
  error: string | null;
  createdAt: string;
}

export interface Task {
  id: string;
  title: string;
  details: string;
  projectId: string | null;
  tags: string[];
  agentCalls: AgentCall[];
  createdAt: string;
  updatedAt: string;
}

export interface WorkspaceData {
  initiatives: Initiative[];
  projects: Project[];
  tasks: Task[];
}

// Initiatives API
export async function fetchInitiatives(): Promise<Initiative[]> {
  const response = await fetch("/api/initiatives");
  if (!response.ok) throw new Error("Failed to fetch initiatives");
  return response.json();
}

export async function createInitiative(data: {
  name: string;
  description: string;
  deadline: string;
}): Promise<Initiative> {
  const response = await fetch("/api/initiatives", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });
  if (!response.ok) throw new Error("Failed to create initiative");
  return response.json();
}

export async function updateInitiative(data: {
  id: string;
  name: string;
  description: string;
  deadline: string;
}): Promise<Initiative> {
  const response = await fetch("/api/initiatives", {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });
  if (!response.ok) throw new Error("Failed to update initiative");
  return response.json();
}

export async function deleteInitiative(id: string): Promise<void> {
  const response = await fetch(`/api/initiatives?id=${id}`, {
    method: "DELETE",
  });
  if (!response.ok) throw new Error("Failed to delete initiative");
}

// Projects API
export async function fetchProjects(): Promise<Project[]> {
  const response = await fetch("/api/projects");
  if (!response.ok) throw new Error("Failed to fetch projects");
  return response.json();
}

export async function createProject(data: {
  name: string;
  initiativeId: string;
  deadline: string;
}): Promise<Project> {
  const response = await fetch("/api/projects", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });
  if (!response.ok) throw new Error("Failed to create project");
  return response.json();
}

export async function updateProject(data: {
  id: string;
  name: string;
  initiativeId: string;
  deadline: string;
}): Promise<Project> {
  const response = await fetch("/api/projects", {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });
  if (!response.ok) throw new Error("Failed to update project");
  return response.json();
}

export async function deleteProject(id: string): Promise<void> {
  const response = await fetch(`/api/projects?id=${id}`, {
    method: "DELETE",
  });
  if (!response.ok) throw new Error("Failed to delete project");
}

// Tasks API
export async function fetchTasks(): Promise<Task[]> {
  const response = await fetch("/api/tasks");
  if (!response.ok) throw new Error("Failed to fetch tasks");
  return response.json();
}

export async function createTask(data: {
  title: string;
  details: string;
  projectId: string;
  tags: string[];
}): Promise<Task> {
  const response = await fetch("/api/tasks", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });
  if (!response.ok) throw new Error("Failed to create task");
  return response.json();
}

export async function updateTask(data: {
  id: string;
  title: string;
  details: string;
  projectId: string;
  tags: string[];
}): Promise<Task> {
  const response = await fetch("/api/tasks", {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });
  if (!response.ok) throw new Error("Failed to update task");
  return response.json();
}

export async function deleteTask(id: string): Promise<void> {
  const response = await fetch(`/api/tasks?id=${id}`, {
    method: "DELETE",
  });
  if (!response.ok) throw new Error("Failed to delete task");
}

// Fetch all workspace data at once
export async function fetchWorkspaceData(): Promise<WorkspaceData> {
  const [initiatives, projects, tasks] = await Promise.all([
    fetchInitiatives(),
    fetchProjects(),
    fetchTasks(),
  ]);

  return { initiatives, projects, tasks };
}
