"use client";

import { useState, useCallback } from "react";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from "@/components/ui/sheet";
import { LeadScoreBadge } from "@/components/lead-score-badge";
import { SignalBreakdown } from "@/components/signal-breakdown";
import { StatusPipeline } from "@/components/status-pipeline";
import { DraftEditor } from "@/components/draft-editor";
import { Textarea } from "@/components/ui/textarea";
import type { Lead, Draft } from "@/lib/types";
import { ExternalLink, Globe, AlertCircle } from "lucide-react";

interface LeadDetailProps {
  lead: Lead | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onUpdateStatus: (leadId: string, status: string) => Promise<void>;
  onUpdateNotes: (leadId: string, notes: string) => Promise<void>;
  onGenerateDraft: (leadId: string) => Promise<Draft | null>;
  onGetDrafts: (leadId: string) => Promise<Draft[]>;
  onMarkDraftSent: (draftId: string) => Promise<void>;
}

export function LeadDetail({
  lead,
  open,
  onOpenChange,
  onUpdateStatus,
  onUpdateNotes,
  onGenerateDraft,
  onGetDrafts,
  onMarkDraftSent,
}: LeadDetailProps) {
  const [notes, setNotes] = useState(lead?.notes ?? "");
  const [prevLeadId, setPrevLeadId] = useState<string | null>(null);

  // Reset notes when lead changes
  if (lead && lead.id !== prevLeadId) {
    setPrevLeadId(lead.id);
    setNotes(lead.notes ?? "");
  }

  const handleNotesBlur = useCallback(() => {
    if (!lead) return;
    if (notes !== (lead.notes ?? "")) {
      onUpdateNotes(lead.id, notes);
    }
  }, [lead, notes, onUpdateNotes]);

  if (!lead) return null;

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent
        side="right"
        className="flex w-full flex-col overflow-y-auto border-zinc-800 bg-zinc-950 sm:max-w-lg"
      >
        <SheetHeader className="gap-0 border-b border-zinc-800 pb-4">
          {/* Header: avatar + handle + name + score */}
          <div className="flex items-start gap-3">
            {lead.profile_pic_url ? (
              <img
                src={lead.profile_pic_url}
                alt=""
                className="size-12 object-cover"
              />
            ) : (
              <div className="flex size-12 items-center justify-center bg-zinc-800 text-lg font-bold uppercase text-zinc-400">
                {(lead.display_name ?? lead.instagram_handle)
                  .replace("@", "")
                  .charAt(0)}
              </div>
            )}
            <div className="flex flex-1 flex-col gap-0.5">
              <div className="flex items-center gap-2">
                <SheetTitle className="font-mono text-sm text-emerald-400">
                  {lead.instagram_handle}
                </SheetTitle>
                <LeadScoreBadge score={lead.lead_score} />
              </div>
              <SheetDescription className="text-xs text-zinc-400">
                {lead.display_name ?? "Unknown"}
              </SheetDescription>
            </div>
          </div>
        </SheetHeader>

        <div className="flex flex-1 flex-col gap-5 px-4 py-4">
          {/* Bio */}
          {lead.bio && (
            <div className="flex flex-col gap-1">
              <span className="text-[10px] font-medium uppercase tracking-[0.2em] text-zinc-500">
                Bio
              </span>
              <p className="text-xs leading-relaxed text-zinc-300">
                {lead.bio}
              </p>
            </div>
          )}

          {/* Stats row */}
          <div className="grid grid-cols-3 gap-2">
            <StatBox label="Followers" value={formatNum(lead.follower_count)} />
            <StatBox
              label="Following"
              value={formatNum(lead.following_count)}
            />
            <StatBox label="Posts" value={formatNum(lead.post_count)} />
          </div>

          {/* Website */}
          <div className="flex flex-col gap-1">
            <span className="text-[10px] font-medium uppercase tracking-[0.2em] text-zinc-500">
              Website
            </span>
            {lead.website_url ? (
              <a
                href={lead.website_url}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-1.5 text-xs text-emerald-400 hover:text-emerald-300"
              >
                <Globe className="size-3" />
                {lead.website_url.replace(/^https?:\/\/(www\.)?/, "").replace(/\/$/, "")}
                <ExternalLink className="size-2.5" />
              </a>
            ) : (
              <span className="flex items-center gap-1.5 text-xs text-red-400">
                <AlertCircle className="size-3" />
                No website
              </span>
            )}
          </div>

          {/* Signal Breakdown */}
          <SignalBreakdown lead={lead} />

          {/* Status Pipeline */}
          <StatusPipeline
            leadId={lead.id}
            currentStatus={lead.status}
            onUpdateStatus={onUpdateStatus}
          />

          {/* Notes */}
          <div className="flex flex-col gap-1.5">
            <span className="text-[10px] font-medium uppercase tracking-[0.2em] text-zinc-500">
              Notes
            </span>
            <Textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              onBlur={handleNotesBlur}
              placeholder="Add personal notes..."
              className="min-h-16 resize-none border-zinc-800 bg-zinc-900/80 text-xs text-zinc-300 placeholder:text-zinc-600"
            />
          </div>

          {/* Drafts */}
          <DraftEditor
            leadId={lead.id}
            instagramHandle={lead.instagram_handle}
            onGenerateDraft={onGenerateDraft}
            onGetDrafts={onGetDrafts}
            onMarkSent={onMarkDraftSent}
          />
        </div>
      </SheetContent>
    </Sheet>
  );
}

function StatBox({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex flex-col items-center gap-0.5 border border-zinc-800 bg-zinc-900/50 px-2 py-2">
      <span className="text-sm font-bold tabular-nums text-zinc-200">
        {value}
      </span>
      <span className="text-[10px] uppercase tracking-wider text-zinc-500">
        {label}
      </span>
    </div>
  );
}

function formatNum(n: number): string {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `${(n / 1_000).toFixed(1)}K`;
  return n.toString();
}

