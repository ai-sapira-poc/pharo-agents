import { Suspense } from "react";
import { LoginForm } from "./login-form";

export default function LoginPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center" style={{ background: "var(--bg-root)" }}>
        <p className="text-[13px]" style={{ color: "var(--text-muted)" }}>Loading...</p>
      </div>
    }>
      <LoginForm />
    </Suspense>
  );
}
