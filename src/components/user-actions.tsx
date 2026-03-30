"use client";

import { useState } from "react";
import { UserPlus, X, Loader2 } from "lucide-react";

interface Gateway { id: string; name: string; }

export function UserActions({ gateways }: { gateways: Gateway[] }) {
  const [showInvite, setShowInvite] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const handleInvite = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError(""); setSuccess(""); setLoading(true);

    const form = new FormData(e.currentTarget);
    const res = await fetch("/api/users", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        email: form.get("email"),
        password: form.get("password"),
        name: form.get("name"),
        role: form.get("role"),
        gateway_id: form.get("gateway_id") || undefined,
        workspace_role: form.get("workspace_role"),
      }),
    });

    const data = await res.json();
    setLoading(false);
    if (data.error) { setError(data.error); }
    else {
      setSuccess("User created");
      setShowInvite(false);
      window.location.reload();
    }
  };

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
        <form onSubmit={handleInvite} className="border rounded-lg p-5 space-y-3"
          style={{ borderColor: "var(--border-subtle)", background: "var(--bg-surface)" }}>
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-[13px] font-semibold">Add user</h3>
            <button type="button" onClick={() => setShowInvite(false)}><X size={14} style={{ color: "var(--text-muted)" }} /></button>
          </div>
          
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-[10px] font-semibold uppercase tracking-[0.1em] block mb-1" style={{ color: "var(--text-muted)" }}>Email *</label>
              <input name="email" type="email" required placeholder="user@company.com"
                className="w-full px-3 py-2 rounded-md border text-[12px] outline-none"
                style={{ background: "var(--bg-raised)", borderColor: "var(--border-subtle)", color: "var(--text-primary)" }} />
            </div>
            <div>
              <label className="text-[10px] font-semibold uppercase tracking-[0.1em] block mb-1" style={{ color: "var(--text-muted)" }}>Name</label>
              <input name="name" type="text" placeholder="Full name"
                className="w-full px-3 py-2 rounded-md border text-[12px] outline-none"
                style={{ background: "var(--bg-raised)", borderColor: "var(--border-subtle)", color: "var(--text-primary)" }} />
            </div>
            <div>
              <label className="text-[10px] font-semibold uppercase tracking-[0.1em] block mb-1" style={{ color: "var(--text-muted)" }}>Password *</label>
              <input name="password" type="password" required minLength={6} placeholder="Min 6 chars"
                className="w-full px-3 py-2 rounded-md border text-[12px] outline-none"
                style={{ background: "var(--bg-raised)", borderColor: "var(--border-subtle)", color: "var(--text-primary)" }} />
            </div>
            <div>
              <label className="text-[10px] font-semibold uppercase tracking-[0.1em] block mb-1" style={{ color: "var(--text-muted)" }}>Platform role</label>
              <select name="role" defaultValue="user"
                className="w-full px-3 py-2 rounded-md border text-[12px] outline-none appearance-none"
                style={{ background: "var(--bg-raised)", borderColor: "var(--border-subtle)", color: "var(--text-primary)" }}>
                <option value="user">User</option>
                <option value="super_admin">Super Admin</option>
              </select>
            </div>
            <div>
              <label className="text-[10px] font-semibold uppercase tracking-[0.1em] block mb-1" style={{ color: "var(--text-muted)" }}>Workspace</label>
              <select name="gateway_id" defaultValue=""
                className="w-full px-3 py-2 rounded-md border text-[12px] outline-none appearance-none"
                style={{ background: "var(--bg-raised)", borderColor: "var(--border-subtle)", color: "var(--text-primary)" }}>
                <option value="">None (super_admin sees all)</option>
                {gateways.map((gw) => <option key={gw.id} value={gw.id}>{gw.name}</option>)}
              </select>
            </div>
            <div>
              <label className="text-[10px] font-semibold uppercase tracking-[0.1em] block mb-1" style={{ color: "var(--text-muted)" }}>Workspace role</label>
              <select name="workspace_role" defaultValue="viewer"
                className="w-full px-3 py-2 rounded-md border text-[12px] outline-none appearance-none"
                style={{ background: "var(--bg-raised)", borderColor: "var(--border-subtle)", color: "var(--text-primary)" }}>
                <option value="viewer">Viewer</option>
                <option value="editor">Editor</option>
                <option value="admin">Admin</option>
              </select>
            </div>
          </div>

          {error && <p className="text-[12px]" style={{ color: "var(--danger)" }}>{error}</p>}
          {success && <p className="text-[12px]" style={{ color: "var(--success)" }}>{success}</p>}

          <button type="submit" disabled={loading}
            className="px-4 py-2 rounded-lg text-[12px] font-semibold flex items-center gap-2"
            style={{ background: "var(--text-primary)", color: "var(--bg-root)" }}>
            {loading ? <Loader2 size={13} className="animate-spin" /> : <UserPlus size={13} />}
            Create user
          </button>
        </form>
      )}
    </div>
  );
}
