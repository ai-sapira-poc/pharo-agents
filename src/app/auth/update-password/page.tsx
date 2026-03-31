"use client";

import { useState } from "react";
import { createSupabaseBrowser } from "@/lib/supabase-browser";
import { Loader2 } from "lucide-react";

export default function UpdatePasswordPage() {
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(""); setLoading(true);
    const supabase = createSupabaseBrowser();
    const { error } = await supabase.auth.updateUser({ password });
    setLoading(false);
    if (error) setError(error.message);
    else window.location.href = "/";
  };

  return (
    <div className="min-h-screen flex items-center justify-center" style={{ background: "var(--bg-root)" }}>
      <div className="w-full max-w-[380px] px-6">
        <h1 className="text-[28px] mb-6" style={{ fontFamily: "var(--font-heading)", fontWeight: 300, fontStyle: "italic" }}>
          Set new password
        </h1>
        <form onSubmit={handleSubmit}>
          <input type="password" value={password} onChange={(e) => setPassword(e.target.value)}
            className="w-full px-3 py-2.5 rounded-lg border text-[13px] outline-none"
            style={{ background: "var(--bg-surface)", borderColor: "var(--border-subtle)", color: "var(--text-primary)" }}
            placeholder="New password (min 6 chars)" minLength={6} required />
          {error && <p className="text-[12px] mt-2" style={{ color: "var(--danger)" }}>{error}</p>}
          <button type="submit" disabled={loading}
            className="w-full mt-4 px-4 py-2.5 rounded-lg text-[13px] font-semibold flex items-center justify-center gap-2"
            style={{ background: "var(--text-primary)", color: "var(--bg-root)" }}>
            {loading ? <Loader2 size={14} className="animate-spin" /> : null}
            Update password
          </button>
        </form>
      </div>
    </div>
  );
}
