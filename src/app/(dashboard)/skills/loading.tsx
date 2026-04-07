export default function SkillsLoading() {
  return (
    <div className="px-10 py-10 max-w-[900px]">
      <div className="mb-10">
        <div className="skeleton h-9 w-28 mb-2" />
        <div className="skeleton h-4 w-44" />
      </div>

      {Array.from({ length: 2 }).map((_, s) => (
        <div key={s} className="mb-10">
          <div className="flex items-center gap-2 mb-1">
            <div className="skeleton h-3.5 w-3.5" />
            <div className="skeleton h-3 w-24" />
            <div className="skeleton h-4 w-6 rounded" />
          </div>
          <div className="space-y-1 mt-3">
            {Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="border rounded-lg px-4 py-3 flex items-center justify-between"
                style={{ borderColor: "var(--border-subtle)", background: "var(--bg-surface)" }}>
                <div className="flex items-center gap-2">
                  <div className="skeleton h-3 w-3" />
                  <div className="skeleton h-4 w-28" />
                </div>
                <div className="skeleton h-3 w-48" />
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}
