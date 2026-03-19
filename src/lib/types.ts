export interface Agent {
  id: string;
  name: string;
  model: string;
  workspace: string;
  agentDir?: string;
  status: "active" | "idle" | "error";
  lastActive?: string;
  totalTokens?: number;
  contextTokens?: number;
  contextUsed?: number;
  sessionCount?: number;
  purpose?: string;
  emoji?: string;
  tools?: Record<string, unknown>;
  subagents?: { allowAgents?: string[] };
}

export interface Session {
  key: string;
  kind: string;
  channel: string;
  displayName: string;
  updatedAt: number;
  sessionId: string;
  model: string;
  contextTokens: number;
  totalTokens: number;
  lastChannel: string;
  lastAccountId?: string;
}

export interface CronJob {
  id: string;
  name: string;
  agentId: string;
  enabled: boolean;
  schedule: {
    kind: string;
    expr?: string;
    tz?: string;
  };
  payload: {
    kind: string;
    message?: string;
  };
  state?: {
    nextRunAtMs?: number;
    lastRunAtMs?: number;
    lastRunStatus?: string;
    lastDurationMs?: number;
    consecutiveErrors?: number;
  };
}

export interface Skill {
  name: string;
  path: string;
  agentId: string;
  description?: string;
  content?: string;
  lastModified?: string;
}

export interface Binding {
  agentId: string;
  match: {
    channel: string;
    accountId?: string;
  };
}

export interface GatewayConfig {
  agents: {
    defaults: {
      model: { primary: string };
      models: Record<string, unknown>;
    };
    list: Array<{
      id: string;
      name?: string;
      model?: string;
      workspace?: string;
      agentDir?: string;
      tools?: Record<string, unknown>;
      subagents?: { allowAgents?: string[] };
    }>;
  };
  bindings: Binding[];
  channels: Record<string, unknown>;
  gateway: {
    port: number;
    mode: string;
    bind: string;
  };
}
