"use client";

import { useState, useEffect, useTransition } from "react";
import type { Draft } from "@/lib/types";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Loader2, Copy, Check, Send, ExternalLink } from "lucide-react";

interface DraftEditorProps {
  leadId: string;
  instagramHandle: string;
  onGenerateDraft: (leadId: string) => Promise<Draft | null>;
  onGetDrafts: (leadId: string) => Promise<Draft[]>;
  onMarkSent: (draftId: string) => Promise<void>;
}

export function DraftEditor({
  leadId,
  instagramHandle,
  onGenerateDraft,
  onGetDrafts,
  onMarkSent,
}: DraftEditorProps) {
  const [drafts, setDrafts] = useState<Draft[]>([]);
  const [currentDraft, setCurrentDraft] = useState("");
  const [copied, setCopied] = useState(false);
  const [isGenerating, startGenerating] = useTransition();
  const [isSending, startSending] = useTransition();
  const [activeDraftId, setActiveDraftId] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    onGetDrafts(leadId).then((d) => {
      if (!cancelled) {
        setDrafts(d);
        if (d.length > 0 && !d[0].is_sent) {
          setCurrentDraft(d[0].content);
          setActiveDraftId(d[0].id);
        }
      }
    });
    return () => {
      cancelled = true;
    };
  }, [leadId, onGetDrafts]);

  function handleGenerate() {
    startGenerating(async () => {
      const draft = await onGenerateDraft(leadId);
      if (draft) {
        setCurrentDraft(draft.content);
        setActiveDraftId(draft.id);
        setDrafts((prev) => [draft, ...prev]);
      }
    });
  }

  function handleCopy() {
    navigator.clipboard.writeText(currentDraft);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  function handleMarkSent() {
    if (!activeDraftId) return;
    const draftId = activeDraftId;
    startSending(async () => {
      await onMarkSent(draftId);
      setDrafts((prev) =>
        prev.map((d) => (d.id === draftId ? { ...d, is_sent: true } : d)),
      );
      setActiveDraftId(null);
      setCurrentDraft("");
    });
  }

  return (
    <div className="flex flex-col gap-3">
      <span className="text-[10px] font-medium uppercase tracking-[0.2em] text-zinc-500">
        Drafts
      </span>

      {/* Always-visible: Open Profile button */}
      <a
        href={`https://www.instagram.com/${instagramHandle.replace('@', '')}/`}
        target="_blank"
        rel="noopener noreferrer"
        onClick={currentDraft ? handleCopy : undefined}
        className="inline-flex w-fit items-center gap-2 border border-sky-500/30 bg-sky-500/[0.06] px-3 py-2 font-[family-name:var(--font-jetbrains)] text-[11px] font-medium text-sky-400 transition-colors hover:bg-sky-500/15 hover:text-sky-300"
      >
        <ExternalLink className="size-3.5" />
        {currentDraft ? "Copy Draft & Open Profile" : "Open Instagram Profile"}
      </a>

      {/* Generate button */}
      <Button
        variant="outline"
        size="sm"
        onClick={handleGenerate}
        disabled={isGenerating}
        className="w-fit border-emerald-500/30 text-emerald-400 hover:bg-emerald-500/10 hover:text-emerald-300"
      >
        {isGenerating ? (
          <>
            <Loader2 className="size-3 animate-spin" />
            Generating...
          </>
        ) : (
          "Generate Draft"
        )}
      </Button>

      {/* Active draft editor */}
      {(currentDraft || isGenerating) && (
        <div className="flex flex-col gap-2">
          <Textarea
            value={currentDraft}
            onChange={(e) => setCurrentDraft(e.target.value)}
            placeholder={isGenerating ? "Generating..." : "Draft content..."}
            className="min-h-24 resize-none border-zinc-800 bg-zinc-900/80 text-xs text-zinc-300 placeholder:text-zinc-600"
          />
          <div className="flex flex-wrap gap-2">
            <button
              onClick={handleCopy}
              disabled={!currentDraft}
              className="inline-flex items-center gap-1.5 border border-zinc-700 px-2.5 py-1 text-[10px] font-medium text-zinc-400 transition-colors hover:text-zinc-200 disabled:opacity-50"
            >
              {copied ? (
                <>
                  <Check className="size-3" />
                  Copied
                </>
              ) : (
                <>
                  <Copy className="size-3" />
                  Copy
                </>
              )}
            </button>
            {activeDraftId && (
              <button
                onClick={handleMarkSent}
                disabled={isSending}
                className="inline-flex items-center gap-1.5 border border-emerald-500/30 px-2.5 py-1 text-[10px] font-medium text-emerald-400 transition-colors hover:bg-emerald-500/10 disabled:opacity-50"
              >
                <Send className="size-3" />
                Mark as Sent
              </button>
            )}
          </div>
        </div>
      )}

      {/* Draft history */}
      {drafts.length > 0 && (
        <div className="flex flex-col gap-1.5">
          <span className="text-[10px] font-medium uppercase tracking-wider text-zinc-600">
            History
          </span>
          {drafts.map((draft) => (
            <div
              key={draft.id}
              className="border border-zinc-800 bg-zinc-900/50 px-2.5 py-2"
            >
              <div className="flex items-center justify-between gap-2">
                <span className="text-[10px] tabular-nums text-zinc-600">
                  {new Date(draft.created_at).toLocaleDateString("en-US", {
                    month: "short",
                    day: "numeric",
                    hour: "numeric",
                    minute: "2-digit",
                  })}
                </span>
                {draft.is_sent ? (
                  <span className="text-[10px] font-medium uppercase tracking-wider text-emerald-500">
                    Sent
                  </span>
                ) : (
                  <span className="text-[10px] font-medium uppercase tracking-wider text-zinc-600">
                    Draft
                  </span>
                )}
              </div>
              <p className="mt-1 text-[11px] leading-relaxed text-zinc-400 line-clamp-3">
                {draft.content}
              </p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
