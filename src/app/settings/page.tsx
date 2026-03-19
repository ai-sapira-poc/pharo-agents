export default function SettingsPage() {
  return (
    <div className="px-8 py-8 max-w-[1200px]">
      <div className="mb-8">
        <h1 className="text-[22px] font-bold tracking-tight">Settings</h1>
        <p className="text-[13px] mt-1" style={{ color: 'var(--text-muted)' }}>
          Gateway configuration, channels, and access management
        </p>
      </div>
      <div className="rounded-xl border p-16 text-center"
        style={{ background: 'var(--bg-surface)', borderColor: 'var(--border-subtle)' }}>
        <div className="text-4xl mb-3 opacity-40">◉</div>
        <p className="text-[13px] font-medium" style={{ color: 'var(--text-muted)' }}>
          Settings panel coming in Phase 2
        </p>
        <p className="text-[11px] mt-1" style={{ color: 'var(--text-muted)' }}>
          Agent config, channel bindings, cron management
        </p>
      </div>
    </div>
  );
}
