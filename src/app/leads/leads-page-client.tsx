"use client";

import { useState, useCallback } from "react";
import { LeadsTable } from "@/components/leads-table";
import { LeadDetail } from "@/components/lead-detail";
import type { Lead, Draft } from "@/lib/types";

interface LeadsPageClientProps {
  leads: Lead[];
  updateStatusAction: (leadId: string, status: string) => Promise<void>;
  updateNotesAction: (leadId: string, notes: string) => Promise<void>;
  generateDraftAction: (leadId: string) => Promise<Draft | null>;
  getDraftsAction: (leadId: string) => Promise<Draft[]>;
  markDraftSentAction: (draftId: string) => Promise<void>;
}

export function LeadsPageClient({
  leads,
  updateStatusAction,
  updateNotesAction,
  generateDraftAction,
  getDraftsAction,
  markDraftSentAction,
}: LeadsPageClientProps) {
  const [selectedLead, setSelectedLead] = useState<Lead | null>(null);
  const [sheetOpen, setSheetOpen] = useState(false);

  const handleSelectLead = useCallback((lead: Lead) => {
    setSelectedLead(lead);
    setSheetOpen(true);
  }, []);

  const handleOpenChange = useCallback((open: boolean) => {
    setSheetOpen(open);
    if (!open) {
      setSelectedLead(null);
    }
  }, []);

  return (
    <>
      <LeadsTable leads={leads} onSelectLead={handleSelectLead} />
      <LeadDetail
        lead={selectedLead}
        open={sheetOpen}
        onOpenChange={handleOpenChange}
        onUpdateStatus={updateStatusAction}
        onUpdateNotes={updateNotesAction}
        onGenerateDraft={generateDraftAction}
        onGetDrafts={getDraftsAction}
        onMarkDraftSent={markDraftSentAction}
      />
    </>
  );
}
