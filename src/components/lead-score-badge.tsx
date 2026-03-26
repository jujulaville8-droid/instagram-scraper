"use client";

interface LeadScoreBadgeProps {
  score: number;
  size?: "sm" | "md" | "lg";
}

export function LeadScoreBadge({ score, size = "sm" }: LeadScoreBadgeProps) {
  const isHot = score >= 70;
  const isWarm = score >= 40 && score < 70;

  const sizeClasses = {
    sm: "h-7 w-12 text-xs",
    md: "h-9 w-14 text-sm",
    lg: "h-11 w-16 text-base",
  };

  return (
    <span className="relative inline-flex">
      {/* Glow effect for hot leads */}
      {isHot && (
        <span className="absolute inset-0 animate-pulse rounded-sm bg-emerald-500/20 blur-sm" />
      )}
      <span
        className={`relative inline-flex items-center justify-center font-[family-name:var(--font-jetbrains)] font-bold tabular-nums ${sizeClasses[size]} ${
          isHot
            ? "border border-emerald-500/40 bg-emerald-500/10 text-emerald-400 shadow-[0_0_12px_rgba(16,185,129,0.15)]"
            : isWarm
              ? "border border-amber-500/30 bg-amber-500/10 text-amber-400"
              : "border border-zinc-700/50 bg-zinc-800/50 text-zinc-500"
        }`}
      >
        {score}
      </span>
    </span>
  );
}
