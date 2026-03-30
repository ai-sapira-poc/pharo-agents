"use client";

import { useState } from "react";
import { createClient } from "@supabase/supabase-js";
import { useRouter, useSearchParams } from "next/navigation";
import { Loader2 } from "lucide-react";

function getSupabase() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL || "",
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY || ""
  );
}

export function LoginForm() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [mode, setMode] = useState<"login" | "reset">("login");
  const [resetSent, setResetSent] = useState(false);
  const [debug, setDebug] = useState("");
  const router = useRouter();
  const searchParams = useSearchParams();
  const redirect = searchParams.get("redirect") || "/";

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(""); setDebug(""); setLoading(true);

    const supabase = getSupabase();
    
    // Debug: check if env vars are available
    const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const key = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;
    if (!url || !key) {
      setError("Configuration error: Supabase credentials not found");
      setDebug(`URL: ${url ? "set" : "MISSING"}, Key: ${key ? "set" : "MISSING"}`);
      setLoading(false);
      return;
    }

    const { data, error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) {
      setError(error.message);
      setDebug(`URL: ${url.substring(0, 30)}... | Key: ${key.substring(0, 20)}...`);
      setLoading(false);
    } else {
      router.push(redirect);
      router.refresh();
    }
  };

  const handleReset = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(""); setLoading(true);
    const supabase = getSupabase();
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/auth/update-password`,
    });
    setLoading(false);
    if (error) setError(error.message);
    else setResetSent(true);
  };

  const inputClass = "w-full px-3 py-2.5 rounded-lg border text-[13px] outline-none transition-colors";
  const inputStyle = { background: "var(--bg-surface)", borderColor: "var(--border-subtle)", color: "var(--text-primary)" };

  return (
    <div className="min-h-screen flex items-center justify-center" style={{ background: "var(--bg-root)" }}>
      <div className="w-full max-w-[380px] px-6">
        <div className="mb-10 text-center">
          <h1 className="text-[40px] leading-none" style={{ fontFamily: "var(--font-heading)", fontWeight: 300, fontStyle: "italic" }}>Pharo</h1>
          <p className="text-[12px] font-medium uppercase tracking-[0.15em] mt-2" style={{ color: "var(--text-muted)" }}>Agent Fleet</p>
        </div>

        {mode === "login" ? (
          <form onSubmit={handleLogin}>
            <div className="space-y-3">
              <div>
                <label className="text-[11px] font-semibold uppercase tracking-[0.1em] block mb-1.5" style={{ color: "var(--text-muted)" }}>Email</label>
                <input type="email" value={email} onChange={(e) => setEmail(e.target.value)}
                  className={inputClass} style={inputStyle} placeholder="you@company.com" required autoFocus />
              </div>
              <div>
                <label className="text-[11px] font-semibold uppercase tracking-[0.1em] block mb-1.5" style={{ color: "var(--text-muted)" }}>Password</label>
                <input type="password" value={password} onChange={(e) => setPassword(e.target.value)}
                  className={inputClass} style={inputStyle} placeholder="••••••••" required />
              </div>
            </div>
            {error && <p className="text-[12px] mt-3" style={{ color: "var(--danger)" }}>{error}</p>}
            {debug && <p className="text-[10px] mt-1 font-mono" style={{ color: "var(--text-muted)" }}>{debug}</p>}
            <button type="submit" disabled={loading}
              className="w-full mt-5 px-4 py-2.5 rounded-lg text-[13px] font-semibold flex items-center justify-center gap-2"
              style={{ background: "var(--text-primary)", color: "var(--bg-root)" }}>
              {loading ? <Loader2 size={14} className="animate-spin" /> : null} Sign in
            </button>
            <button type="button" onClick={() => setMode("reset")}
              className="w-full mt-3 text-[12px] font-medium" style={{ color: "var(--text-muted)" }}>
              Forgot password?
            </button>
          </form>
        ) : resetSent ? (
          <div className="text-center">
            <p className="text-[13px] mb-4" style={{ color: "var(--text-secondary)" }}>Check your email for a reset link.</p>
            <button onClick={() => { setMode("login"); setResetSent(false); }}
              className="text-[12px] font-medium" style={{ color: "var(--text-muted)" }}>Back to sign in</button>
          </div>
        ) : (
          <form onSubmit={handleReset}>
            <p className="text-[13px] mb-4" style={{ color: "var(--text-secondary)" }}>Enter your email for a reset link.</p>
            <input type="email" value={email} onChange={(e) => setEmail(e.target.value)}
              className={inputClass} style={inputStyle} placeholder="you@company.com" required />
            {error && <p className="text-[12px] mt-2" style={{ color: "var(--danger)" }}>{error}</p>}
            <button type="submit" disabled={loading}
              className="w-full mt-4 px-4 py-2.5 rounded-lg text-[13px] font-semibold flex items-center justify-center gap-2"
              style={{ background: "var(--text-primary)", color: "var(--bg-root)" }}>
              {loading ? <Loader2 size={14} className="animate-spin" /> : null} Send reset link
            </button>
            <button type="button" onClick={() => setMode("login")}
              className="w-full mt-3 text-[12px] font-medium" style={{ color: "var(--text-muted)" }}>Back to sign in</button>
          </form>
        )}
      </div>
    </div>
  );
}
