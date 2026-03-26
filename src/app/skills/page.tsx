import { getAgents } from "@/lib/openclaw-client";
import { Layers, Package, Wrench, FolderOpen, FileText } from "lucide-react";
import { SkillDetail } from "@/components/skill-detail";
import type { SkillEntry } from "@/lib/skills-data";

export const dynamic = "force-dynamic";

export default async function SkillsPage() {
  const agents = await getAgents();
  
  // Extract skills from all agents' config
  const allSkills: SkillEntry[] = [];
  
  for (const agent of agents) {
    const skills = agent.config?.skills || [];
    for (const skill of skills) {
      allSkills.push({
        id: `${agent.id}-${skill.name}`,
        name: skill.name,
        description: skill.description || "",
        category: "custom",
        agentId: agent.id,
        agentName: agent.name,
        path: skill.path || "",
        content: skill.content_preview || "",
      });
    }
  }

  // Group by agent
  const byAgent = new Map<string, { name: string; skills: SkillEntry[] }>();
  for (const skill of allSkills) {
    const existing = byAgent.get(skill.agentId) || { name: skill.agentName, skills: [] };
    existing.skills.push(skill);
    byAgent.set(skill.agentId, existing);
  }

  return (
    <div className="px-10 py-10 max-w-[900px]">
      <div className="mb-10">
        <h1 className="text-[36px] leading-tight">Skills</h1>
        <p className="text-[14px] mt-1" style={{ color: "var(--text-muted)" }}>
          {allSkills.length} skills across {byAgent.size} agents
        </p>
      </div>

      {allSkills.length === 0 ? (
        <div className="border rounded-lg p-16 text-center"
          style={{ borderColor: "var(--border-subtle)", background: "var(--bg-surface)" }}>
          <Layers size={32} strokeWidth={1} className="mx-auto mb-3" style={{ color: "var(--text-muted)", opacity: 0.4 }} />
          <p className="text-[13px] font-medium" style={{ color: "var(--text-muted)" }}>No skills reported yet</p>
          <p className="text-[11px] mt-1" style={{ color: "var(--text-muted)" }}>
            Run the reporter script on your gateways to sync skills
          </p>
        </div>
      ) : (
        Array.from(byAgent.entries()).map(([agentId, { name, skills }]) => (
          <div key={agentId} className="mb-10">
            <div className="flex items-center gap-2 mb-1">
              <Wrench size={14} strokeWidth={1.5} style={{ color: "var(--text-muted)" }} />
              <h2 className="text-[13px] font-semibold uppercase tracking-[0.08em]" style={{ color: "var(--text-muted)" }}>
                {name}
              </h2>
              <span className="text-[11px] font-mono px-1.5 py-0.5 rounded"
                style={{ background: "var(--bg-raised)", color: "var(--text-muted)" }}>
                {skills.length}
              </span>
            </div>

            <div className="space-y-1 mt-3">
              {skills.map((skill) => (
                <SkillDetail key={skill.id} skill={skill} />
              ))}
            </div>
          </div>
        ))
      )}
    </div>
  );
}
