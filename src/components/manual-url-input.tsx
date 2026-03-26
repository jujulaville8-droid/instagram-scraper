"use client";

import { useState, useTransition } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Loader2 } from "lucide-react";

interface ManualUrlInputProps {
  onSubmit: (url: string) => Promise<{ success: boolean; error?: string }>;
}

export function ManualUrlInput({ onSubmit }: ManualUrlInputProps) {
  const [url, setUrl] = useState("");
  const [isPending, startTransition] = useTransition();
  const [message, setMessage] = useState<{
    type: "success" | "error";
    text: string;
  } | null>(null);

  function handleSubmit() {
    if (!url.trim()) return;
    setMessage(null);

    startTransition(async () => {
      const result = await onSubmit(url.trim());
      if (result.success) {
        setMessage({ type: "success", text: "Lead added successfully" });
        setUrl("");
      } else {
        setMessage({
          type: "error",
          text: result.error ?? "Failed to fetch profile",
        });
      }
    });
  }

  return (
    <div className="flex flex-col gap-2">
      <div className="flex items-center gap-2">
        <Input
          value={url}
          onChange={(e) => setUrl(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") handleSubmit();
          }}
          placeholder="Paste Instagram URL..."
          disabled={isPending}
          className="h-9 flex-1 border-zinc-800 bg-zinc-900 text-zinc-100 placeholder:text-zinc-600 focus-visible:border-emerald-500/50 focus-visible:ring-emerald-500/20"
        />
        <Button
          onClick={handleSubmit}
          disabled={isPending || !url.trim()}
          className="h-9 bg-emerald-600 px-4 text-xs font-medium uppercase tracking-wider text-white hover:bg-emerald-500"
        >
          {isPending ? (
            <Loader2 className="size-4 animate-spin" />
          ) : (
            "Fetch"
          )}
        </Button>
      </div>
      {message && (
        <p
          className={`text-xs ${
            message.type === "success" ? "text-emerald-400" : "text-red-400"
          }`}
        >
          {message.text}
        </p>
      )}
    </div>
  );
}
