import { getAgents, getCronJobs } from "@/lib/openclaw-client";

function formatTokens(n: number): string {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `${(n / 1_000).toFixed(0)}k`;
  return n.toString();
}

function timeAgo(ts?: number): string {
  if (!ts) return "—";
  const diff = Date.now() - ts;
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins}m ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h ago`;
  return `${Math.floor(hours / 24)}d ago`;
}

export default async function Dashboard() {
  const agents = await getAgents();
  const crons = await getCronJobs();
  
  const totalTokens = agents.reduce((sum, a) => sum + (a.totalTokens || 0), 0);
  const totalSessions = agents.reduce((sum, a) => sum + (a.sessionCount || 0), 0);
  const activeAgents = agents.filter((a) => a.status === "active").length;

  return (
    <div className="p-8">
      {/* Page Header */}
      <div className="mb-8">
        <h1 className="text-2xl font-bold">Dashboard</h1>
        <p className="text-muted-foreground text-sm mt-1">Overview of your AI agent fleet</p>
      </div>

      {/* Metrics Bar */}
      <div className="grid grid-cols-4 gap-4 mb-8">
        <div className="bg-card border border-border rounded-xl p-4">
          <p className="text-xs text-muted-foreground uppercase tracking-wider">Active Agents</p>
          <p className="text-3xl font-bold mt-1">{activeAgents}</p>
          <p className="text-xs text-muted-foreground mt-1">of {agents.length} total</p>
        </div>
        <div className="bg-card border border-border rounded-xl p-4">
          <p className="text-xs text-muted-foreground uppercase tracking-wider">Total Tokens</p>
          <p className="text-3xl font-bold mt-1">{formatTokens(totalTokens)}</p>
          <p className="text-xs text-muted-foreground mt-1">across all sessions</p>
        </div>
        <div className="bg-card border border-border rounded-xl p-4">
          <p className="text-xs text-muted-foreground uppercase tracking-wider">Sessions</p>
          <p className="text-3xl font-bold mt-1">{totalSessions}</p>
          <p className="text-xs text-muted-foreground mt-1">active conversations</p>
        </div>
        <div className="bg-card border border-border rounded-xl p-4">
          <p className="text-xs text-muted-foreground uppercase tracking-wider">Cron Jobs</p>
          <p className="text-3xl font-bold mt-1">{crons.filter((c) => c.enabled).length}</p>
          <p className="text-xs text-muted-foreground mt-1">of {crons.length} scheduled</p>
        </div>
      </div>

      {/* Agent Cards Grid */}
      <h2 className="text-lg font-semibold mb-4">Agents</h2>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {agents.map((agent) => {
          const contextPct = agent.contextTokens
            ? Math.round(((agent.contextUsed || 0) / agent.contextTokens) * 100)
            : 0;
          return (
            <a
              key={agent.id}
              href={`/agents/${agent.id}`}
              className="bg-card border border-border rounded-xl p-5 hover:border-primary/50 transition-colors group"
            >
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-3">
                  <span className="text-2xl">{agent.emoji || "🤖"}</span>
                  <div>
                    <h3 className="font-semibold group-hover:text-primary transition-colors">
                      {agent.name || agent.id}
                    </h3>
                    <p className="text-xs text-muted-foreground">{agent.model}</p>
                  </div>
                </div>
                <span
                  className={`inline-flex items-center gap-1.5 text-xs font-medium px-2 py-0.5 rounded-full ${
                    agent.status === "active"
                      ? "bg-green-500/10 text-green-500"
                      : agent.status === "idle"
                      ? "bg-yellow-500/10 text-yellow-500"
                      : "bg-red-500/10 text-red-500"
                  }`}
                >
                  <span className={`w-1.5 h-1.5 rounded-full ${
                    agent.status === "active" ? "bg-green-500" : agent.status === "idle" ? "bg-yellow-500" : "bg-red-500"
                  }`}></span>
                  {agent.status}
                </span>
              </div>

              <p className="text-sm text-muted-foreground mt-3 line-clamp-2">
                {agent.purpose || "No description available"}
              </p>

              <div className="mt-4 grid grid-cols-3 gap-4 text-xs">
                <div>
                  <p className="text-muted-foreground">Tokens</p>
                  <p className="font-medium">{formatTokens(agent.totalTokens || 0)}</p>
                </div>
                <div>
                  <p className="text-muted-foreground">Sessions</p>
                  <p className="font-medium">{agent.sessionCount || 0}</p>
                </div>
                <div>
                  <p className="text-muted-foreground">Context</p>
                  <p className="font-medium">{contextPct}%</p>
                </div>
              </div>

              {/* Context bar */}
              <div className="mt-3 w-full bg-muted rounded-full h-1.5">
                <div
                  className={`h-1.5 rounded-full transition-all ${
                    contextPct > 80 ? "bg-red-500" : contextPct > 50 ? "bg-yellow-500" : "bg-primary"
                  }`}
                  style={{ width: `${Math.min(contextPct, 100)}%` }}
                />
              </div>
            </a>
          );
        })}
      </div>
    </div>
  );
}
