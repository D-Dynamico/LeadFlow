"use client";

import { useEffect, useState } from "react";

import { LeadTimelineDialog } from "@/components/timeline/LeadTimelineDialog";
import { useLeadFilters } from "@/hooks/useLeadFilters";
import { useLeads } from "@/hooks/useLeads";
import { browserTimeZone } from "@/lib/dates";

import { AddLeadDialog } from "./AddLeadDialog";
import { LeadList } from "./LeadList";
import { LeadToolbar } from "./LeadToolbar";

export function LeadsScreen() {
  const [tz] = useState(browserTimeZone);
  const { status, q, leadId, setStatus, setQuery, openLead, closeLead } =
    useLeadFilters();
  const leads = useLeads({ status, q, tz });
  const [addingLead, setAddingLead] = useState(false);

  // "N" opens Add Lead (ARCHITECTURE.md, UX details), unless the user is typing or a
  // dialog is already open.
  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key.toLowerCase() !== "n") return;
      if (event.metaKey || event.ctrlKey || event.altKey) return;
      const target = event.target as HTMLElement | null;
      if (target?.closest("input, textarea, select, [contenteditable], [role=dialog]")) return;
      if (leadId !== null) return;
      event.preventDefault();
      setAddingLead(true);
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [leadId]);

  return (
    <div className="flex flex-col gap-6">
      <LeadToolbar
        status={status}
        q={q}
        counts={leads.data?.counts}
        onStatusChange={setStatus}
        onQueryChange={setQuery}
        onAddLead={() => setAddingLead(true)}
      />
      <LeadList
        data={leads.data}
        isPending={leads.isPending}
        error={leads.error}
        onRetry={() => void leads.refetch()}
        tz={tz}
        filtered={status !== null || q !== ""}
        onSelect={openLead}
      />
      <LeadTimelineDialog leadId={leadId} tz={tz} onClose={closeLead} />
      <AddLeadDialog open={addingLead} onOpenChange={setAddingLead} />
    </div>
  );
}
