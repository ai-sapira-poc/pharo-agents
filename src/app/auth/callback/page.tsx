"use client";

import { useEffect, useState } from "react";
import { createSupabaseBrowser } from "@/lib/supabase-browser";
import { Loader2 } from "lucide-react";

export default function AuthCallback() {
  const [error, setError] = useState("");

  useEffect(() => {
    const supabase = createSupabaseBrowser();
    
    // Handle the auth callback (magic link, password reset, etc.)
    supabase.auth.onAuthStateChange((event, session) => {
      if (event === "SIGNED_IN" && session) {
        window.location.href = "/";
      }
    });

    // Also try to exchange code if present in URL
    const params = new URLSearchParams(window.location.search);
    const code = params.get("code");
    if (code) {
      supabase.auth.exchangeCodeForSession(code).then(({ error }) => {
        if (error) setError(error.message);
        else window.location.href = "/";
      });
    }

    // Check if already signed in (token in hash fragment)
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session) window.location.href = "/";
    });
  }, []);

  return (
    <div className="min-h-screen flex items-center justify-center" style={{ background: "var(--bg-root)" }}>
      <div className="text-center">
        {error ? (
          <>
            <p className="text-[13px] mb-4" style={{ color: "var(--danger)" }}>{error}</p>
            <a href="/auth/login" className="text-[12px] font-medium" style={{ color: "var(--text-muted)" }}>Back to sign in</a>
          </>
        ) : (
          <>
            <Loader2 size={24} className="animate-spin mx-auto mb-4" style={{ color: "var(--text-muted)" }} />
            <p className="text-[13px]" style={{ color: "var(--text-muted)" }}>Signing you in...</p>
          </>
        )}
      </div>
    </div>
  );
}
