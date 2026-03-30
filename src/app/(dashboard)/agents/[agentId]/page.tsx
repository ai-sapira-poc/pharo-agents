import { getAgent } from "@/lib/openclaw-client";
import { notFound } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, Hash, Gauge, MessageCircle, DollarSign, FileText, Radio, Wrench, Timer } from "lucide-react";

function fmt(n: number): string {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `${(n / 1_000).toFixed(0)}k`;
  return n.toString();
}

export const dynamic = "force-dynamic";

export default async function AgentDetail({ params, searchParams }: { params: Promise<{ agentId: string }>; searchParams: Promise<{ gw?: string }> }) {
  const { agentId } = await params;
  const sp = await searchParams;
  const agent = await getAgent(agentId, sp.gw || undefined);
  if (!agent) notFound();
  
  const cfg = agent.config;
  const sessions = cfg?.sessions || { count: 0, total_tokens: 0, total_cost: 0, models: [] };
  const skills = cfg?.skills || [];
  const bindings = cfg?.bindings || [];
  const identity = cfg?.identity || {};
  const pct = agent.contextTokens ? Math.round(((agent.contextUsed || 0) / agent.contextTokens) * 100) : 0;

  return (
    <div className="px-10 py-10 max-w-[1000px]">
      <Link href="/" className="back-link inline-flex items-center gap-1.5 text-[12px] font-medium mb-8">
        <ArrowLeft size={14} strokeWidth={1.5} /> Back
      </Link>

      {/* Header */}
      <div className="mb-10">
        <div className="flex items-center gap-3 mb-1">
          <span className="w-2.5 h-2.5 rounded-full"
            style={{ background: agent.status === "active" ? "var(--success)" : "var(--warning)" }} />
          <span className="text-[11px] font-medium uppercase tracking-[0.1em]" style={{ color: "var(--text-muted)" }}>
            {agent.status}
          </span>
          {agent.gatewayName && (
            <span className="text-[10px] font-mono px-1.5 py-0.5 rounded"
              style={{ background: "var(--bg-raised)", color: "var(--text-muted)" }}>
              {agent.gatewayName}
            </span>
          )}
        </div>
        <h1 className="text-[40px] leading-tight">{agent.name || agent.id}</h1>
        <p className="text-[13px] font-mono mt-1" style={{ color: "var(--text-muted)" }}>{agent.model}</p>
      </div>

      {/* Metrics */}
      <div className="grid grid-cols-4 gap-4 mb-10">
        {[
          { label: "Tokens", value: fmt(sessions.total_tokens), Icon: Hash },
          { label: "Sessions", value: String(sessions.count), Icon: MessageCircle },
          { label: "Context", value: `${pct}%`, Icon: Gauge },
          { label: "Cost", value: `$${sessions.total_cost.toFixed(2)}`, Icon: DollarSign },
        ].map((m) => (
          <div key={m.label} className="border rounded-lg p-4"
            style={{ borderColor: "var(--border-subtle)", background: "var(--bg-surface)" }}>
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-medium uppercase tracking-[0.1em]" style={{ color: "var(--text-muted)" }}>{m.label}</span>
              <m.Icon size={13} strokeWidth={1.5} style={{ color: "var(--text-muted)" }} />
            </div>
            <p className="text-[24px] font-medium mt-2" style={{ fontFamily: "var(--font-heading)", fontStyle: "italic" }}>{m.value}</p>
          </div>
        ))}
      </div>

      {/* Context Window */}
      <div className="border rounded-lg p-5 mb-6" style={{ borderColor: "var(--border-subtle)", background: "var(--bg-surface)" }}>
        <div className="flex items-center justify-between mb-3">
          <span className="text-[13px] font-semibold">Context Window</span>
          <span className="text-[11px] font-mono" style={{ color: "var(--text-muted)" }}>
            {fmt(sessions.total_tokens)} / {fmt(agent.contextTokens || 0)}
          </span>
        </div>
        <div className="w-full rounded-full h-1.5" style={{ background: "var(--bg-overlay)" }}>
          <div className="h-1.5 rounded-full transition-all duration-700"
            style={{ width: `${Math.min(pct, 100)}%`, background: "var(--text-primary)" }} />
        </div>
        {sessions.models.length > 0 && (
          <div className="flex gap-2 mt-2">
            {sessions.models.map((m) => (
              <span key={m} className="text-[10px] font-mono px-1.5 py-0.5 rounded"
                style={{ background: "var(--bg-raised)", color: "var(--text-muted)" }}>{m}</span>
            ))}
          </div>
        )}
      </div>

      {/* Purpose & Identity */}
      <div className="border rounded-lg p-5 mb-6" style={{ borderColor: "var(--border-subtle)", background: "var(--bg-surface)" }}>
        <h3 className="text-[13px] font-semibold mb-2">Purpose &amp; Identity</h3>
        <p className="text-[13px] leading-relaxed mb-3" style={{ color: "var(--text-secondary)" }}>
          {agent.purpose || "No purpose defined"}
        </p>
        {identity.soul_preview && (
          <details className="mt-2">
            <summary className="text-[11px] font-medium cursor-pointer" style={{ color: "var(--text-muted)" }}>
              SOUL.md preview
            </summary>
            <pre className="text-[11px] font-mono mt-2 p-3 rounded-md whitespace-pre-wrap leading-relaxed"
              style={{ background: "var(--bg-raised)", color: "var(--text-secondary)" }}>
              {identity.soul_preview}
            </pre>
          </details>
        )}
      </div>

      {/* Skills */}
      {skills.length > 0 && (
        <div className="border rounded-lg overflow-hidden mb-6" style={{ borderColor: "var(--border-subtle)", background: "var(--bg-surface)" }}>
          <div className="px-5 py-3 border-b flex items-center gap-2" style={{ borderColor: "var(--border-subtle)" }}>
            <Wrench size={13} strokeWidth={1.5} style={{ color: "var(--text-muted)" }} />
            <h3 className="text-[13px] font-semibold">Skills</h3>
            <span className="text-[10px] font-mono px-1.5 py-0.5 rounded"
              style={{ background: "var(--bg-raised)", color: "var(--text-muted)" }}>{skills.length}</span>
          </div>
          {skills.map((skill, i) => (
            <details key={skill.name} style={{ borderBottom: i < skills.length - 1 ? "1px solid var(--border-subtle)" : undefined }}>
              <summary className="px-5 py-3 cursor-pointer flex items-center justify-between text-[12px]">
                <div className="flex items-center gap-2">
                  <FileText size={12} strokeWidth={1.5} style={{ color: "var(--text-muted)" }} />
                  <span className="font-semibold">{skill.name}</span>
                </div>
                <span className="text-[11px] truncate max-w-[300px]" style={{ color: "var(--text-muted)" }}>
                  {skill.description?.substring(0, 80)}
                </span>
              </summary>
              {skill.content_preview && (
                <pre className="px-5 pb-3 text-[10px] font-mono whitespace-pre-wrap leading-relaxed max-h-[300px] overflow-y-auto"
                  style={{ color: "var(--text-secondary)" }}>
                  {skill.content_preview}
                </pre>
              )}
            </details>
          ))}
        </div>
      )}

      {/* Channel Bindings */}
      {bindings.length > 0 && (
        <div className="border rounded-lg overflow-hidden mb-6" style={{ borderColor: "var(--border-subtle)", background: "var(--bg-surface)" }}>
          <div className="px-5 py-3 border-b flex items-center gap-2" style={{ borderColor: "var(--border-subtle)" }}>
            <Radio size={13} strokeWidth={1.5} style={{ color: "var(--text-muted)" }} />
            <h3 className="text-[13px] font-semibold">Channel Bindings</h3>
          </div>
          {bindings.map((b, i) => (
            <div key={i} className="px-5 py-3 flex items-center justify-between text-[12px]"
              style={{ borderBottom: i < bindings.length - 1 ? "1px solid var(--border-subtle)" : undefined }}>
              <span className="font-mono">{b.match?.channel || "?"}</span>
              <span className="font-mono" style={{ color: "var(--text-muted)" }}>{b.match?.accountId || "default"}</span>
            </div>
          ))}
        </div>
      )}

      {/* Configuration */}
      <div className="border rounded-lg overflow-hidden" style={{ borderColor: "var(--border-subtle)", background: "var(--bg-surface)" }}>
        <div className="px-5 py-3 border-b" style={{ borderColor: "var(--border-subtle)" }}>
          <h3 className="text-[13px] font-semibold">Configuration</h3>
        </div>
        {[
          ["Agent ID", agent.id],
          ["Model", agent.model],
          ["Workspace", agent.workspace],
          ["Context Window", `${fmt(agent.contextTokens || 0)} tokens`],
          ["Gateway", agent.gatewayName || "—"],
        ].map(([label, value], i, arr) => (
          <div key={label} className="px-5 py-3 flex items-center justify-between text-[12px]"
            style={{ borderBottom: i < arr.length - 1 ? "1px solid var(--border-subtle)" : undefined }}>
            <span style={{ color: "var(--text-muted)" }}>{label}</span>
            <span className="font-mono text-right max-w-[400px] truncate">{value}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
