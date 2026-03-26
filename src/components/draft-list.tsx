"use client";

import { useState, useTransition } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Check, Copy, Mail, MessageCircle, FileText } from "lucide-react";
import type { Draft } from "@/lib/types";

interface DraftWithLead extends Draft {
  lead_handle: string;
  lead_name: string | null;
}

interface DraftListProps {
  drafts: DraftWithLead[];
  updateDraftAction: (draftId: string, content: string) => Promise<void>;
  markSentAction: (draftId: string) => Promise<void>;
}

function DraftCard({
  draft,
  updateDraftAction,
  markSentAction,
}: {
  draft: DraftWithLead;
  updateDraftAction: (draftId: string, content: string) => Promise<void>;
  markSentAction: (draftId: string) => Promise<void>;
}) {
  const [isEditing, setIsEditing] = useState(false);
  const [editContent, setEditContent] = useState(draft.content);
  const [copied, setCopied] = useState(false);
  const [isPending, startTransition] = useTransition();

  function handleSave() {
    startTransition(async () => {
      await updateDraftAction(draft.id, editContent);
      setIsEditing(false);
    });
  }

  function handleMarkSent() {
    startTransition(async () => {
      await markSentAction(draft.id);
    });
  }

  function handleCopy() {
    navigator.clipboard.writeText(draft.content);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  return (
    <div className="flex flex-col gap-3 rounded-lg border border-zinc-800 bg-zinc-900 p-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="text-sm font-medium text-zinc-100">
            {draft.lead_handle}
          </span>
          {draft.lead_name && (
            <span className="text-[11px] text-zinc-500">{draft.lead_name}</span>
          )}
        </div>
        <div className="flex items-center gap-2">
          <Badge
            variant="outline"
            className="gap-1 border-zinc-700 text-[10px] text-zinc-400"
          >
            {draft.channel === "dm" ? (
              <MessageCircle className="size-2.5" />
            ) : (
              <Mail className="size-2.5" />
            )}
            {draft.channel.toUpperCase()}
          </Badge>
          {draft.is_sent && (
            <Badge className="bg-emerald-600/20 text-[10px] text-emerald-400">
              Sent
            </Badge>
          )}
        </div>
      </div>

      {/* Content */}
      {isEditing ? (
        <div className="flex flex-col gap-2">
          <Textarea
            value={editContent}
            onChange={(e) => setEditContent(e.target.value)}
            rows={5}
            className="border-zinc-700 bg-zinc-800 text-zinc-100 text-[12px] leading-relaxed focus-visible:border-emerald-500/50 focus-visible:ring-emerald-500/20"
          />
          <div className="flex justify-end gap-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => {
                setIsEditing(false);
                setEditContent(draft.content);
              }}
              className="text-zinc-500 hover:text-zinc-300"
            >
              Cancel
            </Button>
            <Button
              size="sm"
              onClick={handleSave}
              disabled={isPending}
              className="bg-emerald-600 text-xs text-white hover:bg-emerald-500"
            >
              Save
            </Button>
          </div>
        </div>
      ) : (
        <div
          onClick={() => !draft.is_sent && setIsEditing(true)}
          className={`rounded border border-zinc-800 bg-zinc-950 p-3 text-[12px] leading-relaxed text-zinc-400 ${
            !draft.is_sent ? "cursor-pointer hover:border-zinc-700" : ""
          }`}
        >
          <p className="whitespace-pre-wrap">{draft.content}</p>
        </div>
      )}

      {/* Footer */}
      <div className="flex items-center justify-between">
        <span className="text-[10px] text-zinc-600">
          {new Date(draft.created_at).toLocaleDateString("en-US", {
            month: "short",
            day: "numeric",
            hour: "2-digit",
            minute: "2-digit",
          })}
        </span>
        <div className="flex items-center gap-1">
          <Button
            variant="ghost"
            size="sm"
            onClick={handleCopy}
            className="gap-1 text-[11px] text-zinc-500 hover:text-zinc-300"
          >
            {copied ? (
              <Check className="size-3 text-emerald-400" />
            ) : (
              <Copy className="size-3" />
            )}
            {copied ? "Copied" : "Copy"}
          </Button>
          {!draft.is_sent && (
            <Button
              variant="ghost"
              size="sm"
              onClick={handleMarkSent}
              disabled={isPending}
              className="gap-1 text-[11px] text-zinc-500 hover:text-emerald-400"
            >
              <Check className="size-3" />
              Mark Sent
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}

export function DraftList({
  drafts,
  updateDraftAction,
  markSentAction,
}: DraftListProps) {
  const [filter, setFilter] = useState("all");

  const filteredDrafts = drafts.filter((d) => {
    if (filter === "unsent") return !d.is_sent;
    if (filter === "sent") return d.is_sent;
    return true;
  });

  return (
    <>
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <span className="inline-block h-2 w-2 bg-emerald-500" />
          <h1 className="text-xs font-medium uppercase tracking-[0.2em] text-zinc-300">
            Drafts
          </h1>
          <span className="text-[10px] tabular-nums text-zinc-600">
            {drafts.length}
          </span>
        </div>
      </div>

      {/* Filter tabs */}
      <Tabs defaultValue="all" onValueChange={(val) => setFilter(val as string)}>
        <TabsList className="bg-zinc-900">
          <TabsTrigger
            value="all"
            className="text-[11px] uppercase tracking-wider text-zinc-500 data-active:text-zinc-100"
          >
            All ({drafts.length})
          </TabsTrigger>
          <TabsTrigger
            value="unsent"
            className="text-[11px] uppercase tracking-wider text-zinc-500 data-active:text-zinc-100"
          >
            Unsent ({drafts.filter((d) => !d.is_sent).length})
          </TabsTrigger>
          <TabsTrigger
            value="sent"
            className="text-[11px] uppercase tracking-wider text-zinc-500 data-active:text-zinc-100"
          >
            Sent ({drafts.filter((d) => d.is_sent).length})
          </TabsTrigger>
        </TabsList>

        <TabsContent value="all" />
        <TabsContent value="unsent" />
        <TabsContent value="sent" />
      </Tabs>

      {/* Draft list */}
      {filteredDrafts.length === 0 ? (
        <div className="flex flex-col items-center justify-center gap-2 rounded-lg border border-dashed border-zinc-800 py-16">
          <FileText className="size-8 text-zinc-700" />
          <p className="text-sm text-zinc-500">
            {filter === "all"
              ? "No drafts yet. Generate one from a lead\u2019s detail panel."
              : `No ${filter} drafts`}
          </p>
        </div>
      ) : (
        <div className="flex flex-col gap-3">
          {filteredDrafts.map((draft) => (
            <DraftCard
              key={draft.id}
              draft={draft}
              updateDraftAction={updateDraftAction}
              markSentAction={markSentAction}
            />
          ))}
        </div>
      )}
    </>
  );
}
