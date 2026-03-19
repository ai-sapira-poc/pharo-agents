"use client";

import { useState } from "react";
import { ChevronRight, Copy, Check, X, FileText, User } from "lucide-react";
import type { SkillEntry } from "@/lib/skills-data";

export function SkillDetail({ skill }: { skill: SkillEntry }) {
  const [isOpen, setIsOpen] = useState(false);
  const [copied, setCopied] = useState(false);

  const handleCopy = (e: React.MouseEvent) => {
    e.stopPropagation();
    navigator.clipboard.writeText(skill.path);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <>
      {/* Row */}
      <button
        onClick={() => setIsOpen(true)}
        className="w-full flex items-center gap-4 border rounded-lg px-4 py-3 text-left transition-all group"
        style={{ background: "var(--bg-surface)", borderColor: "var(--border-subtle)" }}
        onMouseEnter={(e) => { e.currentTarget.style.borderColor = "var(--text-primary)"; }}
        onMouseLeave={(e) => { e.currentTarget.style.borderColor = "var(--border-subtle)"; }}
      >
        <FileText size={14} strokeWidth={1.5} style={{ color: "var(--text-muted)", flexShrink: 0 }} />
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <span className="text-[13px] font-semibold">{skill.name}</span>
            {skill.agentId !== "all" && (
              <span className="text-[10px] font-mono px-1.5 py-0.5 rounded"
                style={{ background: "var(--bg-raised)", color: "var(--text-muted)" }}>
                {skill.agentName}
              </span>
            )}
          </div>
          <p className="text-[11px] truncate mt-0.5" style={{ color: "var(--text-muted)" }}>
            {skill.description}
          </p>
        </div>
        <button onClick={handleCopy} className="flex-shrink-0 p-1 rounded transition-colors"
          style={{ color: "var(--text-muted)" }}
          title="Copy path">
          {copied ? <Check size={13} /> : <Copy size={13} />}
        </button>
        <ChevronRight size={14} strokeWidth={1.5}
          className="flex-shrink-0 opacity-0 group-hover:opacity-60 transition-opacity"
          style={{ color: "var(--text-muted)" }} />
      </button>

      {/* Slide-over detail panel */}
      {isOpen && (
        <div className="fixed inset-0 z-50 flex justify-end">
          {/* Backdrop */}
          <div className="absolute inset-0" style={{ background: "rgba(0,0,0,0.3)" }}
            onClick={() => setIsOpen(false)} />
          
          {/* Panel */}
          <div className="relative w-[600px] h-full overflow-y-auto border-l"
            style={{ background: "var(--bg-surface)", borderColor: "var(--border-subtle)" }}>
            
            {/* Header */}
            <div className="sticky top-0 z-10 flex items-center justify-between px-6 py-4 border-b"
              style={{ background: "var(--bg-surface)", borderColor: "var(--border-subtle)" }}>
              <div>
                <h3 className="text-[15px] font-semibold">{skill.name}</h3>
                <div className="flex items-center gap-2 mt-0.5">
                  <User size={11} strokeWidth={1.5} style={{ color: "var(--text-muted)" }} />
                  <span className="text-[11px]" style={{ color: "var(--text-muted)" }}>
                    {skill.agentId === "all" ? "All agents" : skill.agentName}
                  </span>
                  <span className="text-[10px] font-mono px-1.5 py-0.5 rounded"
                    style={{ background: "var(--bg-raised)", color: "var(--text-muted)" }}>
                    {skill.category}
                  </span>
                </div>
              </div>
              <button onClick={() => setIsOpen(false)} className="p-1.5 rounded-lg transition-colors"
                style={{ color: "var(--text-muted)" }}
                onMouseEnter={(e) => { e.currentTarget.style.background = "var(--bg-raised)"; }}
                onMouseLeave={(e) => { e.currentTarget.style.background = "transparent"; }}>
                <X size={16} />
              </button>
            </div>

            {/* Content */}
            <div className="px-6 py-5">
              <p className="text-[13px] leading-relaxed mb-4" style={{ color: "var(--text-secondary)" }}>
                {skill.description}
              </p>

              <div className="mb-6">
                <span className="text-[10px] font-semibold uppercase tracking-[0.1em] block mb-1.5"
                  style={{ color: "var(--text-muted)" }}>File Path</span>
                <code className="text-[11px] font-mono block px-3 py-2 rounded-md break-all"
                  style={{ background: "var(--bg-raised)", color: "var(--text-secondary)" }}>
                  {skill.path}
                </code>
              </div>

              {/* Markdown editor placeholder */}
              <div className="mb-4">
                <span className="text-[10px] font-semibold uppercase tracking-[0.1em] block mb-1.5"
                  style={{ color: "var(--text-muted)" }}>Content (SKILL.md)</span>
                <div className="border rounded-lg overflow-hidden" style={{ borderColor: "var(--border-subtle)" }}>
                  <div className="flex items-center justify-between px-3 py-2 border-b text-[11px]"
                    style={{ background: "var(--bg-raised)", borderColor: "var(--border-subtle)", color: "var(--text-muted)" }}>
                    <span>Markdown</span>
                    <span className="font-mono">SKILL.md</span>
                  </div>
                  <textarea
                    className="w-full min-h-[400px] p-4 text-[12px] font-mono leading-relaxed resize-y focus:outline-none"
                    style={{
                      background: "var(--bg-surface)",
                      color: "var(--text-primary)",
                      border: "none",
                    }}
                    defaultValue={`# ${skill.name}\n\n${skill.description}\n\n---\n\n> Content loaded from: ${skill.path}\n> \n> Edit this skill's SKILL.md here. Changes will be saved\n> to the agent's workspace on the gateway host.`}
                    placeholder="Loading skill content..."
                  />
                </div>
              </div>

              {/* Actions */}
              <div className="flex items-center gap-2">
                <button className="px-4 py-2 text-[12px] font-semibold rounded-lg transition-colors"
                  style={{ background: "var(--text-primary)", color: "var(--bg-root)" }}>
                  Save Changes
                </button>
                <button className="px-4 py-2 text-[12px] font-medium rounded-lg border transition-colors"
                  style={{ borderColor: "var(--border-default)", color: "var(--text-secondary)" }}>
                  <span className="flex items-center gap-1.5">
                    <Copy size={12} /> Copy to Agent...
                  </span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
