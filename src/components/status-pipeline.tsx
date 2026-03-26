"use client";

import { useState, useTransition } from "react";
import type { LeadStatus } from "@/lib/types";

const PIPELINE_STATUSES: LeadStatus[] = [
  "new",
  "reviewed",
  "contacted",
  "replied",
  "converted",
];

interface StatusPipelineProps {
  leadId: string;
  currentStatus: LeadStatus;
  onUpdateStatus: (leadId: string, status: string) => Promise<void>;
}

export function StatusPipeline({
  leadId,
  currentStatus,
  onUpdateStatus,
}: StatusPipelineProps) {
  const [status, setStatus] = useState<LeadStatus>(currentStatus);
  const [isPending, startTransition] = useTransition();

  const currentIdx = PIPELINE_STATUSES.indexOf(status);
  const isDismissed = status === "dismissed";

  function handleClick(newStatus: LeadStatus) {
    if (isPending || newStatus === status) return;
    setStatus(newStatus);
    startTransition(async () => {
      await onUpdateStatus(leadId, newStatus);
    });
  }

  function handleDismiss() {
    if (isPending || isDismissed) return;
    setStatus("dismissed");
    startTransition(async () => {
      await onUpdateStatus(leadId, "dismissed");
    });
  }

  return (
    <div className="flex flex-col gap-3">
      <span className="text-[10px] font-medium uppercase tracking-[0.2em] text-zinc-500">
        Pipeline
      </span>

      {/* Stepper */}
      <div className="flex items-center gap-0">
        {PIPELINE_STATUSES.map((s, i) => {
          const isPast = !isDismissed && i < currentIdx;
          const isCurrent = !isDismissed && i === currentIdx;
          const isFuture = isDismissed || i > currentIdx;

          return (
            <div key={s} className="flex items-center">
              {i > 0 && (
                <div
                  className={`h-px w-4 ${
                    isPast || isCurrent
                      ? "bg-emerald-500/40"
                      : "bg-zinc-700"
                  }`}
                />
              )}
              <button
                onClick={() => handleClick(s)}
                disabled={isPending}
                className={`px-2 py-1 text-[10px] font-medium uppercase tracking-wider border transition-colors ${
                  isCurrent
                    ? "border-emerald-500/40 bg-emerald-500/20 text-emerald-400"
                    : isPast
                      ? "border-emerald-500/20 bg-emerald-500/5 text-emerald-600"
                      : isFuture
                        ? "border-zinc-800 bg-zinc-900/50 text-zinc-600 hover:border-zinc-700 hover:text-zinc-400"
                        : ""
                } ${isPending ? "opacity-50" : ""}`}
              >
                {s}
              </button>
            </div>
          );
        })}
      </div>

      {/* Dismiss button */}
      <button
        onClick={handleDismiss}
        disabled={isPending || isDismissed}
        className={`w-fit px-3 py-1 text-[10px] font-medium uppercase tracking-wider border transition-colors ${
          isDismissed
            ? "border-red-500/40 bg-red-500/20 text-red-400"
            : "border-zinc-800 bg-zinc-900/50 text-zinc-500 hover:border-red-500/30 hover:text-red-400"
        } ${isPending ? "opacity-50" : ""}`}
      >
        {isDismissed ? "Dismissed" : "Dismiss"}
      </button>
    </div>
  );
}
