# Session state

Updated: Thu 15 Oct 2026. Deadline: Fri 16 Oct.

## Done
- S1 to S4: API complete (68 tests, all mutation checks pass); list, search, filters, URL state.
- S5 Dialog and mutations: exit criteria pass (checked in Chrome). Timeline dialog via `?lead=`,
  add note with quick picks, optimistic status select, mark done, Add Lead with `N`. Every
  functional rubric item works; the list updates without a visible refetch.
- S6 prep: demo reseed per D-16 (`scripts.seed --if-stale`, `app_meta.seeded_at`, migration
  `2465824dd1f3`).
- Deployed per D-16: web https://leadflow-web-six.vercel.app (Vercel `leadflow-web`), API
  https://leadflow-api-ebse.onrender.com (Render `leadflow-api`, Singapore), Neon `LeadFlow`
  (Singapore, PG 16, direct host). Every push to `main` redeploys both.
- Add-note follow-up is separate date and time inputs (10:00 default, quick picks fill both,
  date without time is invalid); checked in Chrome locally.
- HR mockups checked: every feature is covered. Timeline restyled to match (rail, dated note
  cards, display-only "Lead created" entry); Add Lead fields have placeholders.

## Now
- Stage S6 Polish and delivery (WORKFLOWS.md, Build stages). Mobile check next.

## Next
1. Mobile check (rows stack, dialog full height), empty and error states pass, small visual fixes.
2. README: setup (Docker and manual), tests, seed, decisions summary linking DECISIONS.md, API
   table, How I used AI, known limitations, next steps. Screenshots in `docs/screenshots/`.
3. Walkthrough video (2 to 3 min), definition of done.

## Notes
- Mutation hooks live in `hooks/useLeadMutations.ts`; reads and query keys in `hooks/useLeads.ts`.
- POST discussion and PATCH return `follow_up_state` in UTC, so the hooks write the lead into
  caches and then invalidate `["lead", id]` and `["leads"]` to refetch in the viewer's tz.
- Lists and the timeline keep cached data when a background refetch fails; the error state only
  shows when nothing is cached.
- `.env` is unreadable here (deny rule) and points tests at port 5432; run pytest with
  `TEST_DATABASE_URL=...@localhost:5433/leadflow_test`.
- `agentRules: false` in `web/next.config.ts` keeps `next dev` from writing `web/AGENTS.md`.
- Docker web image builds take about 10 minutes; use `npm run dev` with `docker compose stop web`
  and make sure no orphaned `next` process holds port 3000 afterwards.
