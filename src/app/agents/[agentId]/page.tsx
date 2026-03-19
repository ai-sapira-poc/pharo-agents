import { getAgent, getCronJobs } from "@/lib/openclaw-client";
import { notFound } from "next/navigation";
import Link from "next/link";

function fmt(n: number): string {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `${(n / 1_000).toFixed(0)}k`;
  return n.toString();
}

export default async function AgentDetail({ params }: { params: Promise<{ agentId: string }> }) {
  const { agentId } = await params;
  const agent = await getAgent(agentId);
  if (!agent) notFound();
  const agentCrons = (await getCronJobs()).filter((c) => c.agentId === agent.id);
  const pct = agent.contextTokens ? Math.round(((agent.contextUsed || 0) / agent.contextTokens) * 100) : 0;
  const barColor = pct > 80 ? 'var(--danger)' : pct > 50 ? 'var(--warning)' : 'var(--accent)';

  const metrics = [
    { label: "Total Tokens", value: fmt(agent.totalTokens || 0), color: "var(--accent)" },
    { label: "Context", value: `${pct}%`, color: barColor },
    { label: "Sessions", value: String(agent.sessionCount || 0), color: "var(--warning)" },
    { label: "Cron Jobs", value: String(agentCrons.length), color: "var(--accent)" },
  ];

  return (
    <div className="px-8 py-8 max-w-[1200px]">
      {/* Back */}
      <Link href="/" className="inline-flex items-center gap-1.5 text-[12px] font-medium mb-6 transition-colors"
        style={{ color: 'var(--text-muted)' }}>
        ← Dashboard
      </Link>

      {/* Header */}
      <div className="flex items-center gap-4 mb-8">
        <div className="w-14 h-14 rounded-2xl flex items-center justify-center text-2xl"
          style={{ background: 'var(--bg-overlay)' }}>
          {agent.emoji || "🤖"}
        </div>
        <div className="flex-1">
          <h1 className="text-[24px] font-bold tracking-tight">{agent.name || agent.id}</h1>
          <p className="text-[12px] font-mono mt-0.5" style={{ color: 'var(--text-muted)' }}>{agent.model}</p>
        </div>
        <span className="inline-flex items-center gap-1.5 text-[11px] font-semibold px-3 py-1 rounded-lg"
          style={{
            background: agent.status === "active" ? 'var(--success-muted)' : 'var(--warning-muted)',
            color: agent.status === "active" ? 'var(--success)' : 'var(--warning)',
          }}>
          <span className="w-2 h-2 rounded-full"
            style={{ background: agent.status === "active" ? 'var(--success)' : 'var(--warning)' }}></span>
          {agent.status}
        </span>
      </div>

      {/* Metrics */}
      <div className="grid grid-cols-4 gap-3 mb-8">
        {metrics.map((m) => (
          <div key={m.label} className="rounded-xl p-4 border"
            style={{ background: 'var(--bg-surface)', borderColor: 'var(--border-subtle)' }}>
            <p className="text-[10px] font-semibold uppercase tracking-wider" style={{ color: 'var(--text-muted)' }}>
              {m.label}
            </p>
            <p className="text-[24px] font-extrabold mt-1 tracking-tight" style={{ color: m.color }}>
              {m.value}
            </p>
          </div>
        ))}
      </div>

      {/* Context Usage Bar */}
      <div className="rounded-xl p-5 border mb-8" style={{ background: 'var(--bg-surface)', borderColor: 'var(--border-subtle)' }}>
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-[13px] font-semibold">Context Window</h3>
          <span className="text-[11px] font-mono" style={{ color: 'var(--text-muted)' }}>
            {fmt(agent.contextUsed || 0)} / {fmt(agent.contextTokens || 0)} tokens
          </span>
        </div>
        <div className="w-full rounded-full h-2" style={{ background: 'var(--bg-overlay)' }}>
          <div className="h-2 rounded-full transition-all duration-1000 ease-out"
            style={{ width: `${Math.min(pct, 100)}%`, background: `linear-gradient(90deg, var(--accent), ${barColor})` }} />
        </div>
      </div>

      {/* Purpose */}
      <div className="rounded-xl p-5 border mb-8" style={{ background: 'var(--bg-surface)', borderColor: 'var(--border-subtle)' }}>
        <h3 className="text-[13px] font-semibold mb-2">Purpose</h3>
        <p className="text-[13px] leading-relaxed" style={{ color: 'var(--text-secondary)' }}>
          {agent.purpose || "No description available"}
        </p>
      </div>

      {/* Configuration */}
      <div className="rounded-xl border mb-8 overflow-hidden" style={{ background: 'var(--bg-surface)', borderColor: 'var(--border-subtle)' }}>
        <div className="px-5 py-3 border-b" style={{ borderColor: 'var(--border-subtle)' }}>
          <h3 className="text-[13px] font-semibold">Configuration</h3>
        </div>
        <div className="divide-y" style={{ borderColor: 'var(--border-subtle)' }}>
          {[
            ["Agent ID", agent.id],
            ["Model", agent.model],
            ["Workspace", agent.workspace],
            ["Context Window", `${fmt(agent.contextTokens || 0)} tokens`],
          ].map(([label, value]) => (
            <div key={label} className="px-5 py-3 flex items-center justify-between"
              style={{ borderColor: 'var(--border-subtle)' }}>
              <span className="text-[12px] font-medium" style={{ color: 'var(--text-muted)' }}>{label}</span>
              <span className="text-[12px] font-mono" style={{ color: 'var(--text-primary)' }}>{value}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Cron Jobs */}
      {agentCrons.length > 0 && (
        <div className="rounded-xl border overflow-hidden" style={{ background: 'var(--bg-surface)', borderColor: 'var(--border-subtle)' }}>
          <div className="px-5 py-3 border-b" style={{ borderColor: 'var(--border-subtle)' }}>
            <h3 className="text-[13px] font-semibold">Scheduled Jobs</h3>
          </div>
          <table className="w-full text-[12px]">
            <thead>
              <tr style={{ borderBottom: '1px solid var(--border-subtle)' }}>
                {["Name", "Schedule", "Status", "Enabled"].map((h) => (
                  <th key={h} className="text-left px-5 py-2.5 font-semibold uppercase tracking-wider"
                    style={{ color: 'var(--text-muted)', fontSize: '10px', background: 'var(--bg-raised)' }}>
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {agentCrons.map((cron) => (
                <tr key={cron.id} style={{ borderBottom: '1px solid var(--border-subtle)' }}>
                  <td className="px-5 py-3 font-mono font-medium">{cron.name}</td>
                  <td className="px-5 py-3 font-mono" style={{ color: 'var(--text-secondary)' }}>
                    {cron.schedule.expr}
                  </td>
                  <td className="px-5 py-3">
                    <span className="inline-flex items-center gap-1.5 text-[11px] font-semibold"
                      style={{ color: cron.state?.lastRunStatus === "ok" ? 'var(--success)' : 'var(--danger)' }}>
                      <span className="w-1.5 h-1.5 rounded-full"
                        style={{ background: cron.state?.lastRunStatus === "ok" ? 'var(--success)' : 'var(--danger)' }} />
                      {cron.state?.lastRunStatus || "—"}
                    </span>
                  </td>
                  <td className="px-5 py-3">
                    <span style={{ color: cron.enabled ? 'var(--success)' : 'var(--text-muted)' }}>
                      {cron.enabled ? "●" : "○"}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
