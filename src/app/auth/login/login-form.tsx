"use client";

import { useState } from "react";
import { createSupabaseBrowser } from "@/lib/supabase-browser";
import { useRouter, useSearchParams } from "next/navigation";
import { Loader2, Eye, EyeOff } from "lucide-react";

export function LoginForm() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [mode, setMode] = useState<"login" | "magic" | "reset">("login");
  const [emailSent, setEmailSent] = useState(false);
  const searchParams = useSearchParams();
  const redirect = searchParams.get("redirect") || "/";

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(""); setLoading(true);
    const sb = createSupabaseBrowser();
    const { error } = await sb.auth.signInWithPassword({ email, password });
    if (error) { setError(error.message); setLoading(false); }
    else { window.location.href = redirect; }
  };

  const handleMagicLink = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(""); setLoading(true);
    const res = await fetch("/api/auth/magic-link", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email }),
    });
    const data = await res.json();
    setLoading(false);
    if (data.error) setError(data.error);
    else setEmailSent(true);
  };

  const handleReset = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(""); setLoading(true);
    const res = await fetch("/api/auth/reset-password", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email }),
    });
    const data = await res.json();
    setLoading(false);
    if (data.error) setError(data.error);
    else setEmailSent(true);
  };

  const inputClass = "w-full px-3 py-2.5 rounded-lg border text-[13px] outline-none transition-colors";
  const inputStyle = { background: "var(--bg-surface)", borderColor: "var(--border-subtle)", color: "var(--text-primary)" };

  // Email sent confirmation (shared by magic link + reset)
  if (emailSent) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: "var(--bg-root)" }}>
        <div className="w-full max-w-[380px] px-6 text-center">
          <h1 className="text-[40px] leading-none mb-2" style={{ fontFamily: "var(--font-heading)", fontWeight: 300, fontStyle: "italic" }}>Pharo</h1>
          <p className="text-[13px] mt-6 mb-4" style={{ color: "var(--text-secondary)" }}>
            {mode === "magic" ? "Check your email for a sign-in link." : "Check your email for a password reset link."}
          </p>
          <p className="text-[12px] mb-6 font-mono" style={{ color: "var(--text-muted)" }}>{email}</p>
          <button onClick={() => { setMode("login"); setEmailSent(false); setError(""); }}
            className="text-[12px] font-medium" style={{ color: "var(--text-muted)" }}>
            Back to sign in
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center" style={{ background: "var(--bg-root)" }}>
      <div className="w-full max-w-[380px] px-6">
        {/* Logo */}
        <div className="mb-10 text-center">
          <h1 className="text-[40px] leading-none" style={{ fontFamily: "var(--font-heading)", fontWeight: 300, fontStyle: "italic" }}>Pharo</h1>
          <p className="text-[12px] font-medium uppercase tracking-[0.15em] mt-2" style={{ color: "var(--text-muted)" }}>Agent Fleet</p>
        </div>

        {/* PASSWORD LOGIN */}
        {mode === "login" && (
          <>
            <form onSubmit={handleLogin}>
              <div className="space-y-3">
                <div>
                  <label className="text-[11px] font-semibold uppercase tracking-[0.1em] block mb-1.5" style={{ color: "var(--text-muted)" }}>Email</label>
                  <input type="email" value={email} onChange={(e) => setEmail(e.target.value)}
                    className={inputClass} style={inputStyle} placeholder="you@company.com" required autoFocus />
                </div>
                <div>
                  <label className="text-[11px] font-semibold uppercase tracking-[0.1em] block mb-1.5" style={{ color: "var(--text-muted)" }}>Password</label>
                  <div className="relative">
                    <input type={showPassword ? "text" : "password"} value={password} onChange={(e) => setPassword(e.target.value)}
                      className={inputClass} style={{ ...inputStyle, paddingRight: "40px" }} placeholder="••••••••" required />
                    <button type="button" onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 p-0.5" style={{ color: "var(--text-muted)" }}>
                      {showPassword ? <EyeOff size={15} strokeWidth={1.5} /> : <Eye size={15} strokeWidth={1.5} />}
                    </button>
                  </div>
                </div>
              </div>
              {error && <p className="text-[12px] mt-3" style={{ color: "var(--danger)" }}>{error}</p>}
              <button type="submit" disabled={loading}
                className="w-full mt-5 px-4 py-2.5 rounded-lg text-[13px] font-semibold flex items-center justify-center gap-2"
                style={{ background: "var(--text-primary)", color: "var(--bg-root)" }}>
                {loading ? <Loader2 size={14} className="animate-spin" /> : null} Sign in
              </button>
              <button type="button" onClick={() => { setMode("reset"); setError(""); }}
                className="w-full mt-3 text-[12px] font-medium" style={{ color: "var(--text-muted)" }}>
                Forgot password?
              </button>
            </form>

            <div className="relative my-5">
              <div className="absolute inset-0 flex items-center"><div className="w-full" style={{ borderTop: "1px solid var(--border-subtle)" }}></div></div>
              <div className="relative flex justify-center"><span className="px-2 text-[11px]" style={{ background: "var(--bg-root)", color: "var(--text-muted)" }}>or</span></div>
            </div>

            <button type="button" onClick={() => { setMode("magic"); setError(""); }}
              className="w-full px-4 py-2.5 rounded-lg text-[13px] font-medium border flex items-center justify-center gap-2"
              style={{ borderColor: "var(--border-subtle)", color: "var(--text-primary)" }}>
              Sign in with magic link
            </button>
          </>
        )}

        {/* MAGIC LINK */}
        {mode === "magic" && (
          <form onSubmit={handleMagicLink}>
            <p className="text-[13px] mb-4" style={{ color: "var(--text-secondary)" }}>
              Enter your email and we'll send you a sign-in link.
            </p>
            <input type="email" value={email} onChange={(e) => setEmail(e.target.value)}
              className={inputClass} style={inputStyle} placeholder="you@company.com" required autoFocus />
            {error && <p className="text-[12px] mt-3" style={{ color: "var(--danger)" }}>{error}</p>}
            <button type="submit" disabled={loading}
              className="w-full mt-4 px-4 py-2.5 rounded-lg text-[13px] font-semibold flex items-center justify-center gap-2"
              style={{ background: "var(--text-primary)", color: "var(--bg-root)" }}>
              {loading ? <Loader2 size={14} className="animate-spin" /> : null} Send magic link
            </button>
            <button type="button" onClick={() => { setMode("login"); setError(""); }}
              className="w-full mt-3 text-[12px] font-medium" style={{ color: "var(--text-muted)" }}>
              Back to sign in
            </button>
          </form>
        )}

        {/* RESET PASSWORD */}
        {mode === "reset" && (
          <form onSubmit={handleReset}>
            <p className="text-[13px] mb-4" style={{ color: "var(--text-secondary)" }}>
              Enter your email and we'll send you a password reset link.
            </p>
            <input type="email" value={email} onChange={(e) => setEmail(e.target.value)}
              className={inputClass} style={inputStyle} placeholder="you@company.com" required autoFocus />
            {error && <p className="text-[12px] mt-3" style={{ color: "var(--danger)" }}>{error}</p>}
            <button type="submit" disabled={loading}
              className="w-full mt-4 px-4 py-2.5 rounded-lg text-[13px] font-semibold flex items-center justify-center gap-2"
              style={{ background: "var(--text-primary)", color: "var(--bg-root)" }}>
              {loading ? <Loader2 size={14} className="animate-spin" /> : null} Send reset link
            </button>
            <button type="button" onClick={() => { setMode("login"); setError(""); }}
              className="w-full mt-3 text-[12px] font-medium" style={{ color: "var(--text-muted)" }}>
              Back to sign in
            </button>
          </form>
        )}
      </div>
    </div>
  );
}
