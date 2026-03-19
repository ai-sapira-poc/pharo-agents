# Pharo Agents — Product Requirements Document

**Version:** 1.0
**Date:** 2026-03-19
**Author:** Han Solo (Chief of Staff)
**Status:** Draft — awaiting stakeholder approval (Phase 4.5)

---

## 1. Purpose

Pharo Agents is a cloud-based management interface for monitoring, configuring, and operating Sapira's AI agent fleet running on the OpenClaw gateway. It gives the team a single pane of glass to understand what agents are doing, how much they're consuming, what skills they have, and how they're configured — without SSH-ing into a Mac mini.

---

## 2. Problem Statement

Today, managing Sapira's AI agents requires:
- SSH access to the host machine (Juninho's Mac mini)
- Reading raw JSON config files (`openclaw.json`)
- Using CLI commands (`openclaw status`, `openclaw cron list`)
- No visibility into token usage or context window pressure across agents
- No way for non-technical team members (Adolfo, Guillermo, Vinicius) to understand agent status

This is unsustainable as the agent fleet grows. Pharo Agents replaces CLI-based management with a clean web interface.

---

## 3. Target Users

| User | Needs |
|------|-------|
| **Jeremie** (admin) | Full control — monitor all agents, edit config, manage skills, view usage |
| **Adolfo / Guillermo / Vinicius** (viewers) | See agent status, understand what each agent does, view usage metrics |
| **Future clients** (read-only) | In later phases, clients could see their dedicated agent's status |

---

## 4. Scope

### In Scope (v1)
- **Dashboard**: overview of all agents with status, model, and key metrics
- **Agent Detail**: per-agent view with usage, context, sessions, and purpose
- **Skills Manager**: view and edit skills across all agents
- **Configuration**: view and edit agent config (model, bindings, channels, tools)
- **Authentication**: password-protected access (Vercel deployment, not public)

### Out of Scope (v1)
- Real-time streaming of agent conversations
- Direct interaction with agents (sending messages via the UI)
- Billing/cost tracking (future: integrate Anthropic usage API)
- Multi-gateway support (v1 targets a single OpenClaw instance)

---

## 5. Data Sources

### 5.1 OpenClaw Gateway API

The gateway runs on `127.0.0.1:18789` (local loopback). For Pharo Agents (deployed on Vercel) to reach it, we need one of:

**Option A — Tailscale Funnel** (recommended)
Enable Tailscale on the gateway, expose the API via a stable Tailscale hostname. The Vercel app calls the Tailscale URL with the gateway auth token. No public ports, encrypted E2E.

**Option B — Cloudflare Tunnel**
Similar to Tailscale but via Cloudflare. Less integrated with OpenClaw.

**Option C — SSH Tunnel / Reverse Proxy**
For development: `ssh -R` or ngrok to expose the local API temporarily.

The PRD assumes Option A (Tailscale) for production. For initial development, the app will work in local dev mode against `localhost:18789`.

### 5.2 Available API Data

From the gateway config and tools, we can extract:

| Data | Source | Method |
|------|--------|--------|
| Agent list + config | `openclaw.json` | `gateway.config.get` → `agents.list` |
| Agent bindings (which channels) | `openclaw.json` | `gateway.config.get` → `bindings` |
| Session list + token usage | Gateway API | `sessions_list` equivalent |
| Session history | Gateway API | Per-session token counts, last activity |
| Cron jobs | Gateway API | `cron.list` |
| Skills (SKILL.md files) | Agent workspace filesystem | Read from `{agentDir}/skills/` or `{workspace}/skills/` |
| SOUL.md / AGENTS.md / TOOLS.md | Agent workspace filesystem | Read from `{workspace}/` |
| Gateway status | OpenClaw CLI | `openclaw status` |

### 5.3 API Proxy Architecture

```
[Vercel App (Next.js)]
        │
        │ HTTPS (Tailscale / tunnel)
        ▼
[OpenClaw Gateway API :18789]
        │
        ├── config.get → agent list, bindings, channels
        ├── sessions → token usage, activity
        ├── cron → scheduled jobs
        └── filesystem → skills, workspace files
```

The Next.js backend (API routes) acts as a proxy, adding the gateway auth token server-side. The frontend never holds the gateway token.

---

## 6. Features

### 6.1 Dashboard (Home)

**Purpose:** At-a-glance overview of the entire agent fleet.

**Layout:** Grid of agent cards using `@sapira/ui` `MetricsCard` + `StatusBadge` components.

**Each agent card shows:**
- Agent name + emoji/avatar
- Status badge: Active ✅ / Idle ⏸ / Error ❌
- Current model (e.g. `claude-opus-4-6`)
- Last active: relative time ("5 minutes ago")
- Context usage: progress bar showing tokens used / context window size (e.g. 245k / 1M)
- Session count: number of active sessions
- Purpose: one-line description from SOUL.md

**Top-level metrics bar** (using `StatCard` components):
- Total active agents
- Total tokens consumed (last 24h)
- Total active sessions
- Cron jobs running / scheduled

**Filters:**
- Filter by status (active / idle / all)
- Search by agent name

### 6.2 Agent Detail Page

**URL:** `/agents/[agentId]`

**Sections (tabs or scrollable):**

#### 6.2.1 Overview Tab
- Full agent card (name, model, status, identity from SOUL.md)
- Purpose statement (from SOUL.md)
- Host and workspace path
- Channel bindings (which Slack/Telegram accounts, which channels)
- Last 5 sessions with: session key, last activity time, token count

#### 6.2.2 Usage Tab
- **Token consumption chart** (line chart, last 7 days) — using `@sapira/ui` `LineChart`
- **Context window gauge** — current context usage as percentage with visual indicator
- **Session breakdown table** — per-session: session key, channel, total tokens, last message time
- **Cron job table** — scheduled jobs for this agent: name, schedule, last run status, next run time

#### 6.2.3 Skills Tab
- List of all skills installed for this agent
- Each skill shows: name, description (from SKILL.md first line), file path
- Click to expand: full SKILL.md content rendered as markdown
- **Edit button**: opens inline editor to modify SKILL.md content (saves to filesystem)
- **Add Skill**: upload or create a new SKILL.md in the agent's workspace

#### 6.2.4 Configuration Tab
- Agent config as editable form fields:
  - Model (dropdown: available models from `agents.defaults.models`)
  - Workspace path (read-only)
  - Tools config (fs.workspaceOnly toggle)
  - Subagents config (allowAgents list)
  - Heartbeat interval
- Channel bindings editor:
  - List of current bindings (channel + accountId)
  - Add / remove bindings
- **Save** button: writes changes to `openclaw.json` via `gateway.config.patch` and triggers restart

### 6.3 Skills Manager (Global)

**URL:** `/skills`

**Purpose:** Cross-agent view of all installed skills.

**Layout:**
- Table with columns: Skill Name | Agent | Description | Last Modified | Actions
- Filter by agent
- Search by skill name or content
- Click any skill to view/edit its SKILL.md
- **Bulk actions**: copy a skill from one agent to another

### 6.4 Configuration (Global)

**URL:** `/settings`

**Sections:**

#### 6.4.1 Gateway Overview
- Gateway version, host, port, bind mode
- Auth mode
- Tailscale status
- Available models (from `agents.defaults.models`)
- ACP configuration

#### 6.4.2 Agents Configuration
- Editable list of all agents with their full config
- Add new agent form
- Remove agent (with confirmation dialog)

#### 6.4.3 Channel Bindings
- Visual map: which agent responds to which channel + account
- Drag-and-drop reordering (binding priority)
- Add / edit / remove bindings

#### 6.4.4 Cron Jobs
- List all cron jobs across all agents
- Per job: name, schedule expression (human-readable), last run status + time, next run time
- Enable/disable toggle
- Run now button
- Edit schedule / payload

---

## 7. Technical Architecture

### 7.1 Tech Stack

| Layer | Technology |
|-------|-----------|
| Framework | Next.js 15 (App Router) |
| Language | TypeScript |
| UI Library | `@sapira/ui` (Sapira Design System) |
| Styling | Tailwind CSS (via `@sapira/ui` tokens) |
| State Management | React Server Components + `use` hooks; client state via `zustand` if needed |
| API Layer | Next.js API Routes (server-side proxy to OpenClaw gateway) |
| Authentication | NextAuth.js with credentials provider (simple password for v1) |
| Deployment | Vercel (Sapira account) |
| Package Manager | pnpm |

### 7.2 Project Structure

```
pharo-agents/
├── PRD.md                    ← this document
├── CONSTITUTION.md           ← non-negotiable principles
├── PROGRESS.md               ← build progress tracker
├── package.json
├── pnpm-lock.yaml
├── next.config.ts
├── tailwind.config.ts
├── tsconfig.json
├── .env.local                ← OPENCLAW_API_URL + OPENCLAW_API_TOKEN + AUTH_SECRET
├── src/
│   ├── app/
│   │   ├── layout.tsx        ← AppShell with Sidebar
│   │   ├── page.tsx          ← Dashboard (home)
│   │   ├── agents/
│   │   │   ├── page.tsx      ← Agent list (redirects to dashboard)
│   │   │   └── [agentId]/
│   │   │       └── page.tsx  ← Agent detail (tabbed)
│   │   ├── skills/
│   │   │   └── page.tsx      ← Global skills manager
│   │   ├── settings/
│   │   │   └── page.tsx      ← Global configuration
│   │   └── api/
│   │       └── openclaw/
│   │           └── [...path]/
│   │               └── route.ts  ← Proxy to OpenClaw gateway
│   ├── lib/
│   │   ├── openclaw-client.ts    ← Server-side OpenClaw API client
│   │   ├── types.ts              ← TypeScript types for agent, session, cron, etc.
│   │   └── utils.ts              ← Formatters, helpers
│   └── components/
│       ├── agent-card.tsx
│       ├── agent-detail/
│       │   ├── overview-tab.tsx
│       │   ├── usage-tab.tsx
│       │   ├── skills-tab.tsx
│       │   └── config-tab.tsx
│       ├── skill-editor.tsx
│       ├── cron-table.tsx
│       ├── metrics-bar.tsx
│       └── binding-editor.tsx
└── public/
    └── favicon.ico
```

### 7.3 Environment Variables

| Variable | Purpose | Example |
|----------|---------|---------|
| `OPENCLAW_API_URL` | Gateway URL (Tailscale or localhost) | `https://macmini.tail1234.ts.net:18789` |
| `OPENCLAW_API_TOKEN` | Gateway auth token | `oc_...` |
| `AUTH_SECRET` | NextAuth.js secret | random 32-char string |
| `AUTH_PASSWORD` | Simple password for v1 login | `sapira2026` |

### 7.4 API Proxy Design

All OpenClaw gateway communication goes through the Next.js API route `/api/openclaw/[...path]`:

```typescript
// src/app/api/openclaw/[...path]/route.ts
export async function GET(req: Request, { params }: { params: { path: string[] } }) {
  const url = `${process.env.OPENCLAW_API_URL}/${params.path.join('/')}`;
  const res = await fetch(url, {
    headers: { 'Authorization': `Bearer ${process.env.OPENCLAW_API_TOKEN}` },
  });
  return Response.json(await res.json());
}
```

This keeps the gateway token server-side and allows Vercel's edge network to cache responses where appropriate.

---

## 8. Design System Usage

All UI components come from `@sapira/ui`. Key component mapping:

| Feature | Components |
|---------|-----------|
| Page layout | `AppShell`, `Sidebar`, `Header`, `PageHeader` |
| Agent cards | `MetricsCard`, `StatusBadge`, `Avatar`, `Badge` |
| Charts | `LineChart`, `BarChart`, `SparkLine` |
| Tables | `DataTable` with sorting/filtering |
| Forms | `Input`, `Select`, `Switch`, `Tabs` |
| Modals | `Dialog`, `ConfirmDialog`, `Sheet` |
| Feedback | `Toast` (via `useToast()`), `Spinner`, `Skeleton` |
| Navigation | `Sidebar` with `ExpandableTabs`, `Breadcrumbs` |
| Skills | `DrawerPanel` for skill editor, `Tabs` for agent detail |

Theme: Sapira blue brand (`210 100% 50%`), dark mode support via `ThemeProvider`.

---

## 9. Acceptance Criteria

### 9.1 Dashboard
- [ ] Page loads within 2 seconds showing all registered agents
- [ ] Each agent card shows: name, status, model, last active time, context usage bar
- [ ] Top metrics bar shows: total agents, total tokens (24h), active sessions, cron jobs
- [ ] Clicking an agent card navigates to `/agents/[agentId]`

### 9.2 Agent Detail
- [ ] Overview tab displays agent identity, purpose, bindings, and recent sessions
- [ ] Usage tab displays token consumption chart (last 7 days) and session breakdown table
- [ ] Skills tab lists all skills with expandable SKILL.md content
- [ ] Skills can be edited inline and saved back to the agent's workspace
- [ ] Configuration tab shows editable agent config; Save triggers gateway restart

### 9.3 Skills Manager
- [ ] Lists all skills across all agents in a single table
- [ ] Search and filter by agent or skill name
- [ ] Click opens skill content; edit and save works
- [ ] Copy skill from one agent to another

### 9.4 Configuration
- [ ] Gateway overview section shows version, host, models, ACP config
- [ ] Agent configuration is editable; changes persist to `openclaw.json`
- [ ] Channel bindings are visualised and editable
- [ ] Cron jobs are listed with enable/disable toggle and "run now" button

### 9.5 Non-Functional
- [ ] Deployed on Vercel (Sapira account)
- [ ] Responsive design (works on tablet + desktop; mobile is bonus)
- [ ] Authentication required (simple password for v1)
- [ ] Gateway token never exposed to client-side JavaScript
- [ ] Uses `@sapira/ui` components exclusively (no custom UI primitives)

---

## 10. Out of Scope / Future Phases

| Feature | Phase |
|---------|-------|
| Real-time agent conversation streaming | v2 |
| Send messages to agents via UI | v2 |
| Anthropic billing/cost dashboard | v2 |
| Multi-gateway support | v2 |
| Client-facing agent view (per-client isolation) | v3 |
| Marketplace for skills (install from catalog) | v3 |
| Agent creation wizard (scaffold from template) | v2 |
| Mobile-optimised layout | v2 |

---

## 11. Open Questions

1. **Tailscale vs. Cloudflare Tunnel** — which does Jeremie prefer for exposing the gateway? Tailscale is already configured (currently `mode: off`).
2. **Vercel team** — do we have a Sapira Vercel team account, or deploy under a personal account?
3. **Auth upgrade path** — v1 uses a simple password. Should v2 use Entra ID SSO (consistent with the rest of the Sapira platform)?
4. **Token usage data** — OpenClaw's `session_status` gives per-session token counts. For historical charts, we may need to poll and store data in a lightweight DB (Vercel KV or Supabase). Is that acceptable for v1, or should charts be deferred?

---

## 12. Constitution

See `CONSTITUTION.md` (to be created alongside this PRD).

Non-negotiable principles:
- All UI from `@sapira/ui` — no custom primitives
- Gateway token stays server-side — never in client bundle
- TypeScript strict mode — no `any` types
- All API calls via the proxy route — frontend never calls gateway directly
- No secrets in code — everything via `.env.local`
- Responsive by default — min viewport: 768px (tablet)

---

*Prepared by Han Solo · Pharo Agents v1 · March 2026*
