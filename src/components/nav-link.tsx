"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Grid3x3, Layers, Server, Sliders } from "lucide-react";

const iconMap: Record<string, React.ComponentType<{ size: number; strokeWidth: number }>> = {
  Grid3x3, Layers, Server, Sliders,
};

export function NavLink({ href, label, iconName }: { href: string; label: string; iconName: string }) {
  const pathname = usePathname();
  const isActive = href === "/" ? pathname === "/" : pathname.startsWith(href);
  const Icon = iconMap[iconName] || Grid3x3;

  return (
    <Link href={href}
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
