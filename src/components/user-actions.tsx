"use client";

import { useState } from "react";
import { UserPlus, X, Loader2, Mail, Key } from "lucide-react";

interface Gateway { id: string; name: string; }

export function UserActions({ gateways, isSuperAdmin, defaultGatewayId }: { 
  gateways: Gateway[]; 
  isSuperAdmin: boolean;
  defaultGatewayId?: string;
}) {
  const [showInvite, setShowInvite] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [inviteMethod, setInviteMethod] = useState<"magic_link" | "password">("magic_link");

  const handleInvite = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError(""); setSuccess(""); setLoading(true);

    const form = new FormData(e.currentTarget);
    const payload: Record<string, unknown> = {
      email: form.get("email"),
      name: form.get("name"),
    };

    if (inviteMethod === "magic_link") {
      payload.magic_link = true;
    } else {
      payload.password = form.get("password");
    }

    if (isSuperAdmin) {
      payload.role = form.get("role") || "user";
      payload.gateway_id = form.get("gateway_id") || undefined;
    } else {
      payload.gateway_id = defaultGatewayId;
    }
    payload.workspace_role = form.get("workspace_role") || "viewer";

    const res = await fetch("/api/users", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });

    const data = await res.json();
    setLoading(false);
    if (data.error) { setError(data.error); }
    else {
      setSuccess(data.method === "magic_link" ? "Invitation sent via email" : "User created");
      setTimeout(() => { setShowInvite(false); window.location.reload(); }, 1500);
    }
  };

  const inputClass = "w-full px-3 py-2 rounded-md border text-[12px] outline-none";
  const inputStyle = { background: "var(--bg-raised)", borderColor: "var(--border-subtle)", color: "var(--text-primary)" };

  return (
    <div className="mb-6">
      {!showInvite ? (
        <button onClick={() => setShowInvite(true)}
          className="flex items-center gap-2 px-4 py-2 rounded-lg text-[12px] font-semibold border transition-all"
          style={{ borderColor: "var(--border-subtle)", color: "var(--text-primary)" }}
          onMouseEnter={(e) => { e.currentTarget.style.background = "var(--bg-raised)"; }}
          onMouseLeave={(e) => { e.currentTarget.style.background = "transparent"; }}>
          <UserPlus size={14} strokeWidth={1.5} /> Add user
        </button>
      ) : (
        <form onSubmit={handleInvite} className="border rounded-lg p-5"
          style={{ borderColor: "var(--border-subtle)", background: "var(--bg-surface)" }}>
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-[13px] font-semibold">Add user</h3>
            <button type="button" onClick={() => setShowInvite(false)}>
              <X size={14} style={{ color: "var(--text-muted)" }} />
            </button>
          </div>

          {/* Invite method toggle */}
          <div className="flex gap-2 mb-4">
            <button type="button" onClick={() => setInviteMethod("magic_link")}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-md text-[11px] font-semibold transition-all"
              style={{
                background: inviteMethod === "magic_link" ? "var(--text-primary)" : "var(--bg-raised)",
                color: inviteMethod === "magic_link" ? "var(--bg-root)" : "var(--text-muted)",
                borderColor: "var(--border-subtle)",
              }}>
              <Mail size={12} /> Magic Link
            </button>
            <button type="button" onClick={() => setInviteMethod("password")}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-md text-[11px] font-semibold transition-all"
              style={{
                background: inviteMethod === "password" ? "var(--text-primary)" : "var(--bg-raised)",
                color: inviteMethod === "password" ? "var(--bg-root)" : "var(--text-muted)",
              }}>
              <Key size={12} /> Password
            </button>
          </div>
          
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-[10px] font-semibold uppercase tracking-[0.1em] block mb-1" style={{ color: "var(--text-muted)" }}>Email *</label>
              <input name="email" type="email" required placeholder="user@company.com"
                className={inputClass} style={inputStyle} />
            </div>
            <div>
              <label className="text-[10px] font-semibold uppercase tracking-[0.1em] block mb-1" style={{ color: "var(--text-muted)" }}>Name</label>
              <input name="name" type="text" placeholder="Full name"
                className={inputClass} style={inputStyle} />
            </div>

            {inviteMethod === "password" && (
              <div>
                <label className="text-[10px] font-semibold uppercase tracking-[0.1em] block mb-1" style={{ color: "var(--text-muted)" }}>Password *</label>
                <input name="password" type="password" minLength={6} placeholder="Min 6 chars"
                  required={inviteMethod === "password"}
                  className={inputClass} style={inputStyle} />
              </div>
            )}

            {isSuperAdmin && (
              <>
                <div>
                  <label className="text-[10px] font-semibold uppercase tracking-[0.1em] block mb-1" style={{ color: "var(--text-muted)" }}>Workspace</label>
                  <select name="gateway_id" defaultValue=""
                    className={inputClass} style={{ ...inputStyle, appearance: "none" as const }}>
                    <option value="">No workspace</option>
                    {gateways.map((gw) => <option key={gw.id} value={gw.id}>{gw.name}</option>)}
                  </select>
                </div>
              </>
            )}

            <div>
              <label className="text-[10px] font-semibold uppercase tracking-[0.1em] block mb-1" style={{ color: "var(--text-muted)" }}>Workspace role</label>
              <select name="workspace_role" defaultValue="viewer"
                className={inputClass} style={{ ...inputStyle, appearance: "none" as const }}>
                <option value="viewer">Viewer</option>
                <option value="editor">Editor</option>
                <option value="admin">Admin</option>
              </select>
            </div>
          </div>

          {inviteMethod === "magic_link" && (
            <p className="text-[11px] mt-3" style={{ color: "var(--text-muted)" }}>
              The user will receive an email with a sign-in link. No password needed.
            </p>
          )}

          {error && <p className="text-[12px] mt-3" style={{ color: "var(--danger)" }}>{error}</p>}
          {success && <p className="text-[12px] mt-3" style={{ color: "var(--success)" }}>{success}</p>}

          <button type="submit" disabled={loading}
            className="mt-4 px-4 py-2 rounded-lg text-[12px] font-semibold flex items-center gap-2"
            style={{ background: "var(--text-primary)", color: "var(--bg-root)" }}>
            {loading ? <Loader2 size={13} className="animate-spin" /> : inviteMethod === "magic_link" ? <Mail size={13} /> : <UserPlus size={13} />}
            {inviteMethod === "magic_link" ? "Send invitation" : "Create user"}
          </button>
        </form>
      )}
    </div>
  );
}
