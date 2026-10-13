import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import type { Lead, LeadList as LeadListData } from "@/lib/types";

import { LeadRow } from "./LeadRow";

type Props = {
  data: LeadListData | undefined;
  isPending: boolean;
  error: Error | null;
  onRetry: () => void;
  tz: string;
  filtered: boolean;
  onSelect: (id: string) => void;
};

/** Pinned section, then everything else, in the order the API returns (D-4). */
export function LeadList({ data, isPending, error, onRetry, tz, filtered, onSelect }: Props) {
  if (isPending) return <LeadListSkeleton />;
  // A failed background refetch keeps showing the cached list; the error only matters
  // when there is nothing to show.
  if (!data) {
    return (
      <div className="rounded-lg border p-6 text-center">
        <p className="font-medium">Could not load leads</p>
        <p className="mt-1 text-sm text-muted-foreground">{error?.message}</p>
        <Button variant="outline" size="sm" className="mt-4" onClick={onRetry}>
          Try again
        </Button>
      </div>
    );
  }
  if (data.pinned.length === 0 && data.others.length === 0) {
    return (
      <div className="rounded-lg border border-dashed p-10 text-center">
        <p className="font-medium">{filtered ? "No leads match" : "No leads yet"}</p>
        <p className="mt-1 text-sm text-muted-foreground">
          {filtered ? "Try another search or status." : "Leads you add will show up here."}
        </p>
      </div>
    );
  }
  return (
    <div className="flex flex-col gap-6">
      {data.pinned.length > 0 && (
        <Section title="Follow up today" leads={data.pinned} tz={tz} onSelect={onSelect} />
      )}
      {data.others.length > 0 && (
        <Section title="All leads" leads={data.others} tz={tz} onSelect={onSelect} />
      )}
    </div>
  );
}

type SectionProps = { title: string; leads: Lead[]; tz: string; onSelect: (id: string) => void };

function Section({ title, leads, tz, onSelect }: SectionProps) {
  return (
    <section aria-label={title}>
      <h2 className="mb-2 text-sm font-medium text-muted-foreground">
        {title} <span className="tabular-nums">({leads.length})</span>
      </h2>
      <ul className="divide-y overflow-hidden rounded-lg border bg-card">
        {leads.map((lead) => (
          <LeadRow key={lead.id} lead={lead} tz={tz} onSelect={onSelect} />
        ))}
      </ul>
    </section>
  );
}

export function LeadListSkeleton() {
  return (
    <ul className="divide-y rounded-lg border" aria-busy="true" aria-label="Loading leads">
      {Array.from({ length: 5 }, (_, i) => (
        <li key={i} className="flex items-center gap-4 px-4 py-4">
          <Skeleton className="h-4 w-40" />
          <Skeleton className="h-4 flex-1" />
          <Skeleton className="h-5 w-20 rounded-full" />
        </li>
      ))}
    </ul>
  );
}
