import { TrendingUp } from "lucide-react";
import { Suspense } from "react";

import { LeadListSkeleton } from "@/components/leads/LeadList";
import { LeadsScreen } from "@/components/leads/LeadsScreen";

export default function Home() {
  return (
    <>
      <header className="sticky top-0 z-30 border-b bg-card/80 backdrop-blur-md">
        <div className="mx-auto flex h-14 w-full max-w-6xl items-center gap-2.5 px-4 sm:px-6">
          <span className="flex size-7 items-center justify-center rounded-lg bg-gradient-to-br from-indigo-500 to-violet-600 text-white shadow-sm">
            <TrendingUp className="size-4" aria-hidden />
          </span>
          <span className="text-[15px] font-semibold tracking-tight">LeadFlow</span>
          <span className="ml-2 hidden rounded-full border bg-muted/60 px-2 py-0.5 text-[11px] font-medium text-muted-foreground sm:inline">
            Mini CRM
          </span>
        </div>
      </header>
      <main className="mx-auto flex w-full max-w-6xl flex-1 flex-col gap-6 px-4 py-8 sm:px-6">
        <Suspense fallback={<LeadListSkeleton />}>
          <LeadsScreen />
        </Suspense>
      </main>
    </>
  );
}
