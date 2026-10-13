import { Suspense } from "react";

import { LeadListSkeleton } from "@/components/leads/LeadList";
import { LeadsScreen } from "@/components/leads/LeadsScreen";

export default function Home() {
  return (
    <main className="mx-auto flex w-full max-w-5xl flex-1 flex-col gap-6 px-4 py-8 sm:px-6">
      <header>
        <h1 className="text-2xl font-semibold tracking-tight">LeadFlow</h1>
        <p className="text-sm text-muted-foreground">Leads, discussions, and follow-ups.</p>
      </header>
      <Suspense fallback={<LeadListSkeleton />}>
        <LeadsScreen />
      </Suspense>
    </main>
  );
}
