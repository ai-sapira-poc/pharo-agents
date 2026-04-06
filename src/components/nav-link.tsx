"use client";

import Link from "next/link";
import { usePathname, useSearchParams } from "next/navigation";
import { Grid3x3, Layers, Server, Sliders, Users } from "lucide-react";

const iconMap: Record<string, React.ComponentType<{ size: number; strokeWidth: number }>> = {
  Grid3x3, Layers, Server, Sliders, Users,
};

export function NavLink({ href, label, iconName }: { href: string; label: string; iconName: string }) {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const gw = searchParams.get("gw");
  const isActive = href === "/" ? pathname === "/" : pathname.startsWith(href);
  const Icon = iconMap[iconName] || Grid3x3;
  const fullHref = gw ? `${href}${href.includes("?") ? "&" : "?"}gw=${gw}` : href;

  return (
    <Link href={fullHref}
      className="flex items-center gap-3 px-3 py-2 rounded-md text-[13px] font-medium transition-all"
      style={{
        color: isActive ? "var(--text-primary)" : "var(--text-muted)",
        background: isActive ? "var(--bg-raised)" : "transparent",
        borderLeft: isActive ? "2px solid var(--text-primary)" : "2px solid transparent",
      }}>
      <Icon size={15} strokeWidth={isActive ? 2 : 1.5} />
      {label}
    </Link>
  );
}
