import { getAgent, getCronJobs } from "@/lib/openclaw-client";
import { notFound } from "next/navigation";

function formatTokens(n: number): string {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `${(n / 1_000).toFixed(0)}k`;
  return n.toString();
}

export default async function AgentDetail({
  params,
}: {
  params: Promise<{ agentId: string }>;
}) {
  const { agentId } = await params;
  const agent = await getAgent(agentId);
  if (!agent) notFound();
  
  const allCrons = await getCronJobs();
  const agentCrons = allCrons.filter((c) => c.agentId === agent.id);
  
  const contextPct = agent.contextTokens
    ? Math.round(((agent.contextUsed || 0) / agent.contextTokens) * 100)
    : 0;

  return (
    <div className="p-8">
      {/* Back link + Header */}
      <div className="mb-6">
        <a href="/" className="text-sm text-muted-foreground hover:text-foreground transition-colors">
          ← Back to Dashboard
        </a>
      </div>
      
      <div className="flex items-center gap-4 mb-8">
        <span className="text-4xl">{agent.emoji || "🤖"}</span>
        <div>
          <h1 className="text-2xl font-bold">{agent.name || agent.id}</h1>
          <p className="text-sm text-muted-foreground">{agent.model}</p>
        </div>
        <span
          className={`ml-auto inline-flex items-center gap-1.5 text-xs font-medium px-3 py-1 rounded-full ${
            agent.status === "active"
              ? "bg-green-500/10 text-green-500"
              : agent.status === "idle"
              ? "bg-yellow-500/10 text-yellow-500"
              : "bg-red-500/10 text-red-500"
          }`}
        >
          <span className={`w-2 h-2 rounded-full ${
            agent.status === "active" ? "bg-green-500" : agent.status === "idle" ? "bg-yellow-500" : "bg-red-500"
          }`}></span>
          {agent.status}
        </span>
      </div>

      {/* Overview Cards */}
      <div className="grid grid-cols-4 gap-4 mb-8">
        <div className="bg-card border border-border rounded-xl p-4">
          <p className="text-xs text-muted-foreground uppercase tracking-wider">Total Tokens</p>
          <p className="text-2xl font-bold mt-1">{formatTokens(agent.totalTokens || 0)}</p>
        </div>
        <div className="bg-card border border-border rounded-xl p-4">
          <p className="text-xs text-muted-foreground uppercase tracking-wider">Context Usage</p>
          <p className="text-2xl font-bold mt-1">{contextPct}%</p>
          <div className="mt-2 w-full bg-muted rounded-full h-1.5">
            <div
              className={`h-1.5 rounded-full ${
                contextPct > 80 ? "bg-red-500" : contextPct > 50 ? "bg-yellow-500" : "bg-primary"
              }`}
              style={{ width: `${Math.min(contextPct, 100)}%` }}
            />
          </div>
        </div>
        <div className="bg-card border border-border rounded-xl p-4">
          <p className="text-xs text-muted-foreground uppercase tracking-wider">Sessions</p>
          <p className="text-2xl font-bold mt-1">{agent.sessionCount || 0}</p>
        </div>
        <div className="bg-card border border-border rounded-xl p-4">
          <p className="text-xs text-muted-foreground uppercase tracking-wider">Cron Jobs</p>
          <p className="text-2xl font-bold mt-1">{agentCrons.length}</p>
        </div>
      </div>

      {/* Purpose */}
      <section className="mb-8">
        <h2 className="text-lg font-semibold mb-3">Purpose</h2>
        <div className="bg-card border border-border rounded-xl p-5">
          <p className="text-sm leading-relaxed">{agent.purpose || "No description available"}</p>
        </div>
      </section>

      {/* Configuration */}
      <section className="mb-8">
        <h2 className="text-lg font-semibold mb-3">Configuration</h2>
        <div className="bg-card border border-border rounded-xl p-5 space-y-3">
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <p className="text-muted-foreground">Agent ID</p>
              <p className="font-mono">{agent.id}</p>
            </div>
            <div>
              <p className="text-muted-foreground">Model</p>
              <p className="font-mono">{agent.model}</p>
            </div>
            <div>
              <p className="text-muted-foreground">Workspace</p>
              <p className="font-mono text-xs truncate">{agent.workspace}</p>
            </div>
            <div>
              <p className="text-muted-foreground">Context Window</p>
              <p className="font-mono">{formatTokens(agent.contextTokens || 0)} tokens</p>
            </div>
          </div>
        </div>
      </section>

      {/* Cron Jobs */}
      {agentCrons.length > 0 && (
        <section className="mb-8">
          <h2 className="text-lg font-semibold mb-3">Scheduled Jobs</h2>
          <div className="bg-card border border-border rounded-xl overflow-hidden">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border bg-muted/50">
                  <th className="text-left p-3 font-medium text-muted-foreground">Name</th>
                  <th className="text-left p-3 font-medium text-muted-foreground">Schedule</th>
                  <th className="text-left p-3 font-medium text-muted-foreground">Status</th>
                  <th className="text-left p-3 font-medium text-muted-foreground">Enabled</th>
                </tr>
              </thead>
              <tbody>
                {agentCrons.map((cron) => (
                  <tr key={cron.id} className="border-b border-border last:border-0">
                    <td className="p-3 font-mono text-xs">{cron.name}</td>
                    <td className="p-3 font-mono text-xs">{cron.schedule.expr} ({cron.schedule.tz})</td>
                    <td className="p-3">
                      <span className={`inline-flex items-center gap-1 text-xs ${
                        cron.state?.lastRunStatus === "ok" ? "text-green-500" : "text-red-500"
                      }`}>
                        <span className={`w-1.5 h-1.5 rounded-full ${
                          cron.state?.lastRunStatus === "ok" ? "bg-green-500" : "bg-red-500"
                        }`}></span>
                        {cron.state?.lastRunStatus || "—"}
                      </span>
                    </td>
                    <td className="p-3">
                      <span className={`text-xs ${cron.enabled ? "text-green-500" : "text-muted-foreground"}`}>
                        {cron.enabled ? "Yes" : "No"}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      )}
    </div>
  );
}
