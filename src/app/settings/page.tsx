import { Sliders } from "lucide-react";
export default function SettingsPage() {
  return (
    <div className="px-10 py-10 max-w-[1000px]">
      <div className="mb-10">
        <h1 className="text-[36px] leading-tight">Settings</h1>
        <p className="text-[14px] mt-1" style={{ color: 'var(--text-muted)' }}>Gateway configuration and access</p>
      </div>
      <div className="border rounded-lg p-16 text-center" style={{ borderColor: 'var(--border-subtle)', background: 'var(--bg-surface)' }}>
        <Sliders size={32} strokeWidth={1} className="mx-auto mb-3" style={{ color: 'var(--text-muted)', opacity: 0.4 }} />
        <p className="text-[13px]" style={{ color: 'var(--text-muted)' }}>Coming in Phase 2</p>
      </div>
    </div>
  );
}
