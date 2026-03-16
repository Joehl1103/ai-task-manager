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

export interface Task {
  id: string;
  title: string;
  project: string;
  details: string;
  agentCalls: AgentCall[];
}

export interface WorkspaceSnapshot {
  tasks: Task[];
}

export interface AddTaskInput {
  title: string;
  project: string;
  details: string;
}

export interface UpdateTaskInput {
  taskId: string;
  title: string;
  project: string;
  details: string;
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
