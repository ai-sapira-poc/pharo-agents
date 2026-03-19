import type { Agent, CronJob } from "./types";
import { supabase } from "./supabase";

// Agent config — static for now (will be dynamic once Cloudflare Tunnel is live)
const AGENT_CONFIG: Omit<Agent, "totalTokens" | "contextUsed" | "sessionCount">[] = [
  {
    id: "hansolo", name: "Han Solo", model: "claude-opus-4-6",
    workspace: "/Users/juninhojr/.openclaw/workspace-hansolo",
    status: "active", emoji: "🤙", contextTokens: 1000000,
    purpose: "Chief of Staff & Knowledge Manager — monitors all client comms, extracts intelligence, posts updates to Slack.",
  },
  {
    id: "juninhojr", name: "Juninho Jr", model: "claude-opus-4-6",
    workspace: "/Users/juninhojr/.openclaw/workspace-juninhojr",
    status: "active", emoji: "⚽", contextTokens: 1000000,
    purpose: "PM & Team Lead — owns requirements, specs, task breakdown, QA/E2E testing, stakeholder communication.",
  },
  {
    id: "zezinho", name: "Zezinho", model: "claude-opus-4-6",
    workspace: "/Users/juninhojr/.openclaw/workspace-zezinho",
    status: "active", emoji: "🚀", contextTokens: 1000000,
    purpose: "PM & Tech Lead — owns features end-to-end: requirements → architecture → implementation → ship.",
  },
  {
    id: "tinker", name: "Tinker", model: "openrouter/auto",
    workspace: "/Users/juninhojr/.openclaw/workspace-tinker",
    status: "idle", emoji: "🔧", contextTokens: 200000,
    purpose: "Fullstack Developer — turns specs into working, deployed software. Vue 3, Laravel, Railway.",
  },
];

// 5-hour window in ms
const WINDOW_MS = 5 * 60 * 60 * 1000;

export async function getAgents(): Promise<Agent[]> {
  // Get latest daily snapshots from Supabase
  const { data: snapshots } = await supabase
    .from("daily_usage_snapshots")
    .select("*")
    .order("date", { ascending: false })
    .limit(20);

  // Get ceiling estimates
  const { data: ceilings } = await supabase
    .from("usage_ceilings")
    .select("*");

  const ceilingMap = new Map(
    (ceilings || []).map((c: Record<string, unknown>) => [c.model as string, c.estimated_max_tokens_per_5h as number])
  );

  return AGENT_CONFIG.map((agent) => {
    const agentSnaps = (snapshots || []).filter(
      (s: Record<string, unknown>) => s.agent_id === agent.id
    );
    const latest = agentSnaps[0];
    const totalTokens = latest
      ? (latest.total_tokens_in as number) + (latest.total_tokens_out as number)
      : 0;
    const ceiling = ceilingMap.get(agent.model) || agent.contextTokens || 1000000;

    return {
      ...agent,
      totalTokens,
      contextUsed: totalTokens,
      contextTokens: ceiling,
      sessionCount: agentSnaps.length,
    };
  });
}

export async function getAgent(id: string): Promise<Agent | null> {
  const agents = await getAgents();
  return agents.find((a) => a.id === id) || null;
}

export async function getCronJobs(): Promise<CronJob[]> {
  return [
    {
      id: "95da43b8", name: "sapira-email-ingester", agentId: "hansolo", enabled: true,
      schedule: { kind: "cron", expr: "0 8,14 * * 1-5", tz: "Europe/Madrid" },
      payload: { kind: "agentTurn" },
      state: { lastRunStatus: "ok", nextRunAtMs: Date.now() + 3600000 },
    },
    {
      id: "0e80320b", name: "sapira-brain-agent", agentId: "hansolo", enabled: true,
      schedule: { kind: "cron", expr: "30 8,14 * * 1-5", tz: "Europe/Madrid" },
      payload: { kind: "agentTurn" },
      state: { lastRunStatus: "ok", nextRunAtMs: Date.now() + 5400000 },
    },
    {
      id: "c46e876e", name: "sapira-summary-agent", agentId: "hansolo", enabled: true,
      schedule: { kind: "cron", expr: "0 9,15 * * 1-5", tz: "Europe/Madrid" },
      payload: { kind: "agentTurn" },
      state: { lastRunStatus: "ok", nextRunAtMs: Date.now() + 7200000 },
    },
    {
      id: "1597385e", name: "sapira-weekly-digest", agentId: "hansolo", enabled: true,
      schedule: { kind: "cron", expr: "0 8 * * 5", tz: "Europe/Madrid" },
      payload: { kind: "agentTurn" },
      state: { lastRunStatus: "ok", nextRunAtMs: Date.now() + 86400000 },
    },
  ];
}

export async function getUsageHistory(agentId?: string) {
  let query = supabase
    .from("daily_usage_snapshots")
    .select("*")
    .order("date", { ascending: false })
    .limit(30);

  if (agentId) {
    query = query.eq("agent_id", agentId);
  }

  const { data } = await query;
  return data || [];
}

export async function getWindowResetTime(): Promise<{ resetAt: Date; windowHours: number }> {
  // The usage window resets every 5 hours
  // We estimate the window start from the last rate limit event or the last known reset
  const { data: lastLimit } = await supabase
    .from("rate_limit_events")
    .select("recorded_at")
    .order("recorded_at", { ascending: false })
    .limit(1);

  const windowHours = 5;
  let windowStart: Date;

  if (lastLimit && lastLimit.length > 0) {
    windowStart = new Date(lastLimit[0].recorded_at as string);
  } else {
    // No rate limit seen yet — estimate based on 5h windows from midnight UTC
    const now = new Date();
    const midnight = new Date(now);
    midnight.setUTCHours(0, 0, 0, 0);
    const msSinceMidnight = now.getTime() - midnight.getTime();
    const windowsSinceMidnight = Math.floor(msSinceMidnight / WINDOW_MS);
    windowStart = new Date(midnight.getTime() + windowsSinceMidnight * WINDOW_MS);
  }

  const resetAt = new Date(windowStart.getTime() + WINDOW_MS);
  return { resetAt, windowHours };
}
