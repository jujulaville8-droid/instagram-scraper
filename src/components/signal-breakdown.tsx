"use client";

import type { Lead } from "@/lib/types";

interface SignalDef {
  label: string;
  points: number;
  check: (lead: Lead) => boolean;
}

const SIGNALS: SignalDef[] = [
  {
    label: "No website",
    points: 30,
    check: (l) => !l.website_url,
  },
  {
    label: "Uses Linktree",
    points: 20,
    check: (l) => l.has_linktree,
  },
  {
    label: "DM-based business",
    points: 25,
    check: (l) => l.bio_keywords.length > 0,
  },
  {
    label: "Small & active",
    points: 15,
    check: (l) => l.follower_count < 1000 && l.post_count > 20,
  },
  {
    label: "Business category",
    points: 10,
    check: (l) => {
      const patterns = [
        /salon/i, /restaurant/i, /shop/i, /boutique/i, /bakery/i,
        /barber/i, /fitness/i, /photographer/i, /catering/i, /cleaning/i,
        /nails/i, /hair/i, /makeup/i, /tattoo/i, /florist/i,
        /cafe/i, /bar\b/i, /gym/i, /studio/i, /coach/i,
        /tutor/i, /plumb/i, /electric/i, /landscap/i, /tailor/i,
      ];
      return patterns.some((p) => p.test(l.bio ?? ""));
    },
  },
];

interface SignalBreakdownProps {
  lead: Lead;
}

export function SignalBreakdown({ lead }: SignalBreakdownProps) {
  return (
    <div className="flex flex-col gap-1.5">
      <span className="text-[10px] font-medium uppercase tracking-[0.2em] text-zinc-500">
        Scoring Signals
      </span>
      <div className="flex flex-col gap-1">
        {SIGNALS.map((signal) => {
          const active = signal.check(lead);
          return (
            <div
              key={signal.label}
              className={`flex items-center justify-between px-2.5 py-1.5 text-xs ${
                active
                  ? "border border-emerald-500/20 bg-emerald-500/5 text-emerald-400"
                  : "border border-zinc-800 bg-zinc-900/50 text-zinc-600 line-through"
              }`}
            >
              <span>{signal.label}</span>
              <span className="font-mono text-[10px] tabular-nums">
                +{signal.points}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
