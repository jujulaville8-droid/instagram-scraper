export default function CampaignsLoading() {
  return (
    <div className="flex flex-col gap-6">
      {/* Header skeleton */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <span className="inline-block h-2 w-2 bg-emerald-500" />
          <div className="h-3 w-24 animate-pulse rounded bg-zinc-800" />
        </div>
        <div className="h-8 w-32 animate-pulse rounded bg-zinc-800" />
      </div>

      {/* Campaign card skeletons */}
      <div className="grid grid-cols-1 gap-3 lg:grid-cols-2">
        {Array.from({ length: 4 }).map((_, i) => (
          <div
            key={i}
            className="flex flex-col gap-3 rounded-lg border border-zinc-800 bg-zinc-900 p-4"
          >
            <div className="flex items-start justify-between">
              <div className="flex flex-col gap-2">
                <div className="h-4 w-36 animate-pulse rounded bg-zinc-800" />
                <div className="h-3 w-20 animate-pulse rounded bg-zinc-800" />
              </div>
              <div className="size-7 animate-pulse rounded bg-zinc-800" />
            </div>
            <div className="flex items-center gap-4">
              <div className="h-3 w-16 animate-pulse rounded bg-zinc-800" />
              <div className="h-3 w-20 animate-pulse rounded bg-zinc-800" />
              <div className="h-3 w-16 animate-pulse rounded bg-zinc-800" />
              <div className="h-3 w-20 animate-pulse rounded bg-zinc-800" />
            </div>
            <div className="h-2.5 w-24 animate-pulse rounded bg-zinc-800" />
          </div>
        ))}
      </div>
    </div>
  );
}
