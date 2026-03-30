"use client";

import { useRouter, usePathname, useSearchParams } from "next/navigation";
import { Server } from "lucide-react";

interface Gateway {
  id: string;
  name: string;
  status: string;
  agent_count: number;
}

export function GatewaySelector({ gateways, currentId }: { gateways: Gateway[]; currentId: string | null }) {
  const router = useRouter();
  const pathname = usePathname();

  const handleChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const gwId = e.target.value;
    // Preserve current path, update gateway param
    const params = new URLSearchParams();
    if (gwId) params.set("gw", gwId);
    router.push(`${pathname}${params.toString() ? '?' + params.toString() : ''}`);
  };

  return (
    <div className="px-5 py-3 border-b" style={{ borderColor: "var(--border-subtle)" }}>
      <div className="flex items-center gap-2 mb-1.5">
        <Server size={12} strokeWidth={1.5} style={{ color: "var(--text-muted)" }} />
        <span className="text-[10px] font-semibold uppercase tracking-[0.1em]" style={{ color: "var(--text-muted)" }}>
          Workspace
        </span>
      </div>
      <select
        value={currentId || ""}
        onChange={handleChange}
        className="w-full text-[13px] font-medium px-2.5 py-1.5 rounded-md border appearance-none cursor-pointer"
        style={{
          background: "var(--bg-raised)",
          borderColor: "var(--border-subtle)",
          color: "var(--text-primary)",
        }}
      >
        {gateways.length === 0 && <option value="">No gateways connected</option>}
        {gateways.map((gw) => (
          <option key={gw.id} value={gw.id}>
            {gw.name} ({gw.agent_count} agents)
          </option>
        ))}
      </select>
    </div>
  );
}
