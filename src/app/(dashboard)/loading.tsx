export default function DashboardLoading() {
  return (
    <div className="px-10 py-10 max-w-[1200px]">
      <div className="mb-10">
        <div className="skeleton h-9 w-48 mb-2" />
        <div className="skeleton h-4 w-32" />
      </div>

      <div className="grid grid-cols-4 gap-4 mb-10">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="border rounded-lg p-4" style={{ borderColor: "var(--border-subtle)", background: "var(--bg-surface)" }}>
            <div className="flex items-center justify-between mb-4">
              <div className="skeleton h-3 w-16" />
              <div className="skeleton h-3.5 w-3.5 rounded-full" />
            </div>
            <div className="skeleton h-7 w-20" />
          </div>
        ))}
      </div>

      <div className="mb-5">
        <div className="skeleton h-7 w-24" />
      </div>

      <div className="space-y-3">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="border rounded-lg p-5 flex items-center gap-6"
            style={{ borderColor: "var(--border-subtle)", background: "var(--bg-surface)" }}>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-3 mb-2">
                <div className="skeleton h-2 w-2 rounded-full" />
                <div className="skeleton h-4 w-32" />
                <div className="skeleton h-3 w-20" />
              </div>
              <div className="skeleton h-3.5 w-64" />
            </div>
            <div className="flex items-center gap-8 flex-shrink-0">
              <div className="text-right space-y-1">
                <div className="skeleton h-2.5 w-10 ml-auto" />
                <div className="skeleton h-4 w-12" />
              </div>
              <div className="text-right space-y-1">
                <div className="skeleton h-2.5 w-8 ml-auto" />
                <div className="skeleton h-4 w-12" />
              </div>
              <div className="text-right space-y-1">
                <div className="skeleton h-2.5 w-12 ml-auto" />
                <div className="skeleton h-4 w-8" />
              </div>
              <div className="skeleton w-20 h-1 rounded-full" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
