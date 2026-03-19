import type { Agent, Session, CronJob, GatewayConfig } from "./types";

const API_URL = process.env.OPENCLAW_API_URL || "http://127.0.0.1:18789";
const API_TOKEN = process.env.OPENCLAW_API_TOKEN || "";

async function gatewayFetch(path: string, options?: RequestInit) {
  const res = await fetch(`${API_URL}${path}`, {
    ...options,
    headers: {
      "Authorization": `Bearer ${API_TOKEN}`,
      "Content-Type": "application/json",
      ...options?.headers,
    },
    cache: "no-store",
  });
  if (!res.ok) throw new Error(`Gateway ${res.status}: ${await res.text()}`);
  return res.json();
}

// For now, read config from the filesystem since gateway API needs auth exploration
export async function getAgents(): Promise<Agent[]> {
  // Mock data based on the real openclaw.json config
  return [
    {
      id: "hansolo",
      name: "Han Solo",
      model: "claude-opus-4-6",
      workspace: "/Users/juninhojr/.openclaw/workspace-hansolo",
      status: "active",
      purpose: "Chief of Staff & Knowledge Manager — monitors all client comms, extracts intelligence, posts updates to Slack.",
      emoji: "🤙",
      totalTokens: 279045,
      contextTokens: 1000000,
      contextUsed: 244892,
      sessionCount: 78,
    },
    {
      id: "juninhojr",
      name: "Juninho Jr",
      model: "openrouter/auto",
      workspace: "/Users/juninhojr/.openclaw/workspace-juninhojr",
      status: "active",
      purpose: "PM & Team Lead — owns requirements, specs, task breakdown, QA/E2E testing, stakeholder communication.",
      emoji: "⚽",
      totalTokens: 185000,
      contextTokens: 200000,
      contextUsed: 120000,
      sessionCount: 42,
    },
    {
      id: "zezinho",
      name: "Zezinho",
      model: "claude-opus-4-6",
      workspace: "/Users/juninhojr/.openclaw/workspace-zezinho",
      status: "active",
      purpose: "PM & Tech Lead — owns features end-to-end: requirements → architecture → implementation → ship.",
      emoji: "🚀",
      totalTokens: 320000,
      contextTokens: 1000000,
      contextUsed: 180000,
      sessionCount: 55,
    },
    {
      id: "tinker",
      name: "Tinker",
      model: "openrouter/auto",
      workspace: "/Users/juninhojr/.openclaw/workspace-tinker",
      status: "idle",
      purpose: "Fullstack Developer — turns specs into working, deployed software. Vue 3, Laravel, Railway.",
      emoji: "🔧",
      totalTokens: 95000,
      contextTokens: 200000,
      contextUsed: 45000,
      sessionCount: 18,
    },
  ];
}

export async function getAgent(id: string): Promise<Agent | null> {
  const agents = await getAgents();
  return agents.find((a) => a.id === id) || null;
}

export async function getSessions(): Promise<Session[]> {
  return [];
}

export async function getCronJobs(): Promise<CronJob[]> {
  return [
    {
      id: "95da43b8",
      name: "sapira-email-ingester",
      agentId: "hansolo",
      enabled: true,
      schedule: { kind: "cron", expr: "0 8,14 * * 1-5", tz: "Europe/Madrid" },
      payload: { kind: "agentTurn", message: "Run ingesters" },
      state: { lastRunStatus: "ok", nextRunAtMs: Date.now() + 3600000 },
    },
    {
      id: "0e80320b",
      name: "sapira-brain-agent",
      agentId: "hansolo",
      enabled: true,
      schedule: { kind: "cron", expr: "30 8,14 * * 1-5", tz: "Europe/Madrid" },
      payload: { kind: "agentTurn", message: "Run triage" },
      state: { lastRunStatus: "ok", nextRunAtMs: Date.now() + 5400000 },
    },
    {
      id: "c46e876e",
      name: "sapira-summary-agent",
      agentId: "hansolo",
      enabled: true,
      schedule: { kind: "cron", expr: "0 9,15 * * 1-5", tz: "Europe/Madrid" },
      payload: { kind: "agentTurn", message: "Run summaries" },
      state: { lastRunStatus: "ok", nextRunAtMs: Date.now() + 7200000 },
    },
  ];
}
