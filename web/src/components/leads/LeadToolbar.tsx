"use client";

import { Plus, Search } from "lucide-react";
import { useEffect, useState, type ReactNode } from "react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { LEAD_STATUSES, type LeadCounts, type LeadStatus } from "@/lib/types";
import { cn } from "@/lib/utils";

import { STATUS_LABELS, StatusDot } from "./StatusBadge";

const SEARCH_DEBOUNCE_MS = 300;

type Props = {
  status: LeadStatus | null;
  q: string;
  counts: LeadCounts | undefined;
  onStatusChange: (status: LeadStatus | null) => void;
  onQueryChange: (q: string) => void;
  onAddLead: () => void;
};

export function LeadToolbar(props: Props) {
  const { status, q, counts, onStatusChange, onQueryChange, onAddLead } = props;
  return (
    <div className="flex flex-col gap-5">
      <div className="flex items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Leads</h1>
          <p className="mt-1 hidden text-sm text-muted-foreground sm:block">
            Every conversation in one place, and the follow-ups due today up top.
          </p>
        </div>
        <Button type="button" size="lg" onClick={onAddLead} className="shrink-0 px-3 shadow-sm" title="Add lead (N)">
          <Plus data-icon="inline-start" />
          Add lead
          <kbd aria-hidden className="ml-1 hidden rounded border border-white/25 bg-white/15 px-1.5 font-sans text-[10px] leading-4 font-medium sm:inline">
            N
          </kbd>
        </Button>
      </div>
      <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
        <div className="-mx-4 overflow-x-auto px-4 [scrollbar-width:none] sm:mx-0 sm:px-0">
          <div
            className="inline-flex gap-0.5 rounded-lg border bg-muted/70 p-0.5"
            role="group"
            aria-label="Filter by status"
          >
            <StatusChip
              label="All"
              count={counts?.all}
              active={status === null}
              onClick={() => onStatusChange(null)}
            />
            {LEAD_STATUSES.map((value) => (
              <StatusChip
                key={value}
                label={STATUS_LABELS[value]}
                dot={<StatusDot status={value} />}
                count={counts?.[value]}
                active={status === value}
                onClick={() => onStatusChange(value)}
              />
            ))}
          </div>
        </div>
        <SearchInput q={q} onQueryChange={onQueryChange} />
      </div>
    </div>
  );
}

function SearchInput({ q, onQueryChange }: { q: string; onQueryChange: (q: string) => void }) {
  const [text, setText] = useState(q);
  const [pushed, setPushed] = useState(q);
  const [seenQ, setSeenQ] = useState(q);

  // The URL changed without us (back button, shared link): show its value.
  if (q !== seenQ) {
    setSeenQ(q);
    if (q !== pushed) setText(q);
  }

  useEffect(() => {
    const next = text.trim();
    if (next === q) return;
    const timer = setTimeout(() => {
      setPushed(next);
      onQueryChange(next);
    }, SEARCH_DEBOUNCE_MS);
    return () => clearTimeout(timer);
  }, [text, q, onQueryChange]);

  return (
    <div className="relative w-full lg:w-72">
      <Search className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" />
      <Input
        type="search"
        value={text}
        onChange={(event) => setText(event.target.value)}
        placeholder="Search by name"
        aria-label="Search leads by name"
        className="h-9 bg-card pl-9 shadow-xs"
      />
    </div>
  );
}

type ChipProps = {
  label: string;
  dot?: ReactNode;
  count: number | undefined;
  active: boolean;
  onClick: () => void;
};

function StatusChip({ label, dot, count, active, onClick }: ChipProps) {
  return (
    <button
      type="button"
      aria-pressed={active}
      onClick={onClick}
      className={cn(
        "inline-flex h-8 items-center gap-1.5 rounded-md px-2.5 text-sm font-medium whitespace-nowrap transition-colors outline-none focus-visible:ring-2 focus-visible:ring-ring/50",
        active
          ? "bg-card text-foreground shadow-sm ring-1 ring-black/5"
          : "text-muted-foreground hover:text-foreground",
      )}
    >
      {dot}
      {label}
      {count !== undefined && (
        <span
          className={cn(
            "min-w-5 rounded-full px-1.5 text-center text-[11px] leading-[18px] tabular-nums",
            active ? "bg-accent text-accent-foreground" : "bg-foreground/5",
          )}
        >
          {count}
        </span>
      )}
    </button>
  );
}
