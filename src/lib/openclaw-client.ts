import type { Agent, CronJob } from "./types";
import { supabase } from "./supabase";

export interface Gateway {
  id: string;
  name: string;
  tunnel_url: string | null;
  api_token: string | null;
  machine_host: string | null;
  machine_os: string | null;
  openclaw_version: string | null;
  agent_count: number;
  status: "pending" | "online" | "offline";
  last_seen_at: string | null;
  registered_at: string;
}

export interface AgentConfig {
  skills: Array<{ name: string; description: string; path: string; content_preview?: string }>;
  bindings: Array<{ agentId: string; match: Record<string, string> }>;
  tools: Record<string, unknown>;
  subagents: Record<string, unknown>;
  identity: { soul_preview?: string };
  sessions: { count: number; total_tokens: number; total_cost: number; models: string[] };
}

export async function getGateways(): Promise<Gateway[]> {
  const { data } = await supabase.from("gateways").select("*").order("registered_at");
  return (data || []) as Gateway[];
}

export async function getAgents(): Promise<(Agent & { config?: AgentConfig })[]> {
  const { data: stored } = await supabase
    .from("gateway_agents")
    .select("*, gateways(id, name)")
    .order("name");

  if (!stored?.length) return [];

  return stored.map((a: Record<string, unknown>) => {
    const gw = a.gateways as Record<string, unknown> | null;
    let parsedConfig: AgentConfig | undefined;
    
    try {
      const raw = typeof a.config === "string" ? JSON.parse(a.config as string) : a.config;
      if (raw && typeof raw === "object") parsedConfig = raw as AgentConfig;
    } catch { /* ignore */ }

    const sessions = parsedConfig?.sessions || { count: 0, total_tokens: 0, total_cost: 0, models: [] };

    return {
      id: a.agent_id as string,
      name: (a.name || a.agent_id) as string,
      model: (a.model || "unknown") as string,
      workspace: (a.workspace || "") as string,
      status: (sessions.count > 0 ? "active" : "idle") as "active" | "idle" | "error",
      purpose: (a.purpose || "") as string,
      totalTokens: sessions.total_tokens,
      contextTokens: 1000000,
      contextUsed: sessions.total_tokens,
      sessionCount: sessions.count,
      gatewayId: (gw?.id as string) || "",
      gatewayName: (gw?.name as string) || "",
      estimatedCost: sessions.total_cost,
      config: parsedConfig,
    };
  });
}

export async function getAgent(id: string): Promise<(Agent & { config?: AgentConfig }) | null> {
  const agents = await getAgents();
  return agents.find((a) => a.id === id) || null;
}

export async function getCronJobs(): Promise<CronJob[]> { return []; }

export async function getWindowResetTime() {
  const WINDOW_MS = 5 * 60 * 60 * 1000;
  const now = new Date();
  const midnight = new Date(now); midnight.setUTCHours(0, 0, 0, 0);
  const w = Math.floor((now.getTime() - midnight.getTime()) / WINDOW_MS);
  return { resetAt: new Date(midnight.getTime() + (w + 1) * WINDOW_MS), windowHours: 5 };
}
