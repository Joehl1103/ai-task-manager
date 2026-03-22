export type ProviderId = "anthropic" | "openai" | "google";

export type ThreadOwnerType = "task" | "project" | "initiative";

export type ThreadMessageRole = "human" | "agent";

export type ThreadMessageStatus = "done" | "error";

export interface SavedApiKey {
  id: string;
  label: string;
  apiKey: string;
  model: string;
  availableModels: string[];
}

export interface ProviderSettings {
  apiKey: string;
  model: string;
  savedKeys: SavedApiKey[];
  activeKeyId: string | null;
}

export interface AgentConfigState {
  activeProvider: ProviderId;
  providers: Record<ProviderId, ProviderSettings>;
}

export interface ThreadDraft {
  message: string;
  error: string | null;
}

export interface ThreadOwnerRef {
  ownerType: ThreadOwnerType;
  ownerId: string;
}

export interface AgentThreadMessage {
  id: string;
  role: ThreadMessageRole;
  content: string;
  createdAt: string;
  providerId?: ProviderId;
  model?: string;
  status?: ThreadMessageStatus;
}

export interface AgentThread {
  id: string;
  ownerType: ThreadOwnerType;
  ownerId: string;
  messages: AgentThreadMessage[];
}

export interface Initiative {
  id: string;
  name: string;
  description: string;
  deadline: string;
  agentThread: AgentThread;
}

export interface Project {
  id: string;
  name: string;
  initiativeId: string;
  deadline: string;
  agentThread: AgentThread;
}

export interface Task {
  id: string;
  title: string;
  details: string;
  completed: boolean;
  projectId: string;
  deadline: string;
  tags: string[];
  createdAt: string;
  completedAt: string;
  remindOn: string;
  dueBy: string;
  agentThread: AgentThread;
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

export interface AddHumanThreadMessageInput {
  owner: ThreadOwnerRef;
  content: string;
  now: string;
}

export interface AddAgentThreadMessageInput {
  owner: ThreadOwnerRef;
  providerId: ProviderId;
  model: string;
  content: string;
  now: string;
  status: ThreadMessageStatus;
}
