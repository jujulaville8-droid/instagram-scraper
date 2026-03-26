"use client";

import { useState } from "react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { LeadScoreBadge } from "@/components/lead-score-badge";
import type { Lead, LeadStatus } from "@/lib/types";
// Using inline SVG for sort icon to avoid lucide dependency issues

type SortField = "lead_score" | "created_at" | "display_name";
type SortDir = "asc" | "desc";

const STATUS_COLORS: Record<LeadStatus, string> = {
  new: "border-zinc-700/40 bg-zinc-800/30 text-zinc-500",
  reviewed: "border-sky-500/30 bg-sky-500/10 text-sky-400",
  contacted: "border-amber-500/30 bg-amber-500/10 text-amber-400",
  replied: "border-emerald-500/30 bg-emerald-500/10 text-emerald-400",
  converted: "border-emerald-400/40 bg-emerald-400/15 text-emerald-300 shadow-[0_0_8px_rgba(16,185,129,0.1)]",
  dismissed: "border-red-500/20 bg-red-500/10 text-red-400/70",
};

const ALL_STATUSES: LeadStatus[] = [
  "new",
  "reviewed",
  "contacted",
  "replied",
  "converted",
  "dismissed",
];

interface LeadsTableProps {
  leads: Lead[];
  onSelectLead?: (lead: Lead) => void;
}

