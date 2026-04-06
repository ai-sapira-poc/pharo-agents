// @ts-nocheck
import { getGateway, getDefaultGatewayId, getAgents, getGatewaySettings } from "@/lib/openclaw-client";
import { Server, Cpu, Radio, Shield, Wifi, WifiOff, Plus } from "lucide-react";

export const dynamic = "force-dynamic";

export default async function SettingsPage({ searchParams }: { searchParams: Promise<{ gw?: string }> }) {
  const params = await searchParams;
  const gwId = params.gw || await getDefaultGatewayId();
  const gatewayRaw = gwId ? await getGateway(gwId) : null;
  const gateway = gatewayRaw as { id: string; name: string; tunnel_url: string | null; api_token: string | null; machine_host: string | null; machine_os: string | null; openclaw_version: string | null; agent_count: number; status: string; last_seen_at: string | null; registered_at: string; } | null;
  const agents = await getAgents(gwId || undefined);
  const liveStatus = gwId ? await getGatewaySettings(gwId) : null;

  if (!gateway) {
    return (
      <div className="px-10 py-10 max-w-[1000px]">
        <h1 className="text-[36px] leading-tight mb-4">Settings</h1>
        <div className="border rounded-lg p-16 text-center"
          style={{ borderColor: "var(--border-subtle)", background: "var(--bg-surface)" }}>
          <p className="text-[13px]" style={{ color: "var(--text-muted)" }}>No gateway selected</p>
        </div>
      </div>
    );
  }

  
  const isOnline = gateway.status === "online" || (gateway.last_seen_at && new Date(String(gateway.last_seen_at)).getTime() > Date.now() - 3600000);

  // Extract bindings from agent configs
  const allBindings: Array<{ agentId: string; agentName: string; channel: string; account: string }> = [];
  for (const agent of agents) {
    for (const b of (agent.config?.bindings || [])) {
      allBindings.push({
        agentId: agent.id,
        agentName: agent.name,
        channel: b.match?.channel || "?",
        account: b.match?.accountId || "default",
      });
    }
  }

  // Extract unique models
  const models = new Set<string>();
  for (const agent of agents) {
    if (agent.model && agent.model !== "unknown") models.add(agent.model);
    for (const m of (agent.config?.sessions?.models || [])) {
      if (m) models.add(m);
    }
  }

  return (
    <div className="px-10 py-10 max-w-[1000px]">
      <div className="mb-10">
        <h1 className="text-[36px] leading-tight">Settings</h1>
        <p className="text-[14px] mt-1" style={{ color: "var(--text-muted)" }}>{String(gateway.name)}</p>
      </div>

      {/* Gateway Info */}
      <div className="mb-8">
        <div className="flex items-center gap-2 mb-4">
          <Server size={14} strokeWidth={1.5} style={{ color: "var(--text-muted)" }} />
          <h2 className="text-[13px] font-semibold uppercase tracking-[0.08em]" style={{ color: "var(--text-muted)" }}>Gateway</h2>
        </div>
        <div className="border rounded-lg overflow-hidden" style={{ borderColor: "var(--border-subtle)", background: "var(--bg-surface)" }}>
          {([
            ["Name", String(gateway.name)],
            ["Status", isOnline ? "Online" : "Offline"],
            ["Host", String(gateway.machine_host || "—")],
            ["OS", String(gateway.machine_os || "—")],
            ["OpenClaw", String(gateway.openclaw_version || "—")],
            ["Tunnel", String(gateway.tunnel_url || "Not configured")],
            ["Agents", String(gateway.agent_count || 0)],
            ["Last Seen", gateway.last_seen_at ? new Date(gateway.last_seen_at as string).toLocaleString() : "Never"],
          ] as [string, string][]).map(([label, value], i, arr) => (
            <div key={label} className="px-5 py-3 flex items-center justify-between text-[12px]"
              style={{ borderBottom: i < arr.length - 1 ? "1px solid var(--border-subtle)" : undefined }}>
              <span className="font-medium" style={{ color: "var(--text-muted)" }}>{label}</span>
              <span className="font-mono text-right max-w-[400px] truncate">{value}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Live Status */}
      {liveStatus?.statusText && (
        <div className="mb-8">
          <div className="flex items-center gap-2 mb-4">
            <Wifi size={14} strokeWidth={1.5} style={{ color: "var(--success)" }} />
            <h2 className="text-[13px] font-semibold uppercase tracking-[0.08em]" style={{ color: "var(--text-muted)" }}>Live Status</h2>
          </div>
          <pre className="border rounded-lg p-4 text-[11px] font-mono whitespace-pre-wrap leading-relaxed"
            style={{ borderColor: "var(--border-subtle)", background: "var(--bg-surface)", color: "var(--text-secondary)" }}>
            {String(liveStatus.statusText)}
          </pre>
        </div>
      )}

      {/* Models */}
      {models.size > 0 && (
        <div className="mb-8">
          <div className="flex items-center gap-2 mb-4">
            <Cpu size={14} strokeWidth={1.5} style={{ color: "var(--text-muted)" }} />
            <h2 className="text-[13px] font-semibold uppercase tracking-[0.08em]" style={{ color: "var(--text-muted)" }}>Models in Use</h2>
          </div>
          <div className="border rounded-lg overflow-hidden" style={{ borderColor: "var(--border-subtle)", background: "var(--bg-surface)" }}>
            {Array.from(models).map((m, i) => {
              const agentsUsing = agents.filter((a) => a.model === m || (a.config?.sessions?.models || []).includes(m));
              return (
                <div key={m} className="px-5 py-3 flex items-center justify-between text-[12px]"
                  style={{ borderBottom: i < models.size - 1 ? "1px solid var(--border-subtle)" : undefined }}>
                  <span className="font-mono">{m}</span>
                  <span style={{ color: "var(--text-muted)" }}>
                    {agentsUsing.map((a) => a.name).join(", ")}
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Channel Bindings */}
      {allBindings.length > 0 && (
        <div className="mb-8">
          <div className="flex items-center gap-2 mb-4">
            <Radio size={14} strokeWidth={1.5} style={{ color: "var(--text-muted)" }} />
            <h2 className="text-[13px] font-semibold uppercase tracking-[0.08em]" style={{ color: "var(--text-muted)" }}>Channel Bindings</h2>
          </div>
          <div className="border rounded-lg overflow-hidden" style={{ borderColor: "var(--border-subtle)", background: "var(--bg-surface)" }}>
            <div className="px-5 py-2.5 text-[10px] font-semibold uppercase tracking-wider border-b flex"
              style={{ color: "var(--text-muted)", background: "var(--bg-raised)", borderColor: "var(--border-subtle)" }}>
              <span className="w-1/3">Agent</span>
              <span className="w-1/3">Channel</span>
              <span className="w-1/3">Account</span>
            </div>
            {allBindings.map((b, i) => (
              <div key={i} className="px-5 py-3 flex text-[12px]"
                style={{ borderBottom: i < allBindings.length - 1 ? "1px solid var(--border-subtle)" : undefined }}>
                <span className="w-1/3 font-medium">{b.agentName}</span>
                <span className="w-1/3 font-mono" style={{ color: "var(--text-secondary)" }}>{b.channel}</span>
                <span className="w-1/3 font-mono" style={{ color: "var(--text-muted)" }}>{b.account}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Security */}
      <div className="mb-8">
        <div className="flex items-center gap-2 mb-4">
          <Shield size={14} strokeWidth={1.5} style={{ color: "var(--text-muted)" }} />
          <h2 className="text-[13px] font-semibold uppercase tracking-[0.08em]" style={{ color: "var(--text-muted)" }}>Connection</h2>
        </div>
        <div className="border rounded-lg overflow-hidden" style={{ borderColor: "var(--border-subtle)", background: "var(--bg-surface)" }}>
          {([
            ["Tunnel", gateway.tunnel_url ? "Cloudflare Tunnel active" : "Not configured"],
            ["Gateway ID", String(gateway.id)],
            ["Registered", new Date(gateway.registered_at as string).toLocaleDateString()],
          ] as [string, string][]).map(([label, value], i, arr) => (
            <div key={label} className="px-5 py-3 flex items-center justify-between text-[12px]"
              style={{ borderBottom: i < arr.length - 1 ? "1px solid var(--border-subtle)" : undefined }}>
              <span className="font-medium" style={{ color: "var(--text-muted)" }}>{label}</span>
              <span className="font-mono text-right max-w-[400px] truncate">{value}</span>
            </div>
          ))}
        </div>
      </div>
      {/* Connect a New Gateway */}
      <div className="mb-8">
        <div className="flex items-center gap-2 mb-4">
          <Plus size={14} strokeWidth={1.5} style={{ color: "var(--text-muted)" }} />
          <h2 className="text-[13px] font-semibold uppercase tracking-[0.08em]" style={{ color: "var(--text-muted)" }}>Connect a New Gateway</h2>
        </div>
        <div className="border rounded-lg p-5" style={{ borderColor: "var(--border-subtle)", background: "var(--bg-surface)" }}>
          <p className="text-[12px] mb-3" style={{ color: "var(--text-secondary)" }}>
            Run this on any machine with OpenClaw installed:
          </p>
          <div className="flex items-center gap-2">
            <code className="flex-1 text-[11px] font-mono px-3 py-2 rounded-md"
              style={{ background: "var(--bg-raised)", color: "var(--text-primary)" }}>
              curl -fsSL https://pharo-agents.vercel.app/setup.sh | bash
            </code>
          </div>
          <p className="text-[11px] mt-2" style={{ color: "var(--text-muted)" }}>
            The script auto-detects your OpenClaw config, registers agents, and sets up heartbeats.
          </p>
        </div>
      </div>
    </div>
  );
}
