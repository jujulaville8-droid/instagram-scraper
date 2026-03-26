"use client";

interface LeadScoreBadgeProps {
  score: number;
}

export function LeadScoreBadge({ score }: LeadScoreBadgeProps) {
  const bg =
    score >= 70
      ? "bg-emerald-500/20 text-emerald-400 border-emerald-500/30"
      : score >= 40
        ? "bg-yellow-500/20 text-yellow-400 border-yellow-500/30"
        : "bg-zinc-600/20 text-zinc-400 border-zinc-600/30";

  return (
    <span
      className={`inline-flex h-6 w-10 items-center justify-center border text-xs font-bold tabular-nums ${bg}`}
    >
      {score}
    </span>
  );
}
