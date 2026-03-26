"use client";

import { useState, useTransition } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogClose,
} from "@/components/ui/dialog";
import { Plus, Trash2, Megaphone } from "lucide-react";
import type { HashtagConfig } from "@/lib/types";

interface CampaignWithStats {
  id: string;
  created_at: string;
  name: string;
  hashtag_config_id: string | null;
  template: string | null;
  hashtag?: string | null;
  total: number;
  contacted: number;
  replied: number;
  converted: number;
}

interface CampaignListProps {
  campaigns: CampaignWithStats[];
  hashtags: HashtagConfig[];
  createCampaignAction: (
    name: string,
    hashtagConfigId: string | null,
    template: string | null,
  ) => Promise<{ success: boolean; error?: string }>;
  deleteCampaignAction: (id: string) => Promise<void>;
}

export function CampaignList({
  campaigns,
  hashtags,
  createCampaignAction,
  deleteCampaignAction,
}: CampaignListProps) {
  const [dialogOpen, setDialogOpen] = useState(false);
  const [name, setName] = useState("");
  const [selectedHashtag, setSelectedHashtag] = useState("");
  const [template, setTemplate] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  function handleCreate() {
    if (!name.trim()) return;
    setError(null);

    startTransition(async () => {
      const result = await createCampaignAction(
        name.trim(),
        selectedHashtag || null,
        template.trim() || null,
      );
      if (result.success) {
        setName("");
        setSelectedHashtag("");
        setTemplate("");
        setDialogOpen(false);
      } else {
        setError(result.error ?? "Failed to create campaign");
      }
    });
  }

  function handleDelete(id: string) {
    startTransition(async () => {
      await deleteCampaignAction(id);
    });
  }

  return (
    <>
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <span className="inline-block h-2 w-2 bg-emerald-500" />
          <h1 className="text-xs font-medium uppercase tracking-[0.2em] text-zinc-300">
            Campaigns
          </h1>
          <span className="text-[10px] tabular-nums text-zinc-600">
            {campaigns.length}
          </span>
        </div>

        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger
            render={
              <Button className="h-8 gap-1.5 bg-emerald-600 px-3 text-xs font-medium uppercase tracking-wider text-white hover:bg-emerald-500" />
            }
          >
            <Plus className="size-3.5" />
            Create Campaign
          </DialogTrigger>
          <DialogContent className="border-zinc-800 bg-zinc-900 sm:max-w-md">
            <DialogHeader>
              <DialogTitle className="text-xs font-medium uppercase tracking-[0.2em] text-zinc-300">
                Create Campaign
              </DialogTitle>
            </DialogHeader>
            <div className="flex flex-col gap-3">
              <Input
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Campaign name"
                className="border-zinc-700 bg-zinc-800 text-zinc-100 placeholder:text-zinc-600 focus-visible:border-emerald-500/50 focus-visible:ring-emerald-500/20"
              />
              <select
                value={selectedHashtag}
                onChange={(e) => setSelectedHashtag(e.target.value)}
                className="h-8 rounded-lg border border-zinc-700 bg-zinc-800 px-2.5 text-sm text-zinc-100 outline-none focus-visible:border-emerald-500/50 focus-visible:ring-2 focus-visible:ring-emerald-500/20"
              >
                <option value="">No linked hashtag</option>
                {hashtags.map((h) => (
                  <option key={h.id} value={h.id}>
                    {h.hashtag} ({h.market_label})
                  </option>
                ))}
              </select>
              <Textarea
                value={template}
                onChange={(e) => setTemplate(e.target.value)}
                placeholder="Message template (optional)"
                rows={4}
                className="border-zinc-700 bg-zinc-800 text-zinc-100 placeholder:text-zinc-600 focus-visible:border-emerald-500/50 focus-visible:ring-emerald-500/20"
              />
              {error && <p className="text-xs text-red-400">{error}</p>}
              <div className="flex justify-end gap-2">
                <DialogClose
                  render={
                    <Button
                      variant="outline"
                      className="border-zinc-700 text-zinc-400 hover:bg-zinc-800 hover:text-zinc-200"
                    />
                  }
                >
                  Cancel
                </DialogClose>
                <Button
                  onClick={handleCreate}
                  disabled={isPending || !name.trim()}
                  className="bg-emerald-600 text-xs font-medium uppercase tracking-wider text-white hover:bg-emerald-500"
                >
                  Create
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Campaign cards */}
      {campaigns.length === 0 ? (
        <div className="flex flex-col items-center justify-center gap-2 rounded-lg border border-dashed border-zinc-800 py-16">
          <Megaphone className="size-8 text-zinc-700" />
          <p className="text-sm text-zinc-500">No campaigns yet. Create one to organize your outreach.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-3 lg:grid-cols-2">
          {campaigns.map((c) => (
            <div
              key={c.id}
              className="flex flex-col gap-3 rounded-lg border border-zinc-800 bg-zinc-900 p-4"
            >
              <div className="flex items-start justify-between">
                <div className="flex flex-col gap-1">
                  <span className="text-sm font-medium text-zinc-100">
                    {c.name}
                  </span>
                  {c.hashtag && (
                    <span className="text-[11px] text-emerald-400/70">
                      {c.hashtag}
                    </span>
                  )}
                </div>
                <Button
                  variant="ghost"
                  size="icon-sm"
                  onClick={() => handleDelete(c.id)}
                  className="text-zinc-600 hover:bg-red-950/50 hover:text-red-400"
                >
                  <Trash2 className="size-3.5" />
                </Button>
              </div>

              {/* Stats row */}
              <div className="flex items-center gap-4 text-[11px]">
                <span className="text-zinc-500">
                  <span className="tabular-nums text-zinc-300">{c.total}</span> leads
                </span>
                <span className="text-zinc-500">
                  <span className="tabular-nums text-yellow-400/80">{c.contacted}</span> contacted
                </span>
                <span className="text-zinc-500">
                  <span className="tabular-nums text-blue-400/80">{c.replied}</span> replied
                </span>
                <span className="text-zinc-500">
                  <span className="tabular-nums text-emerald-400">{c.converted}</span> converted
                </span>
              </div>

              {/* Template preview */}
              {c.template && (
                <div className="rounded border border-zinc-800 bg-zinc-950 p-2">
                  <p className="line-clamp-2 text-[11px] leading-relaxed text-zinc-500">
                    {c.template}
                  </p>
                </div>
              )}

              <div className="text-[10px] text-zinc-600">
                Created{" "}
                {new Date(c.created_at).toLocaleDateString("en-US", {
                  month: "short",
                  day: "numeric",
                  year: "numeric",
                })}
              </div>
            </div>
          ))}
        </div>
      )}
    </>
  );
}
