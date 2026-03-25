import type { Agent, CronJob } from "./types";
import { supabase } from "./supabase";

export interface Gateway {
  id: string;
  name: string;
  tunnel_url: string | null;
  machine_host: string | null;
  machine_os: string | null;
  openclaw_version: string | null;
  agent_count: number;
  status: "pending" | "online" | "offline";
  last_seen_at: string | null;
  registered_at: string;
}

export async function getGateways(): Promise<Gateway[]> {
  const { data } = await supabase
    .from("gateways")
    .select("*")
    .order("registered_at", { ascending: true });

  // Mark gateways as offline if no heartbeat in 1 hour
  const oneHourAgo = new Date(Date.now() - 3600000).toISOString();
  return (data || []).map((gw: Record<string, unknown>) => ({
    ...gw,
    status: gw.last_seen_at && (gw.last_seen_at as string) > oneHourAgo ? "online" : gw.status === "pending" ? "pending" : "offline",
  })) as Gateway[];
}

export async function getGateway(id: string): Promise<Gateway | null> {
  const { data } = await supabase.from("gateways").select("*").eq("id", id).single();
  return data as Gateway | null;
}

export async function getAgents(gatewayId?: string): Promise<Agent[]> {
  let query = supabase.from("gateway_agents").select("*, gateways(name)").order("name");
  if (gatewayId) query = query.eq("gateway_id", gatewayId);

  const { data } = await query;

  if (!data || data.length === 0) {
    // Fallback to static config for backwards compat
    return getStaticAgents();
  }

  // Enrich with usage data
  const { data: snapshots } = await supabase
    .from("daily_usage_snapshots")
    .select("*")
    .order("date", { ascending: false })
    .limit(50);

  return (data as Record<string, unknown>[]).map((a) => {
    const agentSnaps = (snapshots || []).filter(
      (s: Record<string, unknown>) => s.agent_id === a.agent_id
    );
    const latest = agentSnaps[0] as Record<string, unknown> | undefined;
    const totalTokens = latest
      ? (latest.total_tokens_in as number) + (latest.total_tokens_out as number)
      : 0;

    return {
      id: a.agent_id as string,
      name: (a.name || a.agent_id) as string,
      model: (a.model || "unknown") as string,
      workspace: (a.workspace || "") as string,
      status: (a.status || "active") as "active" | "idle" | "error",
      purpose: (a.purpose || "") as string,
      totalTokens,
      contextTokens: 1000000,
      contextUsed: totalTokens,
      sessionCount: agentSnaps.length,
      gatewayId: a.gateway_id as string,
      gatewayName: ((a as Record<string, unknown>).gateways as Record<string, unknown>)?.name as string || "",
    };
  });
}

export async function getAgent(id: string): Promise<Agent | null> {
  const agents = await getAgents();
  return agents.find((a) => a.id === id) || null;
}

export async function getCronJobs(): Promise<CronJob[]> {
  // Static for now — will be dynamic once gateway API proxy works
  return [
    {
      id: "95da43b8", name: "sapira-email-ingester", agentId: "hansolo", enabled: true,
      schedule: { kind: "cron", expr: "0 8,14 * * 1-5", tz: "Europe/Madrid" },
      payload: { kind: "agentTurn" },
      state: { lastRunStatus: "ok", nextRunAtMs: Date.now() + 3600000 },
    },
  ];
}

export async function getWindowResetTime() {
  const WINDOW_MS = 5 * 60 * 60 * 1000;
  const { data: lastLimit } = await supabase
    .from("rate_limit_events")
    .select("recorded_at")
    .order("recorded_at", { ascending: false })
    .limit(1);

  let windowStart: Date;
  if (lastLimit && lastLimit.length > 0) {
    windowStart = new Date(lastLimit[0].recorded_at as string);
  } else {
    const now = new Date();
    const midnight = new Date(now);
    midnight.setUTCHours(0, 0, 0, 0);
    const windowsSinceMidnight = Math.floor((now.getTime() - midnight.getTime()) / WINDOW_MS);
    windowStart = new Date(midnight.getTime() + windowsSinceMidnight * WINDOW_MS);
  }

  return { resetAt: new Date(windowStart.getTime() + WINDOW_MS), windowHours: 5 };
}

// Fallback static agents (used when no gateways registered)
function getStaticAgents(): Agent[] {
  return [
    { id: "hansolo", name: "Han Solo", model: "claude-opus-4-6", workspace: "", status: "active", purpose: "Chief of Staff & Knowledge Manager", totalTokens: 0, contextTokens: 1000000, contextUsed: 0, sessionCount: 0 },
    { id: "juninhojr", name: "Juninho Jr", model: "claude-opus-4-6", workspace: "", status: "active", purpose: "PM & Team Lead", totalTokens: 0, contextTokens: 1000000, contextUsed: 0, sessionCount: 0 },
    { id: "zezinho", name: "Zezinho", model: "claude-opus-4-6", workspace: "", status: "active", purpose: "PM & Tech Lead", totalTokens: 0, contextTokens: 1000000, contextUsed: 0, sessionCount: 0 },
    { id: "tinker", name: "Tinker", model: "openrouter/auto", workspace: "", status: "idle", purpose: "Fullstack Developer", totalTokens: 0, contextTokens: 200000, contextUsed: 0, sessionCount: 0 },
  ];
}
