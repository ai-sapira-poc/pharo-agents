import { getAgents, getDefaultGatewayId, getGateway, getWindowResetTime } from "@/lib/openclaw-client";
import Link from "next/link";
import { Users, Hash, MessageCircle, DollarSign, ArrowRight, Circle } from "lucide-react";
import { WindowReset } from "@/components/window-reset";

function fmt(n: number): string {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `${(n / 1_000).toFixed(0)}k`;
  return n.toString();
}

export const dynamic = "force-dynamic";

export default async function Dashboard({ searchParams }: { searchParams: Promise<{ gw?: string }> }) {
  const params = await searchParams;
  const gwId = params.gw || await getDefaultGatewayId();
  const gateway = gwId ? await getGateway(gwId) : null;
  const agents = await getAgents(gwId || undefined);
  const { resetAt } = await getWindowResetTime();
  
  const totalTokens = agents.reduce((s, a) => s + (a.totalTokens || 0), 0);
  const totalCost = agents.reduce((s, a) => s + ((a.estimatedCost || 0) || 0), 0);
  const active = agents.filter((a) => a.status === "active").length;

  return (
    <div className="px-10 py-10 max-w-[1200px]">
      <div className="mb-10">
        <h1 className="text-[36px] leading-tight">Dashboard</h1>
        <p className="text-[14px] mt-1" style={{ color: "var(--text-muted)" }}>
          {gateway ? gateway.name : "Select a workspace"} — {agents.length} agents
        </p>
      </div>

      <div className="grid grid-cols-4 gap-4 mb-10">
        {[
          { label: "Active", value: `${active}/${agents.length}`, Icon: Users },
          { label: "Tokens", value: fmt(totalTokens), Icon: Hash },
          { label: "Cost", value: `$${totalCost.toFixed(2)}`, Icon: DollarSign },
        ].map((s) => (
          <div key={s.label} className="border rounded-lg p-4"
            style={{ borderColor: "var(--border-subtle)", background: "var(--bg-surface)" }}>
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-medium uppercase tracking-[0.1em]" style={{ color: "var(--text-muted)" }}>{s.label}</span>
              <s.Icon size={14} strokeWidth={1.5} style={{ color: "var(--text-muted)" }} />
            </div>
            <p className="text-[26px] font-medium mt-2" style={{ fontFamily: "var(--font-heading)", fontStyle: "italic" }}>{s.value}</p>
          </div>
        ))}
        <WindowReset resetAt={resetAt.toISOString()} />
      </div>

      <div className="mb-5">
        <h2 className="text-[24px]">Agents</h2>
      </div>

      {agents.length === 0 ? (
        <div className="border rounded-lg p-16 text-center"
          style={{ borderColor: "var(--border-subtle)", background: "var(--bg-surface)" }}>
          <p className="text-[13px]" style={{ color: "var(--text-muted)" }}>
            No agents found. Run the reporter script on this gateway to sync data.
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {agents.map((agent) => {
            const pct = agent.contextTokens ? Math.round(((agent.totalTokens || 0) / agent.contextTokens) * 100) : 0;
            const cost = agent.estimatedCost || 0;

            return (
              <Link key={agent.id} href={`/agents/${agent.id}${gwId ? '?gw=' + gwId : ''}`}
                className="agent-card group flex items-center gap-6 border rounded-lg p-5"
                style={{ background: "var(--bg-surface)" }}>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-3 mb-1">
                    <Circle size={8} fill={agent.status === "active" ? "var(--success)" : "var(--warning)"} stroke="none" />
                    <h3 className="text-[15px] font-semibold">{agent.name || agent.id}</h3>
                    <span className="text-[11px] font-mono" style={{ color: "var(--text-muted)" }}>{agent.model}</span>
                  </div>
                  <p className="text-[13px] truncate" style={{ color: "var(--text-secondary)" }}>
                    {agent.purpose || "No purpose defined"}
                  </p>
                </div>
                <div className="flex items-center gap-8 flex-shrink-0">
                  <div className="text-right">
                    <p className="text-[10px] font-medium uppercase tracking-[0.1em]" style={{ color: "var(--text-muted)" }}>Tokens</p>
                    <p className="text-[14px] font-mono">{fmt(agent.totalTokens || 0)}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-[10px] font-medium uppercase tracking-[0.1em]" style={{ color: "var(--text-muted)" }}>Cost</p>
                    <p className="text-[14px] font-mono">${cost.toFixed(2)}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-[10px] font-medium uppercase tracking-[0.1em]" style={{ color: "var(--text-muted)" }}>Sessions</p>
                    <p className="text-[14px] font-mono">{agent.sessionCount}</p>
                  </div>
                  <div className="w-20">
                    <div className="w-full rounded-full h-1" style={{ background: "var(--bg-overlay)" }}>
                      <div className="h-1 rounded-full transition-all duration-500"
                        style={{ width: `${Math.min(pct, 100)}%`, background: pct > 80 ? "var(--danger)" : "var(--text-primary)" }} />
                    </div>
                  </div>
                  <ArrowRight size={16} strokeWidth={1.5} className="opacity-0 group-hover:opacity-100 transition-opacity"
                    style={{ color: "var(--text-muted)" }} />
                </div>
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}
