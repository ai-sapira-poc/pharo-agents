"use client";

import { useState } from "react";
import { ChevronRight, Copy, Check, X, FileText, User, Save, Loader2 } from "lucide-react";
import type { SkillEntry } from "@/lib/skills-data";

export function SkillDetail({ skill }: { skill: SkillEntry }) {
  const [isOpen, setIsOpen] = useState(false);
  const [copied, setCopied] = useState(false);
  const [content, setContent] = useState(skill.content || "");
  const [saving, setSaving] = useState(false);
  const [saveStatus, setSaveStatus] = useState<"" | "saved" | "error">("");

  const handleCopy = (e: React.MouseEvent) => {
    e.stopPropagation();
    navigator.clipboard.writeText(skill.path);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleSave = async () => {
    setSaving(true);
    setSaveStatus("");

    // Get gateway_id from the URL params
    const params = new URLSearchParams(window.location.search);
    const gwId = params.get("gw");

    const res = await fetch("/api/skills/save", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        gateway_id: gwId,
        skill_path: skill.path,
        content,
      }),
    });

    const data = await res.json();
    setSaving(false);
    setSaveStatus(data.ok ? "saved" : "error");
    setTimeout(() => setSaveStatus(""), 3000);
  };

  return (
    <>
      <button
        onClick={() => setIsOpen(true)}
        className="w-full flex items-center gap-4 border rounded-lg px-4 py-3 text-left transition-all group agent-card"
        style={{ background: "var(--bg-surface)" }}>
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
          style={{ color: "var(--text-muted)" }} title="Copy path">
          {copied ? <Check size={13} /> : <Copy size={13} />}
        </button>
        <ChevronRight size={14} strokeWidth={1.5}
          className="flex-shrink-0 opacity-0 group-hover:opacity-60 transition-opacity"
          style={{ color: "var(--text-muted)" }} />
      </button>

      {isOpen && (
        <div className="fixed inset-0 z-50 flex justify-end">
          <div className="absolute inset-0" style={{ background: "rgba(0,0,0,0.3)" }}
            onClick={() => setIsOpen(false)} />
          
          <div className="relative w-[600px] h-full overflow-y-auto border-l"
            style={{ background: "var(--bg-surface)", borderColor: "var(--border-subtle)" }}>
            
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
              <button onClick={() => setIsOpen(false)} className="p-1.5 rounded-lg"
                style={{ color: "var(--text-muted)" }}>
                <X size={16} />
              </button>
            </div>

            <div className="px-6 py-5">
              <div className="mb-4">
                <span className="text-[10px] font-semibold uppercase tracking-[0.1em] block mb-1.5"
                  style={{ color: "var(--text-muted)" }}>File Path</span>
                <code className="text-[11px] font-mono block px-3 py-2 rounded-md break-all"
                  style={{ background: "var(--bg-raised)", color: "var(--text-secondary)" }}>
                  {skill.path}
                </code>
              </div>

              <div className="mb-4">
                <span className="text-[10px] font-semibold uppercase tracking-[0.1em] block mb-1.5"
                  style={{ color: "var(--text-muted)" }}>SKILL.md</span>
                <div className="border rounded-lg overflow-hidden" style={{ borderColor: "var(--border-subtle)" }}>
                  <div className="flex items-center justify-between px-3 py-2 border-b text-[11px]"
                    style={{ background: "var(--bg-raised)", borderColor: "var(--border-subtle)", color: "var(--text-muted)" }}>
                    <span>Markdown</span>
                    <span className="font-mono">SKILL.md</span>
                  </div>
                  <textarea
                    className="w-full min-h-[400px] p-4 text-[12px] font-mono leading-relaxed resize-y focus:outline-none"
                    style={{ background: "var(--bg-surface)", color: "var(--text-primary)", border: "none" }}
                    value={content}
                    onChange={(e) => setContent(e.target.value)}
                    placeholder="Skill content..."
                  />
                </div>
              </div>

              <div className="flex items-center gap-3">
                <button onClick={handleSave} disabled={saving}
                  className="px-4 py-2 text-[12px] font-semibold rounded-lg flex items-center gap-2 transition-all"
                  style={{ background: "var(--text-primary)", color: "var(--bg-root)" }}>
                  {saving ? <Loader2 size={13} className="animate-spin" /> : <Save size={13} />}
                  Save Changes
                </button>
                {saveStatus === "saved" && (
                  <span className="text-[12px] flex items-center gap-1" style={{ color: "var(--success)" }}>
                    <Check size={13} /> Saved
                  </span>
                )}
                {saveStatus === "error" && (
                  <span className="text-[12px]" style={{ color: "var(--danger)" }}>
                    Failed to save — gateway may not support remote writes
                  </span>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
