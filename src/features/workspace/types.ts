export type ProviderId = "anthropic" | "openai" | "google";

export type AgentCallStatus = "done" | "error";

export interface ProviderSettings {
  apiKey: string;
  model: string;
}

export interface AgentConfigState {
  activeProvider: ProviderId;
  providers: Record<ProviderId, ProviderSettings>;
}

export interface AgentDraft {
  brief: string;
  error: string | null;
}

export interface AgentCall {
  id: string;
  providerId: ProviderId;
  model: string;
  brief: string;
  status: AgentCallStatus;
  createdAt: string;
  result?: string;
  error?: string;
}

export interface Initiative {
  id: string;
  name: string;
  description: string;
  deadline: string;
}

export interface Project {
  id: string;
  name: string;
  initiativeId: string;
  deadline: string;
}

export interface Task {
  id: string;
  title: string;
  details: string;
  projectId: string;
  deadline: string;
  tags: string[];
  agentCalls: AgentCall[];
}

export interface WorkspaceSnapshot {
  initiatives: Initiative[];
  projects: Project[];
  tasks: Task[];
}

export interface AddTaskInput {
  title: string;
  details: string;
  projectId?: string;
  deadline?: string;
  tags?: string[];
}

export interface UpdateTaskInput {
  taskId: string;
  title: string;
  details: string;
  projectId?: string;
  deadline?: string;
  tags?: string[];
}

export interface AddInitiativeInput {
  name: string;
  description: string;
  deadline: string;
}

export interface UpdateInitiativeInput {
  initiativeId: string;
  name: string;
  description: string;
  deadline: string;
}

export interface AddProjectInput {
  name: string;
  initiativeId: string;
  deadline: string;
}

export interface UpdateProjectInput {
  projectId: string;
  name: string;
  initiativeId: string;
  deadline: string;
}

export interface CallAgentInput {
  taskId: string;
  providerId: ProviderId;
  model: string;
  brief: string;
  now: string;
  status: AgentCallStatus;
  result?: string;
  error?: string;
}
