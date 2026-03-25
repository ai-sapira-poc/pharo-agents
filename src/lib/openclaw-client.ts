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

async function invokeGatewayTool(tunnelUrl: string, apiToken: string, tool: string, args: Record<string, unknown> = {}) {
  const res = await fetch(`${tunnelUrl}/tools/invoke`, {
    method: "POST",
    headers: {
      "Authorization": `Bearer ${apiToken}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ tool, args }),
    cache: "no-store",
    signal: AbortSignal.timeout(15000),
  });
  const data = await res.json();
  if (!data.ok) return null;
  
  // Parse the text content if present
  const text = data.result?.content?.[0]?.text;
  if (text) {
    try { return JSON.parse(text); } catch { return data.result?.details || text; }
  }
  return data.result?.details || null;
}

export async function getGateways(): Promise<Gateway[]> {
  const { data } = await supabase
    .from("gateways")
    .select("*")
    .order("registered_at", { ascending: true });

  const oneHourAgo = new Date(Date.now() - 3600000).toISOString();
  return (data || []).map((gw: Record<string, unknown>) => ({
    ...gw,
    status: gw.tunnel_url 
      ? (gw.last_seen_at && (gw.last_seen_at as string) > oneHourAgo ? "online" : "offline")
      : gw.status === "pending" ? "pending" : "offline",
  })) as Gateway[];
}

export async function getGateway(id: string): Promise<Gateway | null> {
  const { data } = await supabase.from("gateways").select("*").eq("id", id).single();
  return data as Gateway | null;
}

export async function getAgents(): Promise<Agent[]> {
  const gateways = await getGateways();
  const allAgents: Agent[] = [];

  for (const gw of gateways) {
    if (!gw.tunnel_url || !gw.api_token) {
      // Fallback to stored data for gateways without tunnels
      const { data: stored } = await supabase
        .from("gateway_agents")
        .select("*")
        .eq("gateway_id", gw.id);
      
      for (const a of (stored || [])) {
        allAgents.push({
          id: a.agent_id,
          name: a.name || a.agent_id,
          model: a.model || "unknown",
          workspace: a.workspace || "",
          status: (a.status || "active") as "active" | "idle" | "error",
          purpose: a.purpose || "",
          totalTokens: 0,
          contextTokens: 1000000,
          contextUsed: 0,
          sessionCount: 0,
          gatewayId: gw.id,
          gatewayName: gw.name,
        });
      }
      continue;
    }

    // Fetch LIVE session data from the gateway
    try {
      const sessionsData = await invokeGatewayTool(
        gw.tunnel_url, gw.api_token,
        "sessions_list", { limit: 100, messageLimit: 0 }
      );

      const sessions = sessionsData?.sessions || [];
      
      // Group sessions by agent (extract agentId from session key)
      const agentMap = new Map<string, { tokens: number; context: number; contextMax: number; sessions: number; model: string; lastActive: number }>();
      
      for (const s of sessions) {
        // Session key format: agent:{agentId}:{channel}:...
        const parts = (s.key as string).split(":");
        const agentId = parts[1] || "main";
        
        const existing = agentMap.get(agentId) || { tokens: 0, context: 0, contextMax: 0, sessions: 0, model: "unknown", lastActive: 0 };
        existing.tokens += (s.totalTokens as number) || 0;
        existing.context += (s.totalTokens as number) || 0;
        existing.contextMax = Math.max(existing.contextMax, (s.contextTokens as number) || 0);
        existing.sessions += 1;
        existing.model = (s.model as string) || existing.model;
        existing.lastActive = Math.max(existing.lastActive, (s.updatedAt as number) || 0);
        agentMap.set(agentId, existing);
      }

      // Also get stored agent metadata for names/purposes
      const { data: stored } = await supabase
        .from("gateway_agents")
        .select("*")
        .eq("gateway_id", gw.id);
      
      const storedMap = new Map((stored || []).map((a: Record<string, unknown>) => [a.agent_id as string, a]));

      // Merge live data with stored metadata
      const agentIds = new Set([...agentMap.keys(), ...(stored || []).map((a: Record<string, unknown>) => a.agent_id as string)]);
      
      for (const agentId of agentIds) {
        if (agentId === "main") continue; // Skip default main agent
        const live = agentMap.get(agentId);
        const meta = storedMap.get(agentId) as Record<string, unknown> | undefined;
        
        allAgents.push({
          id: agentId,
          name: (meta?.name as string) || agentId,
          model: live?.model || (meta?.model as string) || "unknown",
          workspace: (meta?.workspace as string) || "",
          status: live ? "active" : "idle",
          purpose: (meta?.purpose as string) || "",
          totalTokens: live?.tokens || 0,
          contextTokens: live?.contextMax || 1000000,
          contextUsed: live?.context || 0,
          sessionCount: live?.sessions || 0,
          gatewayId: gw.id,
          gatewayName: gw.name,
        });
      }

      // Update gateway status
      await supabase.from("gateways").update({
        status: "online",
        last_seen_at: new Date().toISOString(),
        agent_count: agentIds.size - (agentIds.has("main") ? 1 : 0),
      }).eq("id", gw.id);

    } catch (err) {
      // Gateway unreachable — use stored data
      const { data: stored } = await supabase
        .from("gateway_agents")
        .select("*")
        .eq("gateway_id", gw.id);
      
      for (const a of (stored || [])) {
        allAgents.push({
          id: a.agent_id,
          name: a.name || a.agent_id,
          model: a.model || "unknown",
          workspace: a.workspace || "",
          status: "error",
          purpose: a.purpose || "",
          totalTokens: 0, contextTokens: 1000000, contextUsed: 0, sessionCount: 0,
          gatewayId: gw.id, gatewayName: gw.name,
        });
      }
    }
  }

  return allAgents;
}

export async function getAgent(id: string): Promise<Agent | null> {
  const agents = await getAgents();
  return agents.find((a) => a.id === id) || null;
}

export async function getCronJobs(): Promise<CronJob[]> {
  // TODO: fetch from gateways via tools/invoke cron list
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
