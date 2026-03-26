export default function DraftsLoading() {
  return (
    <div className="flex flex-col gap-6">
      {/* Header skeleton */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <span className="inline-block h-2 w-2 bg-emerald-500" />
          <div className="h-3 w-16 animate-pulse rounded bg-zinc-800" />
        </div>
      </div>

      {/* Tabs skeleton */}
      <div className="flex items-center gap-2 rounded-lg bg-zinc-900 p-1">
        <div className="h-7 w-16 animate-pulse rounded bg-zinc-800" />
        <div className="h-7 w-16 animate-pulse rounded bg-zinc-800" />
        <div className="h-7 w-16 animate-pulse rounded bg-zinc-800" />
      </div>

      {/* Draft card skeletons */}
      <div className="flex flex-col gap-3">
        {Array.from({ length: 3 }).map((_, i) => (
          <div
            key={i}
            className="flex flex-col gap-3 rounded-lg border border-zinc-800 bg-zinc-900 p-4"
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="h-4 w-24 animate-pulse rounded bg-zinc-800" />
                <div className="h-3 w-20 animate-pulse rounded bg-zinc-800" />
              </div>
              <div className="h-5 w-12 animate-pulse rounded bg-zinc-800" />
            </div>
            <div className="rounded border border-zinc-800 bg-zinc-950 p-3">
              <div className="flex flex-col gap-2">
                <div className="h-3 w-full animate-pulse rounded bg-zinc-800" />
                <div className="h-3 w-4/5 animate-pulse rounded bg-zinc-800" />
                <div className="h-3 w-3/5 animate-pulse rounded bg-zinc-800" />
              </div>
            </div>
            <div className="flex items-center justify-between">
              <div className="h-2.5 w-20 animate-pulse rounded bg-zinc-800" />
              <div className="flex items-center gap-2">
                <div className="h-7 w-14 animate-pulse rounded bg-zinc-800" />
                <div className="h-7 w-20 animate-pulse rounded bg-zinc-800" />
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
