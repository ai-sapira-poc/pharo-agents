import { getAgent, getCronJobs } from "@/lib/openclaw-client";
import { notFound } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, Hash, Gauge, MessageCircle, Timer, Check, X } from "lucide-react";

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

  const metrics = [
    { label: "Tokens", value: fmt(agent.totalTokens || 0), Icon: Hash },
    { label: "Context", value: `${pct}%`, Icon: Gauge },
    { label: "Sessions", value: String(agent.sessionCount || 0), Icon: MessageCircle },
    { label: "Jobs", value: String(agentCrons.length), Icon: Timer },
  ];

  return (
    <div className="px-10 py-10 max-w-[1000px]">
      <Link href="/" className="back-link inline-flex items-center gap-1.5 text-[12px] font-medium mb-8">
        <ArrowLeft size={14} strokeWidth={1.5} /> Back
      </Link>

      <div className="mb-10">
        <div className="flex items-center gap-3 mb-1">
          <span className="w-2.5 h-2.5 rounded-full"
            style={{ background: agent.status === "active" ? 'var(--success)' : 'var(--warning)' }} />
          <span className="text-[11px] font-medium uppercase tracking-[0.1em]" style={{ color: 'var(--text-muted)' }}>
            {agent.status}
          </span>
        </div>
        <h1 className="text-[40px] leading-tight">{agent.name || agent.id}</h1>
        <p className="text-[13px] font-mono mt-1" style={{ color: 'var(--text-muted)' }}>{agent.model}</p>
      </div>

      <div className="grid grid-cols-4 gap-4 mb-10">
        {metrics.map((m) => (
          <div key={m.label} className="border rounded-lg p-4"
            style={{ borderColor: 'var(--border-subtle)', background: 'var(--bg-surface)' }}>
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-medium uppercase tracking-[0.1em]" style={{ color: 'var(--text-muted)' }}>{m.label}</span>
              <m.Icon size={13} strokeWidth={1.5} style={{ color: 'var(--text-muted)' }} />
            </div>
            <p className="text-[24px] font-medium mt-2" style={{ fontFamily: 'var(--font-heading)', fontStyle: 'italic' }}>{m.value}</p>
          </div>
        ))}
      </div>

      {/* Context */}
      <div className="border rounded-lg p-5 mb-6" style={{ borderColor: 'var(--border-subtle)', background: 'var(--bg-surface)' }}>
        <div className="flex items-center justify-between mb-3">
          <span className="text-[13px] font-semibold">Context Window</span>
          <span className="text-[11px] font-mono" style={{ color: 'var(--text-muted)' }}>
            {fmt(agent.contextUsed || 0)} / {fmt(agent.contextTokens || 0)}
          </span>
        </div>
        <div className="w-full rounded-full h-1.5" style={{ background: 'var(--bg-overlay)' }}>
          <div className="h-1.5 rounded-full transition-all duration-700"
            style={{ width: `${Math.min(pct, 100)}%`, background: 'var(--text-primary)' }} />
        </div>
      </div>

      {/* Purpose */}
      <div className="border rounded-lg p-5 mb-6" style={{ borderColor: 'var(--border-subtle)', background: 'var(--bg-surface)' }}>
        <h3 className="text-[13px] font-semibold mb-2">Purpose</h3>
        <p className="text-[13px] leading-relaxed" style={{ color: 'var(--text-secondary)' }}>
          {agent.purpose}
        </p>
      </div>

      {/* Config */}
      <div className="border rounded-lg overflow-hidden mb-6" style={{ borderColor: 'var(--border-subtle)', background: 'var(--bg-surface)' }}>
        <div className="px-5 py-3 border-b" style={{ borderColor: 'var(--border-subtle)' }}>
          <h3 className="text-[13px] font-semibold">Configuration</h3>
        </div>
        {[
          ["ID", agent.id],
          ["Model", agent.model],
          ["Workspace", agent.workspace],
          ["Context", `${fmt(agent.contextTokens || 0)} tokens`],
        ].map(([label, value], i) => (
          <div key={label} className="px-5 py-3 flex items-center justify-between text-[12px]"
            style={{ borderBottom: i < 3 ? '1px solid var(--border-subtle)' : undefined }}>
            <span style={{ color: 'var(--text-muted)' }}>{label}</span>
            <span className="font-mono">{value}</span>
          </div>
        ))}
      </div>

      {/* Crons */}
      {agentCrons.length > 0 && (
        <div className="border rounded-lg overflow-hidden" style={{ borderColor: 'var(--border-subtle)', background: 'var(--bg-surface)' }}>
          <div className="px-5 py-3 border-b" style={{ borderColor: 'var(--border-subtle)' }}>
            <h3 className="text-[13px] font-semibold">Scheduled Jobs</h3>
          </div>
          {agentCrons.map((cron, i) => (
            <div key={cron.id} className="px-5 py-3 flex items-center justify-between text-[12px]"
              style={{ borderBottom: i < agentCrons.length - 1 ? '1px solid var(--border-subtle)' : undefined }}>
              <div>
                <span className="font-mono font-medium">{cron.name}</span>
                <span className="font-mono ml-3" style={{ color: 'var(--text-muted)' }}>{cron.schedule.expr}</span>
              </div>
              <div className="flex items-center gap-3">
                {cron.state?.lastRunStatus === "ok"
                  ? <Check size={14} strokeWidth={1.5} style={{ color: 'var(--success)' }} />
                  : <X size={14} strokeWidth={1.5} style={{ color: 'var(--danger)' }} />}
                <span className="w-2 h-2 rounded-full"
                  style={{ background: cron.enabled ? 'var(--success)' : 'var(--text-muted)' }} />
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
