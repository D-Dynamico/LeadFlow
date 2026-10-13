# Session state

Updated: Wed 14 Oct 2026. Deadline: Fri 16 Oct.

## Done
- S1 to S4: API complete (65 tests, all mutation checks pass); list, search, filters, URL state.
- S5 Dialog and mutations: exit criteria pass (checked by hand in Chrome). `?lead=<id>` opens
  the timeline dialog; add note with quick picks and Ctrl/Cmd+Enter; optimistic status select
  with rollback + toast; mark follow-up done; Add Lead dialog with `N`. Every functional rubric
  item works; the list updates without a visible refetch.

## Now
- Stage S6 Polish and delivery (WORKFLOWS.md, Build stages). Not started.

## Next
1. Mobile check (rows stack, dialog full height), empty and error states pass, small visual fixes.
2. README: setup (Docker and manual), tests, seed, decisions summary linking DECISIONS.md, API
   table, How I used AI, known limitations, next steps. Screenshots in `docs/screenshots/`.
3. Walkthrough video (2 to 3 min), optional deploy (DECISIONS.md, Open), definition of done.

## Notes
- Mutation hooks live in `hooks/useLeadMutations.ts`; reads and query keys in `hooks/useLeads.ts`.
- POST discussion and PATCH return `follow_up_state` in UTC, so the hooks write the lead into
  caches and then invalidate `["lead", id]` and `["leads"]` to refetch in the viewer's tz.
- Lists and the timeline keep cached data when a background refetch fails; the error state only
  shows when nothing is cached.
- `agentRules: false` in `web/next.config.ts` keeps `next dev` from writing `web/AGENTS.md`.
- Docker web image builds take about 10 minutes; use `npm run dev` with `docker compose stop web`
  and make sure no orphaned `next` process holds port 3000 afterwards.

## Open questions
- Deploy target (DECISIONS.md, Open), decide Day 3.
