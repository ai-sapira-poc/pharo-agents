import { getGateways } from "@/lib/openclaw-client";
import { Server, Plus, Wifi, WifiOff, Clock, Copy } from "lucide-react";

export const dynamic = "force-dynamic";

function timeAgo(ts: string | null): string {
  if (!ts) return "never";
  const diff = Date.now() - new Date(ts).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins}m ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h ago`;
  return `${Math.floor(hours / 24)}d ago`;
}

export default async function GatewaysPage() {
  const gateways = await getGateways();

  return (
    <div className="px-10 py-10 max-w-[1000px]">
      <div className="flex items-center justify-between mb-10">
        <div>
          <h1 className="text-[36px] leading-tight">Gateways</h1>
          <p className="text-[14px] mt-1" style={{ color: "var(--text-muted)" }}>
            Connected OpenClaw instances
          </p>
        </div>
      </div>

      {/* Setup instructions */}
      <div className="border rounded-lg p-5 mb-8" style={{ borderColor: "var(--border-subtle)", background: "var(--bg-surface)" }}>
        <div className="flex items-center gap-2 mb-3">
          <Plus size={14} strokeWidth={1.5} style={{ color: "var(--text-muted)" }} />
          <h3 className="text-[13px] font-semibold">Connect a new gateway</h3>
        </div>
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

      {/* Gateway list */}
      {gateways.length === 0 ? (
        <div className="border rounded-lg p-16 text-center" style={{ borderColor: "var(--border-subtle)", background: "var(--bg-surface)" }}>
          <Server size={32} strokeWidth={1} className="mx-auto mb-3" style={{ color: "var(--text-muted)", opacity: 0.4 }} />
          <p className="text-[13px] font-medium" style={{ color: "var(--text-muted)" }}>No gateways connected yet</p>
          <p className="text-[11px] mt-1" style={{ color: "var(--text-muted)" }}>Run the setup script above on your first machine</p>
        </div>
      ) : (
        <div className="space-y-3">
          {gateways.map((gw) => {
            const isOnline = gw.status === "online";
            return (
              <div key={gw.id} className="border rounded-lg p-5"
                style={{ borderColor: "var(--border-subtle)", background: "var(--bg-surface)" }}>
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-center gap-3">
                    <Server size={18} strokeWidth={1.5} style={{ color: isOnline ? "var(--success)" : "var(--text-muted)" }} />
                    <div>
                      <h3 className="text-[15px] font-semibold">{gw.name}</h3>
                      <p className="text-[11px] font-mono" style={{ color: "var(--text-muted)" }}>
                        {gw.machine_host || "—"} · {gw.machine_os || "—"}
                      </p>
                    </div>
                  </div>
                  <span className="inline-flex items-center gap-1.5 text-[11px] font-semibold px-2 py-0.5 rounded-md"
                    style={{
                      background: isOnline ? "var(--success-muted)" : "var(--danger-muted)",
                      color: isOnline ? "var(--success)" : "var(--text-muted)",
                    }}>
                    {isOnline ? <Wifi size={11} /> : <WifiOff size={11} />}
                    {gw.status}
                  </span>
                </div>

                <div className="grid grid-cols-4 gap-4 text-[12px]">
                  <div>
                    <p className="text-[10px] font-medium uppercase tracking-[0.1em]" style={{ color: "var(--text-muted)" }}>Agents</p>
                    <p className="font-mono mt-0.5">{gw.agent_count}</p>
                  </div>
                  <div>
                    <p className="text-[10px] font-medium uppercase tracking-[0.1em]" style={{ color: "var(--text-muted)" }}>OpenClaw</p>
                    <p className="font-mono mt-0.5">{gw.openclaw_version || "—"}</p>
                  </div>
                  <div>
                    <p className="text-[10px] font-medium uppercase tracking-[0.1em]" style={{ color: "var(--text-muted)" }}>Last Seen</p>
                    <p className="font-mono mt-0.5">{timeAgo(gw.last_seen_at)}</p>
                  </div>
                  <div>
                    <p className="text-[10px] font-medium uppercase tracking-[0.1em]" style={{ color: "var(--text-muted)" }}>Tunnel</p>
                    <p className="font-mono mt-0.5 truncate">{gw.tunnel_url || "not configured"}</p>
                  </div>
                </div>

                {gw.tunnel_url && (
                  <div className="mt-3 pt-3" style={{ borderTop: "1px solid var(--border-subtle)" }}>
                    <code className="text-[10px] font-mono" style={{ color: "var(--text-muted)" }}>
                      {gw.tunnel_url}
                    </code>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
