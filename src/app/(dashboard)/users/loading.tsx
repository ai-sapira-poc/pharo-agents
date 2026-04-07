export default function UsersLoading() {
  return (
    <div className="px-10 py-10 max-w-[1000px]">
      <div className="mb-10">
        <div className="skeleton h-9 w-24 mb-2" />
        <div className="skeleton h-4 w-20" />
      </div>

      <div className="border rounded-lg overflow-hidden" style={{ borderColor: "var(--border-subtle)", background: "var(--bg-surface)" }}>
        <div className="px-5 py-2.5 border-b flex"
          style={{ background: "var(--bg-raised)", borderColor: "var(--border-subtle)" }}>
          <div className="w-3/5"><div className="skeleton h-2.5 w-10" /></div>
          <div className="w-2/5"><div className="skeleton h-2.5 w-8" /></div>
        </div>
        {Array.from({ length: 5 }).map((_, i) => (
          <div key={i} className="px-5 py-3 flex items-center"
            style={{ borderBottom: i < 4 ? "1px solid var(--border-subtle)" : undefined }}>
            <div className="w-3/5 space-y-1">
              <div className="skeleton h-3.5 w-32" />
              <div className="skeleton h-3 w-44" />
            </div>
            <div className="w-2/5">
              <div className="skeleton h-5 w-14 rounded" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
