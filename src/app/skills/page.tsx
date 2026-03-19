import { Brain } from "lucide-react";

export default function SkillsPage() {
  return (
    <div className="px-8 py-8 max-w-[1200px]">
      <div className="mb-8">
        <h1 className="text-[22px] font-bold tracking-tight">Skills Manager</h1>
        <p className="text-[13px] mt-1" style={{ color: 'var(--text-muted)' }}>View and manage skills across all agents</p>
      </div>
      <div className="rounded-xl border p-16 text-center"
        style={{ background: 'var(--bg-surface)', borderColor: 'var(--border-subtle)' }}>
        <Brain size={40} className="mx-auto mb-3" style={{ color: 'var(--text-muted)', opacity: 0.3 }} />
        <p className="text-[13px] font-medium" style={{ color: 'var(--text-muted)' }}>Skills management coming in Phase 2</p>
        <p className="text-[11px] mt-1" style={{ color: 'var(--text-muted)' }}>View, edit, and transfer skills between agents</p>
      </div>
    </div>
  );
}
