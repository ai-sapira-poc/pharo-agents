export type SkillCategory = "default" | "custom" | "project";

export interface SkillEntry {
  id: string;
  name: string;
  description: string;
  category: SkillCategory;
  agentId: string;
  agentName: string;
  path: string;
  content?: string;
}

// Default skills (OpenClaw built-in — available to all agents)
const DEFAULT_SKILLS: Omit<SkillEntry, "agentId" | "agentName">[] = [
  { id: "d-github", name: "github", description: "GitHub operations via gh CLI: issues, PRs, CI runs, code review", category: "default", path: "/opt/homebrew/lib/node_modules/openclaw/skills/github/SKILL.md" },
  { id: "d-gog", name: "gog", description: "Google Workspace CLI for Gmail, Calendar, Drive, Contacts, Sheets, Docs", category: "default", path: "/opt/homebrew/lib/node_modules/openclaw/skills/gog/SKILL.md" },
  { id: "d-slack", name: "slack", description: "Control Slack from OpenClaw via the slack tool", category: "default", path: "/opt/homebrew/lib/node_modules/openclaw/skills/slack/SKILL.md" },
  { id: "d-weather", name: "weather", description: "Get current weather and forecasts via wttr.in or Open-Meteo", category: "default", path: "/opt/homebrew/lib/node_modules/openclaw/skills/weather/SKILL.md" },
  { id: "d-summarize", name: "summarize", description: "Summarize or extract text/transcripts from URLs, podcasts, and local files", category: "default", path: "/opt/homebrew/lib/node_modules/openclaw/skills/summarize/SKILL.md" },
  { id: "d-coding-agent", name: "coding-agent", description: "Delegate coding tasks to Codex, Claude Code, or Pi agents via background process", category: "default", path: "/opt/homebrew/lib/node_modules/openclaw/skills/coding-agent/SKILL.md" },
  { id: "d-clawhub", name: "clawhub", description: "Search, install, update, and publish agent skills from clawhub.com", category: "default", path: "/opt/homebrew/lib/node_modules/openclaw/skills/clawhub/SKILL.md" },
  { id: "d-healthcheck", name: "healthcheck", description: "Host security hardening and risk-tolerance configuration", category: "default", path: "/opt/homebrew/lib/node_modules/openclaw/skills/healthcheck/SKILL.md" },
  { id: "d-nano-pdf", name: "nano-pdf", description: "Edit PDFs with natural-language instructions using the nano-pdf CLI", category: "default", path: "/opt/homebrew/lib/node_modules/openclaw/skills/nano-pdf/SKILL.md" },
  { id: "d-skill-creator", name: "skill-creator", description: "Create or update AgentSkills", category: "default", path: "/opt/homebrew/lib/node_modules/openclaw/skills/skill-creator/SKILL.md" },
  { id: "d-gh-issues", name: "gh-issues", description: "Fetch GitHub issues, spawn sub-agents to implement fixes and open PRs", category: "default", path: "/opt/homebrew/lib/node_modules/openclaw/skills/gh-issues/SKILL.md" },
];

// Agent-specific custom skills
const AGENT_SKILLS: Record<string, Omit<SkillEntry, "agentId" | "agentName">[]> = {
  hansolo: [
    { id: "h-dev", name: "dev", description: "Application development — SDD lifecycle, Git, GitHub, Playwright, Constitution pattern", category: "custom", path: "~/.openclaw/workspace-hansolo/skills/dev/SKILL.md" },
    { id: "h-brain-triage", name: "sapira-brain-triage", description: "Scan _inbox/ in Sapira Brain, classify files, route to correct client folders", category: "project", path: "~/Projects/sapira-brain/skills/sapira-brain-triage/SKILL.md" },
    { id: "h-brain-summary", name: "sapira-summary", description: "Per-client latest_update.md snapshots + Slack updates with team tags", category: "project", path: "~/Projects/sapira-brain/skills/sapira-summary/SKILL.md" },
  ],
  juninhojr: [
    { id: "j-dev", name: "dev-skill", description: "End-to-end development workflow — Plan → Specify → Execute → Test → Deploy", category: "custom", path: "~/.openclaw/workspace-juninhojr/skills/dev-skill/SKILL.md" },
    { id: "j-git", name: "git", description: "Version control essentials, workflows, branching, conflict resolution", category: "custom", path: "~/.openclaw/workspace-juninhojr/skills/git/SKILL.md" },
    { id: "j-playwright", name: "playwright", description: "Browser automation, E2E testing, web scraping", category: "custom", path: "~/.openclaw/workspace-juninhojr/skills/playwright/SKILL.md" },
    { id: "j-aeq", name: "aeq-speckit", description: "AEQ/CIMD project spec kit — SDD for AEQ platform", category: "project", path: "~/.openclaw/workspace-juninhojr/skills/aeq-speckit/SKILL.md" },
  ],
  zezinho: [
    { id: "z-dev", name: "dev-skill", description: "End-to-end development workflow — Plan → Specify → Execute → Test → Deploy", category: "custom", path: "~/.openclaw/workspace-zezinho/skills/dev-skill/SKILL.md" },
    { id: "z-git", name: "git", description: "Version control essentials, workflows, branching, conflict resolution", category: "custom", path: "~/.openclaw/workspace-zezinho/skills/git/SKILL.md" },
    { id: "z-playwright", name: "playwright", description: "Browser automation, E2E testing, web scraping", category: "custom", path: "~/.openclaw/workspace-zezinho/skills/playwright/SKILL.md" },
  ],
  tinker: [
    { id: "t-vue", name: "vue", description: "Vue 3 + TypeScript frontend development", category: "custom", path: "~/.openclaw/workspace-tinker/skills/vue/SKILL.md" },
    { id: "t-laravel", name: "laravel", description: "Laravel backend development", category: "custom", path: "~/.openclaw/workspace-tinker/skills/laravel/SKILL.md" },
    { id: "t-github", name: "github", description: "GitHub CLI operations for PRs, issues, CI", category: "custom", path: "~/.openclaw/workspace-tinker/skills/github/SKILL.md" },
    { id: "t-git", name: "git", description: "Version control essentials and workflows", category: "custom", path: "~/.openclaw/workspace-tinker/skills/git/SKILL.md" },
  ],
};

const AGENT_NAMES: Record<string, string> = {
  hansolo: "Han Solo",
  juninhojr: "Juninho Jr",
  zezinho: "Zezinho",
  tinker: "Tinker",
};

export function getAllSkills(): SkillEntry[] {
  const skills: SkillEntry[] = [];

  // Default skills (shared by all)
  for (const s of DEFAULT_SKILLS) {
    skills.push({ ...s, agentId: "all", agentName: "All agents" });
  }

  // Per-agent skills
  for (const [agentId, agentSkills] of Object.entries(AGENT_SKILLS)) {
    for (const s of agentSkills) {
      skills.push({ ...s, agentId, agentName: AGENT_NAMES[agentId] || agentId });
    }
  }

  return skills;
}

export function getSkillsForAgent(agentId: string): SkillEntry[] {
  const defaults = DEFAULT_SKILLS.map((s) => ({ ...s, agentId: "all", agentName: "All agents" }));
  const custom = (AGENT_SKILLS[agentId] || []).map((s) => ({ ...s, agentId, agentName: AGENT_NAMES[agentId] || agentId }));
  return [...custom, ...defaults];
}

export function getAgentIds() {
  return Object.keys(AGENT_SKILLS);
}

export function getAgentName(id: string) {
  return AGENT_NAMES[id] || id;
}
