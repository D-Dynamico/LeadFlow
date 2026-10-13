import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useCallback } from "react";

import { LEAD_STATUSES, type LeadStatus } from "@/lib/types";

function parseStatus(value: string | null): LeadStatus | null {
  return LEAD_STATUSES.find((status) => status === value) ?? null;
}

/** Status filter and search, kept in the URL so refresh and shared links restore the view. */
export function useLeadFilters() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const pathname = usePathname();

  const status = parseStatus(searchParams.get("status"));
  const q = (searchParams.get("q") ?? "").trim();

  const update = useCallback(
    (key: "status" | "q", value: string | null) => {
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

  return { status, q, setStatus, setQuery };
}
