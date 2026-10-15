---
paths:
  - "web/**"
---

# Web rules (Next.js)

- Components never call `fetch`. All requests go through `src/lib/api.ts`, used via hooks in `src/hooks/`.
- Server state lives only in TanStack Query. UI state that should survive a refresh (status filter,
  search, open lead) lives in the URL (`docs/ARCHITECTURE.md#url-state`). No global state library.
- Never recompute pinning or follow-up rules on the client (D-4). Render `pinned` and `others` exactly
  as the API returns them. Only formatting ("3h ago", local date strings) happens on the client.
- Every list request sends the browser timezone: `Intl.DateTimeFormat().resolvedOptions().timeZone`.
- After a mutation: write the returned lead into the cache, then invalidate the list query
  (`docs/ARCHITECTURE.md#cache-updates`). Status change is optimistic with rollback and an error toast.
- Components stay small and presentational; folders per `docs/ARCHITECTURE.md#module-map`. Use
  shadcn/ui primitives rather than custom widgets.
- Forms use react-hook-form + zod schemas that mirror the API's validation (`docs/API.md#endpoints`).
- TypeScript strict mode. No `any` in committed code.
- Check `npm test`, `npm run lint` and `npm run typecheck` before marking a task done.
- Web-only logic changes need a Vitest test (D-17); purely visual changes note the manual check
  in the commit body. Date math belongs in `lib/dates.ts`, not in components.
