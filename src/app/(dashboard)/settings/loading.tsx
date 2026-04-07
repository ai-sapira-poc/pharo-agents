export default function SettingsLoading() {
  return (
    <div className="px-10 py-10 max-w-[1000px]">
      <div className="mb-10">
        <div className="skeleton h-9 w-32 mb-2" />
        <div className="skeleton h-4 w-28" />
      </div>

      <div className="mb-8">
        <div className="flex items-center gap-2 mb-4">
          <div className="skeleton h-3.5 w-3.5" />
          <div className="skeleton h-3 w-16" />
        </div>
        <div className="border rounded-lg overflow-hidden" style={{ borderColor: "var(--border-subtle)", background: "var(--bg-surface)" }}>
          {Array.from({ length: 8 }).map((_, i) => (
            <div key={i} className="px-5 py-3 flex items-center justify-between"
              style={{ borderBottom: i < 7 ? "1px solid var(--border-subtle)" : undefined }}>
              <div className="skeleton h-3 w-20" />
              <div className="skeleton h-3 w-40" />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
