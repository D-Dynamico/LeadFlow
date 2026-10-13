import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useCallback } from "react";

import { LEAD_STATUSES, type LeadStatus } from "@/lib/types";

function parseStatus(value: string | null): LeadStatus | null {
  return LEAD_STATUSES.find((status) => status === value) ?? null;
}

/**
 * Status filter, search, and the open lead, kept in the URL so refresh and shared links
 * restore the view (ARCHITECTURE.md, URL state).
 */
export function useLeadFilters() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const pathname = usePathname();

  const status = parseStatus(searchParams.get("status"));
  const q = (searchParams.get("q") ?? "").trim();
  const leadId = searchParams.get("lead");

  const update = useCallback(
    (key: "status" | "q" | "lead", value: string | null) => {
      const params = new URLSearchParams(searchParams.toString());
      if (value) params.set(key, value);
      else params.delete(key);
      const query = params.toString();
      router.replace(query ? `${pathname}?${query}` : pathname, { scroll: false });
    },
    [pathname, router, searchParams],
  );

  const setStatus = useCallback((value: LeadStatus | null) => update("status", value), [update]);
  const setQuery = useCallback((value: string) => update("q", value.trim() || null), [update]);
  const openLead = useCallback((id: string) => update("lead", id), [update]);
  const closeLead = useCallback(() => update("lead", null), [update]);

  return { status, q, leadId, setStatus, setQuery, openLead, closeLead };
}
