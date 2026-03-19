import { getAllSkills } from "@/lib/skills-data";
import { Layers, Package, Wrench, FolderOpen, Search, Copy } from "lucide-react";
import { SkillDetail } from "@/components/skill-detail";

const categoryConfig = {
  default: { label: "Default", icon: Package, description: "Built-in OpenClaw skills available to all agents" },
  custom: { label: "Custom", icon: Wrench, description: "Agent-specific skills installed in their workspace" },
  project: { label: "Project", icon: FolderOpen, description: "Skills tied to a specific project or client context" },
};

export default function SkillsPage() {
  const skills = getAllSkills();
  const byCategory = {
    custom: skills.filter((s) => s.category === "custom"),
    project: skills.filter((s) => s.category === "project"),
    default: skills.filter((s) => s.category === "default"),
  };

  return (
    <div className="flex h-full">
      {/* Main list */}
      <div className="flex-1 px-10 py-10 overflow-y-auto">
        <div className="max-w-[900px]">
          <div className="mb-10">
            <h1 className="text-[36px] leading-tight">Skills</h1>
            <p className="text-[14px] mt-1" style={{ color: "var(--text-muted)" }}>
              {skills.length} skills across {new Set(skills.map((s) => s.agentId)).size} agents
            </p>
          </div>

          {(["custom", "project", "default"] as const).map((cat) => {
            const cfg = categoryConfig[cat];
            const items = byCategory[cat];
            if (!items.length) return null;

            return (
              <div key={cat} className="mb-10">
                <div className="flex items-center gap-2 mb-1">
                  <cfg.icon size={14} strokeWidth={1.5} style={{ color: "var(--text-muted)" }} />
                  <h2 className="text-[13px] font-semibold uppercase tracking-[0.08em]" style={{ color: "var(--text-muted)" }}>
                    {cfg.label} Skills
                  </h2>
                  <span className="text-[11px] font-mono px-1.5 py-0.5 rounded"
                    style={{ background: "var(--bg-raised)", color: "var(--text-muted)" }}>
                    {items.length}
                  </span>
                </div>
                <p className="text-[12px] mb-4" style={{ color: "var(--text-muted)" }}>{cfg.description}</p>

                <div className="space-y-1">
                  {items.map((skill) => (
                    <SkillDetail key={skill.id} skill={skill} />
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
