export default function Loading() {
  return (
    <div className="max-w-7xl mx-auto py-6 px-4 sm:px-6 lg:px-8 space-y-6 animate-pulse">
      {/* Header skeleton */}
      <div className="rounded-2xl border border-white/5 bg-white/[0.02] p-7 h-36" />

      {/* Connect card skeleton */}
      <div className="rounded-2xl border border-white/5 bg-white/[0.02] p-8 space-y-4">
        <div className="h-6 w-48 bg-white/5 rounded-lg" />
        <div className="h-4 w-72 bg-white/5 rounded-lg" />
        <div className="h-12 w-full bg-white/5 rounded-xl" />
        <div className="h-12 w-40 bg-white/5 rounded-xl" />
      </div>

      {/* Stats grid skeleton */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <div
            key={i}
            className="rounded-2xl border border-white/5 bg-white/[0.02] p-5 h-28"
          />
        ))}
      </div>

      {/* Charts skeleton */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="rounded-2xl border border-white/5 bg-white/[0.02] p-6 h-64" />
        <div className="rounded-2xl border border-white/5 bg-white/[0.02] p-6 h-64" />
      </div>
    </div>
  );
}
