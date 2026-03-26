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

async function invokeGatewayTool(tunnelUrl: string, apiToken: string, tool: string, args: Record<string, unknown> = {}, sessionKey?: string) {
  try {
    const body: Record<string, unknown> = { tool, args };
    if (sessionKey) body.sessionKey = sessionKey;
    
    const res = await fetch(`${tunnelUrl}/tools/invoke`, {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${apiToken}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(body),
      cache: "no-store",
      signal: AbortSignal.timeout(10000),
    });
    const data = await res.json();
    if (!data.ok) return null;
    return data.result?.details || null;
  } catch {
    return null;
  }
}

export async function getGateways(): Promise<Gateway[]> {
  const { data } = await supabase
    .from("gateways")
    .select("*")
    .order("registered_at", { ascending: true });
  return (data || []) as Gateway[];
}

export async function getGateway(id: string): Promise<Gateway | null> {
  const { data } = await supabase.from("gateways").select("*").eq("id", id).single();
  return data as Gateway | null;
}

export async function getAgents(): Promise<Agent[]> {
  // Get all stored agents from Supabase
  const { data: storedAgents } = await supabase
    .from("gateway_agents")
    .select("*, gateways(id, name, tunnel_url, api_token, status)")
    .order("name");

  if (!storedAgents || storedAgents.length === 0) return [];

  // Get latest usage snapshots
  const { data: snapshots } = await supabase
    .from("daily_usage_snapshots")
    .select("*")
    .order("date", { ascending: false })
    .limit(100);

  // Try to get live session data from each connected gateway
  const gateways = new Map<string, { tunnel_url: string; api_token: string }>();
  const liveSessionsByAgent = new Map<string, { tokens: number; sessions: number; model: string; cost: number }>();

  for (const agent of storedAgents) {
    const gw = agent.gateways as Record<string, unknown> | null;
    if (gw?.tunnel_url && gw?.api_token && !gateways.has(gw.id as string)) {
      gateways.set(gw.id as string, { tunnel_url: gw.tunnel_url as string, api_token: gw.api_token as string });
    }
  }

  // Fetch live sessions from each gateway (once per gateway)
  for (const [gwId, { tunnel_url, api_token }] of gateways) {
    const sessionsData = await invokeGatewayTool(tunnel_url, api_token, "sessions_list", { limit: 100, messageLimit: 0 });
    const sessions = sessionsData?.sessions || [];
    
    for (const s of sessions) {
      const parts = ((s as Record<string, unknown>).key as string).split(":");
      const agentId = parts[1] || "main";
      const key = `${gwId}:${agentId}`;
      const existing = liveSessionsByAgent.get(key) || { tokens: 0, sessions: 0, model: "unknown", cost: 0 };
      existing.tokens += ((s as Record<string, unknown>).totalTokens as number) || 0;
      existing.sessions += 1;
      existing.model = ((s as Record<string, unknown>).model as string) || existing.model;
      existing.cost += ((s as Record<string, unknown>).estimatedCostUsd as number) || 0;
      liveSessionsByAgent.set(key, existing);
    }
  }

  return storedAgents.map((a) => {
    const gw = a.gateways as Record<string, unknown> | null;
    const gwId = gw?.id as string || "";
    const liveKey = `${gwId}:${a.agent_id}`;
    const live = liveSessionsByAgent.get(liveKey);
    
    // Get usage from snapshots
    const agentSnaps = (snapshots || []).filter(
      (s: Record<string, unknown>) => s.agent_id === a.agent_id
    );
    const latestSnap = agentSnaps[0] as Record<string, unknown> | undefined;
    const snapTokens = latestSnap 
      ? ((latestSnap.total_tokens_in as number) || 0) + ((latestSnap.total_tokens_out as number) || 0)
      : 0;

    const totalTokens = live?.tokens || snapTokens;
    
    return {
      id: a.agent_id,
      name: a.name || a.agent_id,
      model: live?.model || a.model || "unknown",
      workspace: a.workspace || "",
      status: (live ? "active" : a.status || "idle") as "active" | "idle" | "error",
      purpose: a.purpose || "",
      totalTokens,
      contextTokens: 1000000,
      contextUsed: totalTokens,
      sessionCount: live?.sessions || agentSnaps.length || 0,
      gatewayId: gwId,
      gatewayName: (gw?.name as string) || "",
      estimatedCost: live?.cost || 0,
    } as Agent;
  });
}

export async function getAgent(id: string): Promise<Agent | null> {
  const agents = await getAgents();
  return agents.find((a) => a.id === id) || null;
}

export async function getCronJobs(): Promise<CronJob[]> {
  return [];
}

export async function getWindowResetTime() {
  const WINDOW_MS = 5 * 60 * 60 * 1000;
  const now = new Date();
  const midnight = new Date(now);
  midnight.setUTCHours(0, 0, 0, 0);
  const windowsSinceMidnight = Math.floor((now.getTime() - midnight.getTime()) / WINDOW_MS);
  const windowStart = new Date(midnight.getTime() + windowsSinceMidnight * WINDOW_MS);
  return { resetAt: new Date(windowStart.getTime() + WINDOW_MS), windowHours: 5 };
}
