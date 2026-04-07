import type { Agent, CronJob } from "./types";
import { supabase } from "./supabase";

// Claude API pricing per 1M tokens (USD)
const MODEL_PRICING: Record<string, { input: number; output: number }> = {
  "claude-sonnet-4": { input: 3.0, output: 15.0 },
  "claude-opus-4": { input: 15.0, output: 75.0 },
  "claude-haiku-3": { input: 0.25, output: 1.25 },
  "claude-3-5-sonnet": { input: 3.0, output: 15.0 },
  "claude-3-5-haiku": { input: 0.8, output: 4.0 },
  "claude-3-opus": { input: 15.0, output: 75.0 },
  "claude-3-haiku": { input: 0.25, output: 1.25 },
};

const DEFAULT_PRICING = { input: 3.0, output: 15.0 };

function estimateCostFromTokens(totalTokens: number, model: string): number {
  if (totalTokens <= 0) return 0;
  let pricing = DEFAULT_PRICING;
  for (const [key, p] of Object.entries(MODEL_PRICING)) {
    if (model.includes(key) || key.includes(model)) {
      pricing = p;
      break;
    }
  }
  const inputTokens = totalTokens * 0.6;
  const outputTokens = totalTokens * 0.4;
  return (inputTokens * pricing.input + outputTokens * pricing.output) / 1_000_000;
}

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
  heartbeat: Record<string, unknown>;
  identity: { soul_preview?: string };
  sessions: { count: number; total_tokens: number; total_cost: number; models: string[] };
}

export async function getGateways(): Promise<Gateway[]> {
  const { data } = await supabase.from("gateways").select("*").order("registered_at");
  return (data || []) as Gateway[];
}

export async function getGateway(id: string): Promise<Gateway | null> {
  const { data } = await supabase.from("gateways").select("*").eq("id", id).single();
  return data as Gateway | null;
}

export async function getDefaultGatewayId(): Promise<string | null> {
  const { data } = await supabase.from("gateways").select("id").order("registered_at").limit(1);
  return data?.[0]?.id || null;
}

export async function getAgents(gatewayId?: string): Promise<(Agent & { config?: AgentConfig })[]> {
  let query = supabase.from("gateway_agents").select("*, gateways(id, name)").order("name");
  if (gatewayId) query = query.eq("gateway_id", gatewayId);

  const { data: stored } = await query;
  if (!stored?.length) return [];

  return stored.map((a: Record<string, unknown>) => {
    const gw = a.gateways as Record<string, unknown> | null;
    let parsedConfig: AgentConfig | undefined;
    try {
      const raw = typeof a.config === "string" ? JSON.parse(a.config as string) : a.config;
      if (raw && typeof raw === "object") parsedConfig = raw as AgentConfig;
    } catch { /* ignore */ }

    const sessions = parsedConfig?.sessions || { count: 0, total_tokens: 0, total_cost: 0, models: [] };
    const model = (a.model || parsedConfig?.sessions?.models?.[0] || "unknown") as string;
    const rawCost = sessions.total_cost;
    const hasCostData = rawCost > 0;
    return {
      id: a.agent_id as string,
      name: (a.name || a.agent_id) as string,
      model,
      workspace: (a.workspace || "") as string,
      status: (sessions.count > 0 ? "active" : "idle") as "active" | "idle" | "error",
      purpose: (a.purpose || "") as string,
      totalTokens: sessions.total_tokens,
      contextTokens: 1000000,
      contextUsed: sessions.total_tokens,
      sessionCount: sessions.count,
      gatewayId: (gw?.id as string) || "",
      gatewayName: (gw?.name as string) || "",
      estimatedCost: hasCostData ? rawCost : estimateCostFromTokens(sessions.total_tokens, model),
      isCostEstimated: !hasCostData && sessions.total_tokens > 0,
      config: parsedConfig,
    };
  });
}

export async function getAgent(id: string, gatewayId?: string): Promise<(Agent & { config?: AgentConfig }) | null> {
  const agents = await getAgents(gatewayId);
  return agents.find((a) => a.id === id) || null;
}

export async function getGatewaySettings(gatewayId: string): Promise<Record<string, unknown> | null> {
  const gw = await getGateway(gatewayId);
  if (!gw?.tunnel_url || !gw?.api_token) return null;
  
  // Try to get live status from the gateway
  try {
    const res = await fetch(`${gw.tunnel_url}/tools/invoke`, {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${gw.api_token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ tool: "session_status", args: {} }),
      cache: "no-store",
      signal: AbortSignal.timeout(10000),
    });
    const data = await res.json();
    if (data.ok) {
      return {
        statusText: data.result?.content?.[0]?.text || "",
        ...data.result?.details || {},
      };
    }
  } catch { /* ignore */ }
  return null;
}

export async function getWindowResetTime() {
  const WINDOW_MS = 5 * 60 * 60 * 1000;
  const now = new Date();
  const midnight = new Date(now); midnight.setUTCHours(0, 0, 0, 0);
  const w = Math.floor((now.getTime() - midnight.getTime()) / WINDOW_MS);
  return { resetAt: new Date(midnight.getTime() + (w + 1) * WINDOW_MS), windowHours: 5 };
}
