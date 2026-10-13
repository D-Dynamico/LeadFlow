# Session state

Updated: Wed 14 Oct 2026. Deadline: Fri 16 Oct.

## Done
- S1 to S3: API complete for every endpoint in API.md; 65 tests, all mutation checks pass.
- S4 Frontend list: exit criteria pass (checked in Chrome against seeded data). Typed client
  with error envelope, `useLeads`, Pinned and All sections, `LeadRow`, `StatusBadge`,
  `FollowUpChip`, time ago, debounced search, status chips with counts, `?status=&q=` in the URL.

## Now
- Stage S5 Dialog and mutations (WORKFLOWS.md, Build stages). Not started.

## Next
1. S5: `?lead=<id>` opens `LeadTimelineDialog` (`GET /leads/{id}?tz=`, `/discussions`);
   404 closes it and clears the param. `StatusSelect` (optimistic, rollback + toast).
   `AddDiscussionForm` with quick picks, Cmd/Ctrl+Enter. `AddLeadDialog`, `N` shortcut.
   `hooks/useLeadMutations.ts` with cache updates (ARCHITECTURE.md, Cache updates).
   Needs react-hook-form, zod, a toast (shadcn sonner), shadcn dialog, select, textarea.
2. S6: polish, README, screenshots, video, deploy decision.

## Notes
- `useLeadFilters` writes the URL with `router.replace`; keep `lead` alongside `status` and `q`.
- `SearchInput` only adopts URL changes it did not push itself, so typing is never clobbered.
- The lead list is a client subtree under `<Suspense>` in `page.tsx` (needed for `useSearchParams`).
- `next dev` writes `web/AGENTS.md`; delete it, never commit it (or set `agentRules: false`).
- Docker web image builds take about 10 minutes; use `npm run dev` with `docker compose stop web`
  for UI work. Seed with `docker compose exec api python -m scripts.seed --reset`.
- POSTs and PATCH return `follow_up_state` in UTC; write the lead into caches, then invalidate.

## Open questions
- Deploy target (DECISIONS.md, Open), decide Day 3.
