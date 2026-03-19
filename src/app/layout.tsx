import type { Metadata } from "next";
import Link from "next/link";
import { ThemeToggle } from "@/components/theme-toggle";
import "./globals.css";

export const metadata: Metadata = {
  title: "Pharo Agents",
  description: "AI Agent Fleet Management",
};

const navItems = [
  { href: "/", label: "Dashboard", icon: "◎" },
  { href: "/skills", label: "Skills", icon: "◈" },
  { href: "/settings", label: "Settings", icon: "◉" },
];

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link href="https://fonts.googleapis.com/css2?family=JetBrains+Mono:wght@400;500;600&family=Plus+Jakarta+Sans:wght@400;500;600;700;800&display=swap" rel="stylesheet" />
      </head>
      <body>
        <div className="flex h-screen overflow-hidden">
          <aside className="w-[260px] flex-shrink-0 flex flex-col border-r"
            style={{ background: 'var(--bg-surface)', borderColor: 'var(--border-subtle)' }}>
            <div className="px-5 py-5 border-b" style={{ borderColor: 'var(--border-subtle)' }}>
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg flex items-center justify-center text-sm font-bold"
                  style={{ background: 'var(--accent-muted)', color: 'var(--accent)' }}>⚡</div>
                <div>
                  <h1 className="text-[15px] font-bold tracking-tight" style={{ color: 'var(--text-primary)' }}>
                    Pharo Agents
                  </h1>
                  <p className="text-[11px] font-medium tracking-wide uppercase"
                    style={{ color: 'var(--text-muted)', letterSpacing: '0.08em' }}>Fleet Control</p>
                </div>
              </div>
            </div>
            <nav className="flex-1 px-3 py-4 space-y-0.5">
              {navItems.map((item) => (
                <Link key={item.href} href={item.href}
                  className="nav-link flex items-center gap-3 px-3 py-2 rounded-lg text-[13px] font-medium">
                  <span className="text-base opacity-60">{item.icon}</span>
                  {item.label}
                </Link>
              ))}
            </nav>
            <div className="px-5 py-4 border-t space-y-3" style={{ borderColor: 'var(--border-subtle)' }}>
              <ThemeToggle />
              <div>
                <div className="flex items-center gap-2">
                  <span className="relative flex h-2 w-2">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full opacity-75"
                      style={{ background: 'var(--success)' }}></span>
                    <span className="relative inline-flex rounded-full h-2 w-2"
                      style={{ background: 'var(--success)' }}></span>
                  </span>
                  <span className="text-[11px] font-medium" style={{ color: 'var(--text-muted)' }}>Gateway connected</span>
                </div>
                <p className="text-[11px] mt-1 font-mono" style={{ color: 'var(--text-muted)' }}>localhost:18789</p>
              </div>
            </div>
          </aside>
          <main className="flex-1 overflow-y-auto" style={{ background: 'var(--bg-root)' }}>{children}</main>
        </div>
      </body>
    </html>
  );
}
