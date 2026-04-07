export default function AgentDetailLoading() {
  return (
    <div className="px-10 py-10 max-w-[1000px]">
      <div className="skeleton h-3.5 w-16 mb-8" />

      <div className="mb-10">
        <div className="flex items-center gap-3 mb-2">
          <div className="skeleton h-2.5 w-2.5 rounded-full" />
          <div className="skeleton h-3 w-14" />
          <div className="skeleton h-4 w-20 rounded" />
        </div>
        <div className="skeleton h-10 w-56 mb-2" />
        <div className="skeleton h-3.5 w-36" />
      </div>

      <div className="grid grid-cols-4 gap-4 mb-10">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="border rounded-lg p-4" style={{ borderColor: "var(--border-subtle)", background: "var(--bg-surface)" }}>
            <div className="flex items-center justify-between mb-4">
              <div className="skeleton h-2.5 w-14" />
              <div className="skeleton h-3 w-3" />
            </div>
            <div className="skeleton h-6 w-16" />
          </div>
        ))}
      </div>

      <div className="border rounded-lg p-5 mb-6" style={{ borderColor: "var(--border-subtle)", background: "var(--bg-surface)" }}>
        <div className="flex items-center justify-between mb-3">
          <div className="skeleton h-3.5 w-28" />
          <div className="skeleton h-3 w-24" />
        </div>
        <div className="skeleton w-full h-1.5 rounded-full" />
      </div>

      <div className="border rounded-lg p-5 mb-6" style={{ borderColor: "var(--border-subtle)", background: "var(--bg-surface)" }}>
        <div className="skeleton h-3.5 w-32 mb-3" />
        <div className="skeleton h-3 w-full mb-1" />
        <div className="skeleton h-3 w-3/4" />
      </div>

      <div className="border rounded-lg overflow-hidden" style={{ borderColor: "var(--border-subtle)", background: "var(--bg-surface)" }}>
        <div className="px-5 py-3 border-b" style={{ borderColor: "var(--border-subtle)" }}>
          <div className="skeleton h-3.5 w-24" />
        </div>
        {Array.from({ length: 5 }).map((_, i) => (
          <div key={i} className="px-5 py-3 flex items-center justify-between"
            style={{ borderBottom: i < 4 ? "1px solid var(--border-subtle)" : undefined }}>
            <div className="skeleton h-3 w-24" />
            <div className="skeleton h-3 w-40" />
          </div>
        ))}
      </div>
    </div>
  );
}
