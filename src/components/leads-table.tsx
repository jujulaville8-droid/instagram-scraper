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
import { ArrowUpDown } from "lucide-react";

type SortField = "lead_score" | "created_at" | "display_name";
type SortDir = "asc" | "desc";

const STATUS_COLORS: Record<LeadStatus, string> = {
  new: "bg-zinc-600/20 text-zinc-400 border-zinc-600/30",
  reviewed: "bg-blue-500/20 text-blue-400 border-blue-500/30",
  contacted: "bg-yellow-500/20 text-yellow-400 border-yellow-500/30",
  replied: "bg-emerald-500/20 text-emerald-400 border-emerald-500/30",
  converted: "bg-emerald-400/20 text-emerald-300 border-emerald-400/30",
  dismissed: "bg-red-500/20 text-red-400 border-red-500/30",
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
        className="inline-flex items-center gap-1 text-zinc-400 hover:text-zinc-200"
      >
        {children}
        <ArrowUpDown
          className={`size-3 ${sortField === field ? "text-emerald-400" : "text-zinc-600"}`}
        />
      </button>
    );
  }

  return (
    <div className="flex flex-col gap-4">
      {/* Filter row */}
      <div className="flex items-center gap-3">
        <div className="flex items-center gap-2">
          <span className="text-[10px] font-medium uppercase tracking-widest text-zinc-500">
            Status
          </span>
          <Select value={statusFilter} onValueChange={(v) => setStatusFilter(v ?? "all")}>
            <SelectTrigger className="h-7 w-[120px] border-zinc-800 bg-zinc-900 text-xs text-zinc-300">
              <SelectValue />
            </SelectTrigger>
            <SelectContent className="border-zinc-800 bg-zinc-900">
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
          <span className="text-[10px] font-medium uppercase tracking-widest text-zinc-500">
            Min Score
          </span>
          <Select value={minScore} onValueChange={(v) => setMinScore(v ?? "0")}>
            <SelectTrigger className="h-7 w-[80px] border-zinc-800 bg-zinc-900 text-xs text-zinc-300">
              <SelectValue />
            </SelectTrigger>
            <SelectContent className="border-zinc-800 bg-zinc-900">
              <SelectItem value="0">0+</SelectItem>
              <SelectItem value="20">20+</SelectItem>
              <SelectItem value="40">40+</SelectItem>
              <SelectItem value="60">60+</SelectItem>
              <SelectItem value="70">70+</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <span className="ml-auto text-[10px] font-medium uppercase tracking-widest text-zinc-600">
          {filtered.length} lead{filtered.length !== 1 ? "s" : ""}
        </span>
      </div>

      {/* Table */}
      <div className="overflow-hidden border border-zinc-800">
        <Table>
          <TableHeader>
            <TableRow className="border-zinc-800 hover:bg-transparent">
              <TableHead className="w-10 text-[10px] uppercase tracking-widest text-zinc-500" />
              <TableHead className="text-[10px] uppercase tracking-widest text-zinc-500">
                Handle
              </TableHead>
              <TableHead className="text-[10px] uppercase tracking-widest text-zinc-500">
                <SortButton field="display_name">Name</SortButton>
              </TableHead>
              <TableHead className="text-[10px] uppercase tracking-widest text-zinc-500">
                <SortButton field="lead_score">Score</SortButton>
              </TableHead>
              <TableHead className="text-[10px] uppercase tracking-widest text-zinc-500">
                Hashtag
              </TableHead>
              <TableHead className="text-[10px] uppercase tracking-widest text-zinc-500">
                Status
              </TableHead>
              <TableHead className="text-[10px] uppercase tracking-widest text-zinc-500">
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
                  className={`cursor-pointer border-zinc-800 transition-colors ${
                    selectedId === lead.id
                      ? "bg-zinc-800/60"
                      : "hover:bg-zinc-900"
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
                  <TableCell className="font-mono text-xs text-emerald-400">
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
                      className={`inline-flex items-center border px-2 py-0.5 text-[10px] font-medium uppercase tracking-wider ${STATUS_COLORS[lead.status]}`}
                    >
                      {lead.status}
                    </span>
                  </TableCell>

                  {/* Created */}
                  <TableCell className="text-xs tabular-nums text-zinc-500">
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
