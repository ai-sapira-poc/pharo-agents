import { getAgents, getCronJobs } from "@/lib/openclaw-client";
import Link from "next/link";

function fmt(n: number): string {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `${(n / 1_000).toFixed(0)}k`;
  return n.toString();
}

export default async function Dashboard() {
  const agents = await getAgents();
  const crons = await getCronJobs();
  const totalTokens = agents.reduce((s, a) => s + (a.totalTokens || 0), 0);
  const totalSessions = agents.reduce((s, a) => s + (a.sessionCount || 0), 0);
  const active = agents.filter((a) => a.status === "active").length;

  const stats = [
    { label: "Active Agents", value: active, sub: `of ${agents.length}`, color: "var(--success)" },
    { label: "Total Tokens", value: fmt(totalTokens), sub: "all sessions", color: "var(--accent)" },
    { label: "Sessions", value: totalSessions, sub: "active", color: "var(--warning)" },
    { label: "Cron Jobs", value: crons.filter((c) => c.enabled).length, sub: `of ${crons.length}`, color: "var(--accent)" },
  ];

  return (
    <div className="px-8 py-8 max-w-[1400px]">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-[22px] font-bold tracking-tight" style={{ color: 'var(--text-primary)' }}>
          Dashboard
        </h1>
        <p className="text-[13px] mt-1" style={{ color: 'var(--text-muted)' }}>
          Real-time overview of your AI agent fleet
        </p>
      </div>

      {/* Stats Row */}
      <div className="grid grid-cols-4 gap-3 mb-8">
        {stats.map((s) => (
          <div key={s.label} className="rounded-xl p-4 border transition-all duration-200"
            style={{ background: 'var(--bg-surface)', borderColor: 'var(--border-subtle)' }}>
            <p className="text-[11px] font-semibold uppercase tracking-wider" style={{ color: 'var(--text-muted)' }}>
              {s.label}
            </p>
            <div className="flex items-baseline gap-2 mt-2">
              <span className="text-[28px] font-extrabold tracking-tight" style={{ color: s.color }}>
                {s.value}
              </span>
              <span className="text-[11px] font-medium" style={{ color: 'var(--text-muted)' }}>
                {s.sub}
              </span>
            </div>
          </div>
        ))}
      </div>

      {/* Agents */}
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-[15px] font-semibold" style={{ color: 'var(--text-primary)' }}>
          Agents
        </h2>
        <span className="text-[11px] font-mono px-2 py-0.5 rounded"
          style={{ background: 'var(--bg-overlay)', color: 'var(--text-muted)' }}>
          {agents.length} registered
        </span>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
        {agents.map((agent) => {
          const pct = agent.contextTokens ? Math.round(((agent.contextUsed || 0) / agent.contextTokens) * 100) : 0;
          const barColor = pct > 80 ? 'var(--danger)' : pct > 50 ? 'var(--warning)' : 'var(--accent)';
          const statusColor = agent.status === "active" ? 'var(--success)' : agent.status === "idle" ? 'var(--warning)' : 'var(--danger)';
          const statusBg = agent.status === "active" ? 'var(--success-muted)' : agent.status === "idle" ? 'var(--warning-muted)' : 'var(--danger-muted)';

          return (
            <Link key={agent.id} href={`/agents/${agent.id}`}
              className="agent-card group block rounded-xl p-5 border"
              style={{ background: 'var(--bg-surface)', borderColor: 'var(--border-subtle)' }}
              
              >
              
              {/* Top row */}
              <div className="flex items-start justify-between mb-3">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl flex items-center justify-center text-xl"
                    style={{ background: 'var(--bg-overlay)' }}>
                    {agent.emoji || "🤖"}
                  </div>
                  <div>
                    <h3 className="text-[14px] font-semibold" style={{ color: 'var(--text-primary)' }}>
                      {agent.name || agent.id}
                    </h3>
                    <p className="text-[11px] font-mono" style={{ color: 'var(--text-muted)' }}>
                      {agent.model}
                    </p>
                  </div>
                </div>
                <span className="inline-flex items-center gap-1.5 text-[11px] font-semibold px-2 py-0.5 rounded-md"
                  style={{ background: statusBg, color: statusColor }}>
                  <span className="w-1.5 h-1.5 rounded-full" style={{ background: statusColor }}></span>
                  {agent.status}
                </span>
              </div>

              {/* Purpose */}
              <p className="text-[12.5px] leading-relaxed mb-4 line-clamp-2" style={{ color: 'var(--text-secondary)' }}>
                {agent.purpose}
              </p>

              {/* Metrics */}
              <div className="grid grid-cols-3 gap-4 mb-3">
                {[
                  { label: "Tokens", value: fmt(agent.totalTokens || 0) },
                  { label: "Sessions", value: String(agent.sessionCount || 0) },
                  { label: "Context", value: `${pct}%` },
                ].map((m) => (
                  <div key={m.label}>
                    <p className="text-[10px] font-semibold uppercase tracking-wider" style={{ color: 'var(--text-muted)' }}>
                      {m.label}
                    </p>
                    <p className="text-[14px] font-bold mt-0.5" style={{ color: 'var(--text-primary)' }}>
                      {m.value}
                    </p>
                  </div>
                ))}
              </div>

              {/* Context bar */}
              <div className="w-full rounded-full h-1" style={{ background: 'var(--bg-overlay)' }}>
                <div className="h-1 rounded-full transition-all duration-700 ease-out"
                  style={{ width: `${Math.min(pct, 100)}%`, background: barColor }} />
              </div>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
