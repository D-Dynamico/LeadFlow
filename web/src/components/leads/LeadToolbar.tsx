"use client";

import { Plus, Search } from "lucide-react";
import { useEffect, useState } from "react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { LEAD_STATUSES, type LeadCounts, type LeadStatus } from "@/lib/types";

import { STATUS_LABELS } from "./StatusBadge";

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
    <div className="flex flex-col gap-3">
      <div className="flex items-center gap-2">
        <SearchInput q={q} onQueryChange={onQueryChange} />
        <Button type="button" onClick={onAddLead} className="ml-auto" title="Add lead (N)">
          <Plus data-icon="inline-start" />
          Add lead
        </Button>
      </div>
      <div className="flex flex-wrap gap-2" role="group" aria-label="Filter by status">
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
            count={counts?.[value]}
            active={status === value}
            onClick={() => onStatusChange(value)}
          />
        ))}
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
    <div className="relative flex-1 sm:max-w-sm">
      <Search className="pointer-events-none absolute top-1/2 left-2.5 size-4 -translate-y-1/2 text-muted-foreground" />
      <Input
        type="search"
        value={text}
        onChange={(event) => setText(event.target.value)}
        placeholder="Search by name"
        aria-label="Search leads by name"
        className="pl-8"
      />
    </div>
  );
}

type ChipProps = { label: string; count: number | undefined; active: boolean; onClick: () => void };

function StatusChip({ label, count, active, onClick }: ChipProps) {
  return (
    <Button
      type="button"
      size="sm"
      variant={active ? "default" : "outline"}
      aria-pressed={active}
      onClick={onClick}
      className="rounded-full"
    >
      {label}
      {count !== undefined && <span className="tabular-nums opacity-70">{count}</span>}
    </Button>
  );
}
