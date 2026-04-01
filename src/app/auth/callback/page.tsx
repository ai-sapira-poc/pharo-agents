"use client";

import { useEffect, useState } from "react";
import { createSupabaseBrowser } from "@/lib/supabase-browser";
import { Loader2 } from "lucide-react";

export default function AuthCallback() {
  const [error, setError] = useState("");

  useEffect(() => {
    const supabase = createSupabaseBrowser();

    // The hash fragment contains the tokens from Supabase magic link
    // e.g. #access_token=...&refresh_token=...&token_type=bearer
    const hashParams = new URLSearchParams(window.location.hash.substring(1));
    const accessToken = hashParams.get("access_token");
    const refreshToken = hashParams.get("refresh_token");

    if (accessToken && refreshToken) {
      // Set the session manually from the hash tokens
      supabase.auth.setSession({
        access_token: accessToken,
        refresh_token: refreshToken,
      }).then(({ error }) => {
        if (error) {
          setError(error.message);
        } else {
          // Clear hash and redirect
          window.location.replace("/");
        }
      });
    } else {
      // Check URL search params for code-based flow
      const params = new URLSearchParams(window.location.search);
      const code = params.get("code");
      if (code) {
        supabase.auth.exchangeCodeForSession(code).then(({ error }) => {
          if (error) setError(error.message);
          else window.location.replace("/");
        });
      } else {
        // No token or code found — check if already authenticated
        supabase.auth.getSession().then(({ data: { session } }) => {
          if (session) window.location.replace("/");
          else setError("No authentication token found. Please try again.");
        });
      }
    }
  }, []);

  return (
    <div className="min-h-screen flex items-center justify-center" style={{ background: "var(--bg-root)" }}>
      <div className="text-center">
        {error ? (
          <>
            <p className="text-[13px] mb-4" style={{ color: "var(--danger)" }}>{error}</p>
            <a href="/auth/login" className="text-[12px] font-medium" style={{ color: "var(--text-muted)" }}>
              Back to sign in
            </a>
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
