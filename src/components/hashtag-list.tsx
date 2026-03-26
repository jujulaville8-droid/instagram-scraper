"use client";

import { useState, useTransition } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogClose,
} from "@/components/ui/dialog";
import { Plus, Trash2, Hash } from "lucide-react";
import type { HashtagConfig } from "@/lib/types";

interface HashtagListProps {
  hashtags: HashtagConfig[];
  leadCounts: Record<string, number>;
  addHashtagAction: (
    hashtag: string,
    marketLabel: string,
  ) => Promise<{ success: boolean; error?: string }>;
  toggleActiveAction: (id: string, isActive: boolean) => Promise<void>;
  deleteHashtagAction: (id: string) => Promise<void>;
}

export function HashtagList({
  hashtags,
  leadCounts,
  addHashtagAction,
  toggleActiveAction,
  deleteHashtagAction,
}: HashtagListProps) {
  const [dialogOpen, setDialogOpen] = useState(false);
  const [hashtagInput, setHashtagInput] = useState("");
  const [marketLabel, setMarketLabel] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  function handleAdd() {
    if (!hashtagInput.trim() || !marketLabel.trim()) return;
    setError(null);

    startTransition(async () => {
      const result = await addHashtagAction(hashtagInput.trim(), marketLabel.trim());
      if (result.success) {
        setHashtagInput("");
        setMarketLabel("");
        setDialogOpen(false);
      } else {
        setError(result.error ?? "Failed to add hashtag");
      }
    });
  }

  function handleToggle(id: string, checked: boolean) {
    startTransition(async () => {
      await toggleActiveAction(id, checked);
    });
  }

  function handleDelete(id: string) {
    startTransition(async () => {
      await deleteHashtagAction(id);
    });
  }

  function formatDate(dateStr: string | null): string {
    if (!dateStr) return "Never";
    return new Date(dateStr).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  }

  return (
    <>
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <span className="inline-block h-2 w-2 bg-emerald-500" />
          <h1 className="text-xs font-medium uppercase tracking-[0.2em] text-zinc-300">
            Hashtags
          </h1>
          <span className="text-[10px] tabular-nums text-zinc-600">
            {hashtags.length}
          </span>
        </div>

        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger
            render={
              <Button className="h-8 gap-1.5 bg-emerald-600 px-3 text-xs font-medium uppercase tracking-wider text-white hover:bg-emerald-500" />
            }
          >
            <Plus className="size-3.5" />
            Add Hashtag
          </DialogTrigger>
          <DialogContent className="border-zinc-800 bg-zinc-900">
            <DialogHeader>
              <DialogTitle className="text-xs font-medium uppercase tracking-[0.2em] text-zinc-300">
                Add Hashtag
              </DialogTitle>
            </DialogHeader>
            <div className="flex flex-col gap-3">
              <Input
                value={hashtagInput}
                onChange={(e) => setHashtagInput(e.target.value)}
                placeholder="#antiguasalon"
                className="border-zinc-700 bg-zinc-800 text-zinc-100 placeholder:text-zinc-600 focus-visible:border-emerald-500/50 focus-visible:ring-emerald-500/20"
              />
              <Input
                value={marketLabel}
                onChange={(e) => setMarketLabel(e.target.value)}
                placeholder="Market label (e.g. Beauty)"
                onKeyDown={(e) => {
                  if (e.key === "Enter") handleAdd();
                }}
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
                  onClick={handleAdd}
                  disabled={isPending || !hashtagInput.trim() || !marketLabel.trim()}
                  className="bg-emerald-600 text-xs font-medium uppercase tracking-wider text-white hover:bg-emerald-500"
                >
                  Add
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Card grid */}
      {hashtags.length === 0 ? (
        <div className="flex flex-col items-center justify-center gap-2 rounded-lg border border-dashed border-zinc-800 py-16">
          <Hash className="size-8 text-zinc-700" />
          <p className="text-sm text-zinc-500">No hashtags configured. Add one to start discovering leads.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {hashtags.map((h) => (
            <div
              key={h.id}
              className="flex flex-col gap-3 rounded-lg border border-zinc-800 bg-zinc-900 p-4"
            >
              <div className="flex items-start justify-between">
                <div className="flex flex-col gap-1">
                  <span className="text-sm font-medium text-zinc-100">
                    {h.hashtag}
                  </span>
                  <span className="text-[10px] uppercase tracking-widest text-zinc-500">
                    {h.market_label}
                  </span>
                </div>
                <Switch
                  checked={h.is_active}
                  onCheckedChange={(checked) => handleToggle(h.id, checked)}
                  className="data-checked:bg-emerald-600"
                />
              </div>

              <div className="flex items-center gap-4 text-[11px] text-zinc-500">
                <span>
                  <span className="tabular-nums text-zinc-300">
                    {leadCounts[h.hashtag] ?? 0}
                  </span>{" "}
                  leads
                </span>
                <span>
                  Scraped:{" "}
                  <span className="text-zinc-400">
                    {formatDate(h.last_scraped_at)}
                  </span>
                </span>
              </div>

              <div className="border-t border-zinc-800 pt-3">
                <p className="mb-2 font-mono text-[10px] leading-relaxed text-zinc-600">
                  npx tsx scripts/scrape.ts {h.hashtag}
                </p>
                <div className="flex justify-end">
                  <Button
                    variant="ghost"
                    size="icon-sm"
                    onClick={() => handleDelete(h.id)}
                    className="text-zinc-600 hover:bg-red-950/50 hover:text-red-400"
                  >
                    <Trash2 className="size-3.5" />
                  </Button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </>
  );
}
