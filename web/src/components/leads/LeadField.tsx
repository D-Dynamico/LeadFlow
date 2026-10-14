import type { ReactNode } from "react";

import { Label } from "@/components/ui/label";

type Props = { id: string; label: string; error?: string; children: ReactNode };

/** Label, input and error for one lead field; used by the add and edit forms. */
export function LeadField({ id, label, error, children }: Props) {
  return (
    <div className="flex flex-col gap-1.5">
      <Label htmlFor={id}>{label}</Label>
      {children}
      {error && <p className="text-xs text-destructive">{error}</p>}
    </div>
  );
}
