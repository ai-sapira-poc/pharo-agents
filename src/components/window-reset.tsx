"use client";

import { useEffect, useState } from "react";
import { Timer } from "lucide-react";

export function WindowReset({ resetAt }: { resetAt: string }) {
  const [remaining, setRemaining] = useState("");

  useEffect(() => {
    const update = () => {
      const diff = new Date(resetAt).getTime() - Date.now();
      if (diff <= 0) {
        setRemaining("Resetting...");
        return;
      }
      const h = Math.floor(diff / 3600000);
      const m = Math.floor((diff % 3600000) / 60000);
      setRemaining(`${h}h ${m}m`);
    };
    update();
    const interval = setInterval(update, 60000);
    return () => clearInterval(interval);
  }, [resetAt]);

  return (
    <div className="border rounded-lg p-4" style={{ borderColor: 'var(--border-subtle)', background: 'var(--bg-surface)' }}>
      <div className="flex items-center justify-between">
        <span className="text-[11px] font-medium uppercase tracking-[0.1em]" style={{ color: 'var(--text-muted)' }}>
          Window Reset
        </span>
        <Timer size={14} strokeWidth={1.5} style={{ color: 'var(--text-muted)' }} />
      </div>
      <p className="text-[26px] font-medium mt-2" style={{ fontFamily: 'var(--font-heading)', fontStyle: 'italic' }}>
        {remaining}
      </p>
      <p className="text-[10px] font-mono mt-1" style={{ color: 'var(--text-muted)' }}>5h rolling window</p>
    </div>
  );
}
