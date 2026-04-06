import { getUser } from "@/lib/supabase-server";
import { redirect } from "next/navigation";
import { Server, Terminal, Clock, Shield, ArrowLeft } from "lucide-react";
import Link from "next/link";

export const dynamic = "force-dynamic";

export default async function ConnectGatewayPage() {
  const user = await getUser();
  if (!user || user.profile?.role !== "super_admin") redirect("/");

  return (
    <div className="px-10 py-10 max-w-[800px]">
      <Link href="/" className="inline-flex items-center gap-1.5 text-[12px] font-medium mb-8"
        style={{ color: "var(--text-muted)" }}>
        <ArrowLeft size={14} strokeWidth={1.5} /> Back to Dashboard
      </Link>

      <div className="mb-10">
        <h1 className="text-[36px] leading-tight">Connect a Gateway</h1>
        <p className="text-[14px] mt-1" style={{ color: "var(--text-muted)" }}>
          Register an OpenClaw instance to manage its agents from Pharo
        </p>
      </div>

      {/* Prerequisites */}
      <div className="mb-8">
        <div className="flex items-center gap-2 mb-4">
          <Shield size={14} strokeWidth={1.5} style={{ color: "var(--text-muted)" }} />
          <h2 className="text-[13px] font-semibold uppercase tracking-[0.08em]" style={{ color: "var(--text-muted)" }}>Prerequisites</h2>
        </div>
        <div className="border rounded-lg overflow-hidden" style={{ borderColor: "var(--border-subtle)", background: "var(--bg-surface)" }}>
          {[
            "OpenClaw installed and configured on the target machine",
            "A valid openclaw.json config file at ~/.openclaw/openclaw.json",
            "Network access to reach the Pharo Agents API",
          ].map((item, i, arr) => (
            <div key={i} className="px-5 py-3 flex items-center gap-3 text-[12px]"
              style={{ borderBottom: i < arr.length - 1 ? "1px solid var(--border-subtle)" : undefined }}>
              <span className="w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold flex-shrink-0"
                style={{ background: "var(--bg-raised)", color: "var(--text-muted)" }}>
                {i + 1}
              </span>
              <span style={{ color: "var(--text-secondary)" }}>{item}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Setup Command */}
      <div className="mb-8">
        <div className="flex items-center gap-2 mb-4">
          <Terminal size={14} strokeWidth={1.5} style={{ color: "var(--text-muted)" }} />
          <h2 className="text-[13px] font-semibold uppercase tracking-[0.08em]" style={{ color: "var(--text-muted)" }}>Run the Setup Script</h2>
        </div>
        <div className="border rounded-lg p-5" style={{ borderColor: "var(--border-subtle)", background: "var(--bg-surface)" }}>
          <p className="text-[12px] mb-3" style={{ color: "var(--text-secondary)" }}>
            Run this command on any machine with OpenClaw installed:
          </p>
          <code className="block text-[12px] font-mono px-4 py-3 rounded-md"
            style={{ background: "var(--bg-raised)", color: "var(--text-primary)" }}>
            curl -fsSL https://pharo-agents.vercel.app/setup.sh | bash
          </code>
          <p className="text-[12px] mt-4" style={{ color: "var(--text-secondary)" }}>
            The script will prompt you for a gateway name and optional tunnel URL, then automatically:
          </p>
        </div>
      </div>

      {/* What the Script Does */}
      <div className="mb-8">
        <div className="flex items-center gap-2 mb-4">
          <Server size={14} strokeWidth={1.5} style={{ color: "var(--text-muted)" }} />
          <h2 className="text-[13px] font-semibold uppercase tracking-[0.08em]" style={{ color: "var(--text-muted)" }}>What It Does</h2>
        </div>
        <div className="border rounded-lg overflow-hidden" style={{ borderColor: "var(--border-subtle)", background: "var(--bg-surface)" }}>
          {[
            ["Detects config", "Reads your OpenClaw configuration and discovers all registered agents"],
            ["Registers gateway", "Creates the gateway entry in Pharo with machine info and agent data"],
            ["Extracts agent data", "Collects skills, sessions, bindings, and identity from each agent workspace"],
            ["Sets up heartbeats", "Installs a cron job that sends status updates every 30 minutes"],
          ].map(([title, desc], i, arr) => (
            <div key={i} className="px-5 py-3 text-[12px]"
              style={{ borderBottom: i < arr.length - 1 ? "1px solid var(--border-subtle)" : undefined }}>
              <p className="font-semibold" style={{ color: "var(--text-primary)" }}>{title}</p>
              <p className="mt-0.5" style={{ color: "var(--text-muted)" }}>{desc}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Heartbeat Info */}
      <div className="mb-8">
        <div className="flex items-center gap-2 mb-4">
          <Clock size={14} strokeWidth={1.5} style={{ color: "var(--text-muted)" }} />
          <h2 className="text-[13px] font-semibold uppercase tracking-[0.08em]" style={{ color: "var(--text-muted)" }}>Heartbeat Updates</h2>
        </div>
        <div className="border rounded-lg p-5" style={{ borderColor: "var(--border-subtle)", background: "var(--bg-surface)" }}>
          <p className="text-[12px]" style={{ color: "var(--text-secondary)" }}>
            After setup, the gateway sends automatic heartbeat updates every 30 minutes via a cron job.
            This keeps agent status, session counts, and token usage up to date in the dashboard.
            The reporter script is installed at <code className="font-mono text-[11px]" style={{ color: "var(--text-primary)" }}>~/.pharo-agents/reporter.sh</code>.
          </p>
        </div>
      </div>
    </div>
  );
}
