"use client";

import { useState, useRef, useEffect } from "react";
import { useRouter, usePathname, useSearchParams } from "next/navigation";
import { Server, ChevronDown, Check, Circle } from "lucide-react";

interface Gateway {
  id: string;
  name: string;
  status: string;
  agent_count: number;
}

export function GatewaySelector({ gateways, currentId }: { gateways: Gateway[]; currentId: string | null }) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const activeId = searchParams.get("gw") || currentId;
  const current = gateways.find((g) => g.id === activeId) || gateways[0];

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const select = (gwId: string) => {
    setOpen(false);
    const params = new URLSearchParams();
    if (gwId) params.set("gw", gwId);
    router.push(`${pathname}${params.toString() ? "?" + params.toString() : ""}`);
  };

  if (!gateways.length) return null;

  return (
    <div ref={ref} className="px-4 py-3 border-b relative" style={{ borderColor: "var(--border-subtle)" }}>
      <span className="text-[10px] font-semibold uppercase tracking-[0.12em] block mb-2"
        style={{ color: "var(--text-muted)" }}>
        Workspace
      </span>

      {/* Trigger */}
      <button onClick={() => setOpen(!open)}
        className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg border text-left transition-all"
        style={{
          background: "var(--bg-raised)",
          borderColor: open ? "var(--text-primary)" : "var(--border-subtle)",
        }}>
        <div className="flex-shrink-0">
          <Circle size={8} fill={current?.status === "online" ? "var(--success)" : "var(--warning)"} stroke="none" />
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-[13px] font-semibold truncate" style={{ color: "var(--text-primary)" }}>
            {current?.name || "Select workspace"}
          </p>
          <p className="text-[11px]" style={{ color: "var(--text-muted)" }}>
            {current?.agent_count || 0} agent{(current?.agent_count || 0) !== 1 ? "s" : ""}
          </p>
        </div>
        <ChevronDown size={14} strokeWidth={1.5}
          className="flex-shrink-0 transition-transform"
          style={{
            color: "var(--text-muted)",
            transform: open ? "rotate(180deg)" : "rotate(0)",
          }} />
      </button>

      {/* Dropdown */}
      {open && (
        <div className="absolute left-4 right-4 mt-1 rounded-lg border overflow-hidden z-50 shadow-lg"
          style={{
            background: "var(--bg-surface)",
            borderColor: "var(--border-subtle)",
          }}>
          {gateways.map((gw) => {
            const isSelected = gw.id === activeId;
            return (
              <button key={gw.id} onClick={() => select(gw.id)}
                className="w-full flex items-center gap-3 px-3 py-3 text-left transition-all"
                style={{
                  background: isSelected ? "var(--bg-raised)" : "transparent",
                }}
                onMouseEnter={(e) => { if (!isSelected) e.currentTarget.style.background = "var(--bg-raised)"; }}
                onMouseLeave={(e) => { if (!isSelected) e.currentTarget.style.background = "transparent"; }}>
                <div className="flex-shrink-0">
                  <Circle size={8} fill={gw.status === "online" ? "var(--success)" : "var(--warning)"} stroke="none" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-[13px] font-semibold truncate" style={{ color: "var(--text-primary)" }}>
                    {gw.name}
                  </p>
                  <p className="text-[11px]" style={{ color: "var(--text-muted)" }}>
                    {gw.agent_count} agent{gw.agent_count !== 1 ? "s" : ""}
                  </p>
                </div>
                {isSelected && (
                  <Check size={14} strokeWidth={2} className="flex-shrink-0" style={{ color: "var(--text-primary)" }} />
                )}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