export function LeadsTable({ leads: initialLeads, onSelectLead }: LeadsTableProps) {
  const [sortField, setSortField] = useState<SortField>("lead_score");
  const [sortDir, setSortDir] = useState<SortDir>("desc");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [minScore, setMinScore] = useState<string>("0");
  const [selectedId, setSelectedId] = useState<string | null>(null);

  function toggleSort(field: SortField) {
    if (sortField === field) {
      setSortDir((d) => (d === "asc" ? "desc" : "asc"));
    } else {
      setSortField(field);
      setSortDir(field === "display_name" ? "asc" : "desc");
    }
  }

  const filtered = initialLeads
    .filter((l) => statusFilter === "all" || l.status === statusFilter)
    .filter((l) => l.lead_score >= Number(minScore))
    .sort((a, b) => {
      const dir = sortDir === "asc" ? 1 : -1;
      if (sortField === "lead_score") return (a.lead_score - b.lead_score) * dir;
      if (sortField === "created_at")
        return (
          (new Date(a.created_at).getTime() -
            new Date(b.created_at).getTime()) *
          dir
        );
      const aName = a.display_name ?? a.instagram_handle;
      const bName = b.display_name ?? b.instagram_handle;
      return aName.localeCompare(bName) * dir;
    });

  function SortButton({
    field,
    children,
  }: {
    field: SortField;
    children: React.ReactNode;
  }) {
    return (
      <button
        onClick={() => toggleSort(field)}
        className="inline-flex items-center gap-1.5 text-zinc-400 transition-colors hover:text-emerald-400"
      >
        {children}
        <span className={`text-[8px] ${sortField === field ? "text-emerald-400" : "text-zinc-700"}`}>
          {sortField === field ? (sortDir === "desc" ? "▼" : "▲") : "⇅"}
        </span>
      </button>
    );
  }

  return (
    <div className="flex flex-col gap-4">
      {/* Filter row */}
      <div className="flex items-center gap-3">
        <div className="flex items-center gap-2">
          <span className="font-[family-name:var(--font-jetbrains)] text-[8px] font-medium uppercase tracking-[0.25em] text-zinc-600">
            Status
          </span>
          <Select value={statusFilter} onValueChange={(v) => setStatusFilter(v ?? "all")}>
            <SelectTrigger className="h-7 w-[120px] border-emerald-500/10 bg-[#0a0d12] text-xs text-zinc-300">
              <SelectValue />
            </SelectTrigger>
            <SelectContent className="border-emerald-500/10 bg-[#0a0d12]">
              <SelectItem value="all">All</SelectItem>
              {ALL_STATUSES.map((s) => (
                <SelectItem key={s} value={s}>
                  {s.charAt(0).toUpperCase() + s.slice(1)}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="flex items-center gap-2">
          <span className="font-[family-name:var(--font-jetbrains)] text-[8px] font-medium uppercase tracking-[0.25em] text-zinc-600">
            Min Score
          </span>
          <Select value={minScore} onValueChange={(v) => setMinScore(v ?? "0")}>
            <SelectTrigger className="h-7 w-[80px] border-emerald-500/10 bg-[#0a0d12] text-xs text-zinc-300">
              <SelectValue />
            </SelectTrigger>
            <SelectContent className="border-emerald-500/10 bg-[#0a0d12]">
              <SelectItem value="0">0+</SelectItem>
              <SelectItem value="20">20+</SelectItem>
              <SelectItem value="40">40+</SelectItem>
              <SelectItem value="60">60+</SelectItem>
              <SelectItem value="70">70+</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <span className="ml-auto font-[family-name:var(--font-jetbrains)] text-[9px] font-medium uppercase tracking-[0.2em] text-zinc-700">
          {filtered.length} lead{filtered.length !== 1 ? "s" : ""}
        </span>
      </div>

      {/* Table */}
      <div className="overflow-hidden border border-emerald-500/10 bg-[#0a0d12]/60 backdrop-blur-sm">
        <Table>
          <TableHeader>
            <TableRow className="border-emerald-500/10 bg-zinc-900/30 hover:bg-transparent">
              <TableHead className="w-10 font-[family-name:var(--font-jetbrains)] text-[9px] uppercase tracking-[0.2em] text-zinc-600" />
              <TableHead className="font-[family-name:var(--font-jetbrains)] text-[9px] uppercase tracking-[0.2em] text-zinc-600">
                Handle
              </TableHead>
              <TableHead className="font-[family-name:var(--font-jetbrains)] text-[9px] uppercase tracking-[0.2em] text-zinc-600">
                <SortButton field="display_name">Name</SortButton>
              </TableHead>
              <TableHead className="font-[family-name:var(--font-jetbrains)] text-[9px] uppercase tracking-[0.2em] text-zinc-600">
                <SortButton field="lead_score">Score</SortButton>
              </TableHead>
              <TableHead className="font-[family-name:var(--font-jetbrains)] text-[9px] uppercase tracking-[0.2em] text-zinc-600">
                Hashtag
              </TableHead>
              <TableHead className="font-[family-name:var(--font-jetbrains)] text-[9px] uppercase tracking-[0.2em] text-zinc-600">
                Status
              </TableHead>
              <TableHead className="font-[family-name:var(--font-jetbrains)] text-[9px] uppercase tracking-[0.2em] text-zinc-600">
                <SortButton field="created_at">Added</SortButton>
              </TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filtered.length === 0 ? (
              <TableRow className="border-zinc-800">
                <TableCell
                  colSpan={7}
                  className="py-12 text-center text-sm text-zinc-600"
                >
                  {initialLeads.length === 0
                    ? "No leads yet. Run a scrape or paste an Instagram URL above."
                    : "No leads match the current filters."}
                </TableCell>
              </TableRow>
            ) : (
              filtered.map((lead) => (
                <TableRow
                  key={lead.id}
                  onClick={() => {
                    setSelectedId(lead.id);
                    onSelectLead?.(lead);
                  }}
                  className={`cursor-pointer border-emerald-500/[0.06] transition-all duration-150 ${
                    selectedId === lead.id
                      ? "bg-emerald-500/[0.06] shadow-[inset_2px_0_0_rgba(16,185,129,0.5)]"
                      : "hover:bg-zinc-800/40"
                  }`}
                >
                  {/* Avatar */}
                  <TableCell>
                    {lead.profile_pic_url ? (
                      <img
                        src={lead.profile_pic_url}
                        alt=""
                        className="size-7 object-cover"
                      />
                    ) : (
                      <div className="flex size-7 items-center justify-center bg-zinc-800 text-[10px] font-bold uppercase text-zinc-400">
                        {(lead.display_name ?? lead.instagram_handle)
                          .replace("@", "")
                          .charAt(0)}
                      </div>
                    )}
                  </TableCell>

                  {/* Handle */}
                  <TableCell className="font-[family-name:var(--font-jetbrains)] text-xs text-emerald-400/80">
                    {lead.instagram_handle}
                  </TableCell>

                  {/* Name */}
                  <TableCell className="text-xs text-zinc-300">
                    {lead.display_name ?? "\u2014"}
                  </TableCell>

                  {/* Score */}
                  <TableCell>
                    <LeadScoreBadge score={lead.lead_score} />
                  </TableCell>

                  {/* Source hashtag */}
                  <TableCell className="text-xs text-zinc-500">
                    {lead.source_hashtag ?? "\u2014"}
                  </TableCell>

                  {/* Status */}
                  <TableCell>
                    <span
                      className={`inline-flex items-center border px-2 py-0.5 font-[family-name:var(--font-jetbrains)] text-[9px] font-medium uppercase tracking-[0.15em] ${STATUS_COLORS[lead.status]}`}
                    >
                      {lead.status}
                    </span>
                  </TableCell>

                  {/* Created */}
                  <TableCell className="font-[family-name:var(--font-jetbrains)] text-[11px] tabular-nums text-zinc-600">
                    {new Date(lead.created_at).toLocaleDateString("en-US", {
                      month: "short",
                      day: "numeric",
                    })}
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
