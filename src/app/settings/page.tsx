import { getAgents, getCronJobs } from "@/lib/openclaw-client";
import { Server, Cpu, Radio, Clock, Check, X, Shield, Key } from "lucide-react";

export const dynamic = "force-dynamic";

export default async function SettingsPage() {
  const agents = await getAgents();
  const crons = await getCronJobs();

  const gateway = {
    version: "2026.3.13",
    host: "Juninho's Mac mini",
    os: "Darwin 25.3.0 (arm64)",
    node: "v25.6.1",
    port: 18789,
    bind: "loopback",
    mode: "local",
    auth: "token",
    tailscale: "off",
  };

  const models = [
    { id: "anthropic/claude-opus-4-6", alias: "opus", status: "active" },
    { id: "anthropic/claude-sonnet-4-6", alias: "sonnet", status: "active" },
    { id: "openai/gpt-5.2", alias: null, status: "available" },
    { id: "openrouter/deepinfra/kimi-k2-5", alias: null, status: "available" },
    { id: "openrouter/openrouter/auto", alias: null, status: "available" },
  ];

  const bindings = [
    { agentId: "juninhojr", channel: "slack", account: "default" },
    { agentId: "hansolo", channel: "telegram", account: "hansolo" },
    { agentId: "hansolo", channel: "slack", account: "hansolo" },
    { agentId: "zezinho", channel: "slack", account: "zezinho" },
  ];

  return (
    <div className="px-10 py-10 max-w-[1000px]">
      <div className="mb-10">
        <h1 className="text-[36px] leading-tight">Settings</h1>
        <p className="text-[14px] mt-1" style={{ color: "var(--text-muted)" }}>Gateway configuration and access management</p>
      </div>

      {/* Gateway */}
      <div className="mb-8">
        <div className="flex items-center gap-2 mb-4">
          <Server size={14} strokeWidth={1.5} style={{ color: "var(--text-muted)" }} />
          <h2 className="text-[13px] font-semibold uppercase tracking-[0.08em]" style={{ color: "var(--text-muted)" }}>
            Gateway
          </h2>
        </div>
        <div className="border rounded-lg overflow-hidden" style={{ borderColor: "var(--border-subtle)", background: "var(--bg-surface)" }}>
          {Object.entries(gateway).map(([key, val], i, arr) => (
            <div key={key} className="px-5 py-3 flex items-center justify-between text-[12px]"
              style={{ borderBottom: i < arr.length - 1 ? "1px solid var(--border-subtle)" : undefined }}>
              <span className="font-medium capitalize" style={{ color: "var(--text-muted)" }}>{key}</span>
              <span className="font-mono">{val}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Models */}
      <div className="mb-8">
        <div className="flex items-center gap-2 mb-4">
          <Cpu size={14} strokeWidth={1.5} style={{ color: "var(--text-muted)" }} />
          <h2 className="text-[13px] font-semibold uppercase tracking-[0.08em]" style={{ color: "var(--text-muted)" }}>
            Available Models
          </h2>
        </div>
        <div className="border rounded-lg overflow-hidden" style={{ borderColor: "var(--border-subtle)", background: "var(--bg-surface)" }}>
          {models.map((m, i) => (
            <div key={m.id} className="px-5 py-3 flex items-center justify-between text-[12px]"
              style={{ borderBottom: i < models.length - 1 ? "1px solid var(--border-subtle)" : undefined }}>
              <div className="flex items-center gap-2">
                <span className="font-mono">{m.id}</span>
                {m.alias && (
                  <span className="text-[10px] font-mono px-1.5 py-0.5 rounded"
                    style={{ background: "var(--bg-raised)", color: "var(--text-muted)" }}>
                    {m.alias}
                  </span>
                )}
              </div>
              <span className="flex items-center gap-1.5 text-[11px]"
                style={{ color: m.status === "active" ? "var(--success)" : "var(--text-muted)" }}>
                {m.status === "active" ? <Check size={12} /> : null}
                {m.status}
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* Channel Bindings */}
      <div className="mb-8">
        <div className="flex items-center gap-2 mb-4">
          <Radio size={14} strokeWidth={1.5} style={{ color: "var(--text-muted)" }} />
          <h2 className="text-[13px] font-semibold uppercase tracking-[0.08em]" style={{ color: "var(--text-muted)" }}>
            Channel Bindings
          </h2>
        </div>
        <div className="border rounded-lg overflow-hidden" style={{ borderColor: "var(--border-subtle)", background: "var(--bg-surface)" }}>
          <div className="px-5 py-2.5 text-[10px] font-semibold uppercase tracking-wider border-b flex"
            style={{ color: "var(--text-muted)", background: "var(--bg-raised)", borderColor: "var(--border-subtle)" }}>
            <span className="w-1/3">Agent</span>
            <span className="w-1/3">Channel</span>
            <span className="w-1/3">Account</span>
          </div>
          {bindings.map((b, i) => (
            <div key={i} className="px-5 py-3 flex text-[12px]"
              style={{ borderBottom: i < bindings.length - 1 ? "1px solid var(--border-subtle)" : undefined }}>
              <span className="w-1/3 font-medium">{b.agentId}</span>
              <span className="w-1/3 font-mono" style={{ color: "var(--text-secondary)" }}>{b.channel}</span>
              <span className="w-1/3 font-mono" style={{ color: "var(--text-muted)" }}>{b.account}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Cron Jobs */}
      <div className="mb-8">
        <div className="flex items-center gap-2 mb-4">
          <Clock size={14} strokeWidth={1.5} style={{ color: "var(--text-muted)" }} />
          <h2 className="text-[13px] font-semibold uppercase tracking-[0.08em]" style={{ color: "var(--text-muted)" }}>
            Cron Jobs
          </h2>
        </div>
        <div className="border rounded-lg overflow-hidden" style={{ borderColor: "var(--border-subtle)", background: "var(--bg-surface)" }}>
          {crons.map((cron, i) => (
            <div key={cron.id} className="px-5 py-3 flex items-center justify-between text-[12px]"
              style={{ borderBottom: i < crons.length - 1 ? "1px solid var(--border-subtle)" : undefined }}>
              <div>
                <span className="font-mono font-medium">{cron.name}</span>
                <span className="font-mono ml-3" style={{ color: "var(--text-muted)" }}>{cron.schedule.expr}</span>
                <span className="ml-2 text-[10px]" style={{ color: "var(--text-muted)" }}>{cron.schedule.tz}</span>
              </div>
              <div className="flex items-center gap-3">
                <span className="flex items-center gap-1 text-[11px]"
                  style={{ color: cron.state?.lastRunStatus === "ok" ? "var(--success)" : "var(--danger)" }}>
                  {cron.state?.lastRunStatus === "ok" ? <Check size={12} /> : <X size={12} />}
                </span>
                <span className="w-2 h-2 rounded-full"
                  style={{ background: cron.enabled ? "var(--success)" : "var(--text-muted)" }} />
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Auth & Security */}
      <div className="mb-8">
        <div className="flex items-center gap-2 mb-4">
          <Shield size={14} strokeWidth={1.5} style={{ color: "var(--text-muted)" }} />
          <h2 className="text-[13px] font-semibold uppercase tracking-[0.08em]" style={{ color: "var(--text-muted)" }}>
            Security
          </h2>
        </div>
        <div className="border rounded-lg overflow-hidden" style={{ borderColor: "var(--border-subtle)", background: "var(--bg-surface)" }}>
          {[
            ["Auth Mode", "Token-based"],
            ["Gateway Bind", "Loopback (local only)"],
            ["Tailscale", "Off"],
            ["Tunnel", "Cloudflare (pending setup)"],
            ["Tool Sandbox", "Workspace-only filesystem for all agents"],
          ].map(([label, value], i, arr) => (
            <div key={label} className="px-5 py-3 flex items-center justify-between text-[12px]"
              style={{ borderBottom: i < arr.length - 1 ? "1px solid var(--border-subtle)" : undefined }}>
              <span className="font-medium" style={{ color: "var(--text-muted)" }}>{label}</span>
              <span className="font-mono">{value}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
