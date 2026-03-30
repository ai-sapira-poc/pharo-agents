import type { Metadata } from "next";
import Link from "next/link";
import { ThemeToggle } from "@/components/theme-toggle";
import { NavLink } from "@/components/nav-link";
import { GatewaySelector } from "@/components/gateway-selector";
import { Activity } from "lucide-react";
import { supabase } from "@/lib/supabase";
import "./globals.css";

export const metadata: Metadata = {
  title: "Pharo Agents",
  description: "AI Agent Fleet Management",
};

const navItems = [
  { href: "/", label: "Dashboard", iconName: "Grid3x3" },
  { href: "/skills", label: "Skills", iconName: "Layers" },
  { href: "/gateways", label: "Gateways", iconName: "Server" },
  { href: "/settings", label: "Settings", iconName: "Sliders" },
  { href: "/users", label: "Users", iconName: "Users" },
];

async function getGatewaysList() {
  const { data } = await supabase
    .from("gateways")
    .select("id, name, status, agent_count")
    .order("registered_at");
  return data || [];
}

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const gateways = await getGatewaysList();
  const defaultGw = gateways[0]?.id || null;

  return (
    <html lang="en">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link href="https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,300;0,400;0,500;0,600;1,300;1,400&family=Instrument+Sans:wght@400;500;600;700&family=JetBrains+Mono:wght@400;500&display=swap" rel="stylesheet" />
      </head>
      <body>
        <div className="flex h-screen overflow-hidden">
          <aside className="w-[240px] flex-shrink-0 flex flex-col border-r"
            style={{ background: "var(--bg-surface)", borderColor: "var(--border-subtle)" }}>
            <div className="px-5 py-6 border-b" style={{ borderColor: "var(--border-subtle)" }}>
              <h1 className="text-[28px] leading-none" style={{ fontFamily: "var(--font-heading)", fontWeight: 300, fontStyle: "italic" }}>
                Pharo
              </h1>
              <p className="text-[11px] font-medium uppercase tracking-[0.15em] mt-1"
                style={{ color: "var(--text-muted)", fontFamily: "var(--font-sans)" }}>Agent Fleet</p>
            </div>
            
            <GatewaySelector gateways={gateways} currentId={defaultGw} />
            
            <nav className="flex-1 px-3 py-4 space-y-0.5">
              {navItems.map((item) => (
                <NavLink key={item.href} href={item.href} label={item.label} iconName={item.iconName} />
              ))}
            </nav>
            <div className="px-5 py-4 border-t space-y-3" style={{ borderColor: "var(--border-subtle)" }}>
              <ThemeToggle />
              <div className="flex items-center gap-2">
                <Activity size={12} style={{ color: "var(--success)" }} />
                <span className="text-[11px]" style={{ color: "var(--text-muted)" }}>
                  {gateways.length} gateway{gateways.length !== 1 ? "s" : ""}
                </span>
              </div>
            </div>
          </aside>
          <main className="flex-1 overflow-y-auto" style={{ background: "var(--bg-root)" }}>{children}</main>
        </div>
      </body>
    </html>
  );
}
