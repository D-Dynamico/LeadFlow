import { BellRing, CloudOff, Inbox, Plus, SearchX, Users, type LucideIcon } from "lucide-react";
import type { ReactNode } from "react";

import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import type { Lead, LeadList as LeadListData } from "@/lib/types";
import { cn } from "@/lib/utils";

import { LEAD_ROW_GRID, LeadRow } from "./LeadRow";

type Props = {
  data: LeadListData | undefined;
  isPending: boolean;
  error: Error | null;
  onRetry: () => void;
  tz: string;
  filtered: boolean;
  onSelect: (id: string) => void;
  onAddLead: () => void;
};

/** Pinned section, then everything else, in the order the API returns (D-4). */
export function LeadList(props: Props) {
  const { data, isPending, error, onRetry, tz, filtered, onSelect, onAddLead } = props;
  if (isPending) return <LeadListSkeleton />;
  // A failed background refetch keeps showing the cached list; the error only matters
  // when there is nothing to show.
  if (!data) {
    return (
      <EmptyState icon={CloudOff} title="Could not load leads" text={error?.message}>
        <Button variant="outline" size="sm" onClick={onRetry}>
          Try again
        </Button>
      </EmptyState>
    );
  }
  if (data.pinned.length === 0 && data.others.length === 0) {
    return filtered ? (
      <EmptyState icon={SearchX} title="No leads match" text="Try another search or status." />
    ) : (
      <EmptyState icon={Inbox} title="No leads yet" text="Leads you add will show up here.">
        <Button size="sm" onClick={onAddLead}>
          <Plus data-icon="inline-start" />
          Add lead
        </Button>
      </EmptyState>
    );
  }
  // Counts of the states the API already assigned (R-2); nothing is recomputed here.
  const overdue = data.pinned.filter((lead) => lead.follow_up_state === "overdue").length;
  const dueToday = data.pinned.length - overdue;
  return (
    <div className="flex flex-col gap-6">
      {data.pinned.length > 0 && (
        <Section
          title="Today's follow-ups"
          icon={BellRing}
          tone="attention"
          leads={data.pinned}
          tz={tz}
          onSelect={onSelect}
          summary={
            <>
              {overdue > 0 && (
                <span className="rounded-full bg-red-100 px-2 py-0.5 text-red-700">
                  {overdue} overdue
                </span>
              )}
              {dueToday > 0 && (
                <span className="rounded-full bg-amber-100 px-2 py-0.5 text-amber-800">
                  {dueToday} due today
                </span>
              )}
            </>
          }
        />
      )}
      {data.others.length > 0 && (
        <Section
          title="All leads"
          icon={Users}
          tone="plain"
          leads={data.others}
          tz={tz}
          onSelect={onSelect}
          summary={<span className="text-muted-foreground">{data.others.length}</span>}
        />
      )}
    </div>
  );
}

type SectionProps = {
  title: string;
  icon: LucideIcon;
  tone: "attention" | "plain";
  summary: ReactNode;
  leads: Lead[];
  tz: string;
  onSelect: (id: string) => void;
};

function Section({ title, icon: Icon, tone, summary, leads, tz, onSelect }: SectionProps) {
  return (
    <section
      aria-label={title}
      className={cn(
        "overflow-hidden rounded-xl border bg-card shadow-xs",
        tone === "attention" && "border-amber-200/80",
      )}
    >
      <header
        className={cn(
          "flex items-center gap-2 border-b px-4 py-2.5 sm:px-5",
          tone === "attention" ? "border-amber-200/80 bg-amber-50/70" : "bg-muted/40",
        )}
      >
        <Icon
          className={cn("size-4", tone === "attention" ? "text-amber-600" : "text-muted-foreground")}
          aria-hidden
        />
        <h2 className="text-sm font-semibold">{title}</h2>
        <div className="flex items-center gap-1.5 text-xs font-medium tabular-nums">{summary}</div>
      </header>
      <div
        className={cn(
          "hidden border-b px-5 py-2 text-[11px] font-medium tracking-wide text-muted-foreground uppercase",
          LEAD_ROW_GRID,
        )}
        aria-hidden
      >
        <span>Lead</span>
        <span>Latest note</span>
        <span>Follow-up</span>
        <span>Status</span>
      </div>
      <ul className="divide-y">
        {leads.map((lead) => (
          <LeadRow key={lead.id} lead={lead} tz={tz} onSelect={onSelect} />
        ))}
      </ul>
    </section>
  );
}

type EmptyStateProps = { icon: LucideIcon; title: string; text?: string; children?: ReactNode };

function EmptyState({ icon: Icon, title, text, children }: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center rounded-xl border border-dashed bg-card px-6 py-14 text-center">
      <span className="flex size-11 items-center justify-center rounded-full bg-accent text-accent-foreground">
        <Icon className="size-5" aria-hidden />
      </span>
      <p className="mt-4 font-medium">{title}</p>
      {text && <p className="mt-1 max-w-sm text-sm text-muted-foreground">{text}</p>}
      {children && <div className="mt-5">{children}</div>}
    </div>
  );
}

export function LeadListSkeleton() {
  return (
    <div className="overflow-hidden rounded-xl border bg-card shadow-xs">
      <div className="border-b bg-muted/40 px-5 py-3">
        <Skeleton className="h-4 w-28" />
      </div>
      <ul className="divide-y" aria-busy="true" aria-label="Loading leads">
        {Array.from({ length: 5 }, (_, i) => (
          <li key={i} className="flex items-center gap-4 px-5 py-4">
            <Skeleton className="size-9 rounded-full" />
            <div className="flex w-40 flex-col gap-1.5">
              <Skeleton className="h-3.5 w-32" />
              <Skeleton className="h-3 w-20" />
            </div>
            <Skeleton className="hidden h-3.5 flex-1 sm:block" />
            <Skeleton className="h-5 w-20 rounded-full" />
          </li>
        ))}
      </ul>
    </div>
  );
}
