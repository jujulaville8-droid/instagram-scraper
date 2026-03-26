export default function LeadsLoading() {
  return (
    <div className="flex flex-col gap-6">
      {/* Header skeleton */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <span className="inline-block h-2 w-2 bg-emerald-500" />
          <div className="h-3 w-16 animate-pulse rounded bg-zinc-800" />
        </div>
      </div>

      {/* URL input skeleton */}
      <div className="h-10 w-full animate-pulse rounded-lg bg-zinc-800" />

      {/* Filter row skeleton */}
      <div className="flex items-center gap-3">
        <div className="h-7 w-28 animate-pulse rounded bg-zinc-800" />
        <div className="h-7 w-20 animate-pulse rounded bg-zinc-800" />
      </div>

      {/* Table skeleton */}
      <div className="overflow-hidden border border-zinc-800">
        <div className="border-b border-zinc-800 px-4 py-3">
          <div className="flex items-center gap-6">
            <div className="h-3 w-10 animate-pulse rounded bg-zinc-800" />
            <div className="h-3 w-16 animate-pulse rounded bg-zinc-800" />
            <div className="h-3 w-14 animate-pulse rounded bg-zinc-800" />
            <div className="h-3 w-12 animate-pulse rounded bg-zinc-800" />
            <div className="h-3 w-16 animate-pulse rounded bg-zinc-800" />
            <div className="h-3 w-14 animate-pulse rounded bg-zinc-800" />
          </div>
        </div>
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i} className="flex items-center gap-4 border-b border-zinc-800/50 px-4 py-3">
            <div className="size-7 animate-pulse rounded bg-zinc-800" />
            <div className="h-3 w-24 animate-pulse rounded bg-zinc-800" />
            <div className="h-3 w-32 animate-pulse rounded bg-zinc-800" />
            <div className="h-5 w-10 animate-pulse rounded bg-zinc-800" />
            <div className="h-3 w-20 animate-pulse rounded bg-zinc-800" />
            <div className="h-5 w-16 animate-pulse rounded bg-zinc-800" />
            <div className="h-3 w-14 animate-pulse rounded bg-zinc-800" />
          </div>
        ))}
      </div>
    </div>
  );
}
