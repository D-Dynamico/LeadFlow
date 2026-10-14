# Session state

Updated: Thu 15 Oct 2026. Deadline: Fri 16 Oct.

## Done
- S1 to S4: API complete (68 tests, all mutation checks pass); list, search, filters, URL state.
- S5 Dialog and mutations: exit criteria pass (checked in Chrome). Timeline dialog via `?lead=`,
  add note with quick picks, optimistic status select, mark done, Add Lead with `N`. Every
  functional rubric item works; the list updates without a visible refetch.
- S6 prep: demo reseed per D-16 (`scripts.seed --if-stale`, `app_meta.seeded_at`, migration
  `2465824dd1f3`); README has a Live demo section with TODO URLs.

## Now
- Stage S6 Polish and delivery (WORKFLOWS.md, Build stages). Deploy is next.

## Next
1. Deploy per D-16, through the providers' MCP servers once the user adds them; confirm each
   resource before creating it, free plans only. Render start command: `alembic upgrade head &&
   python -m scripts.seed --if-stale && uvicorn ...`. Wire `NEXT_PUBLIC_API_URL` and
   `FRONTEND_ORIGIN`, then fill the README Live demo URLs.
2. After deploy: split the add-note follow-up field (`AddDiscussionForm`) into separate date and
   time inputs; time defaults to 10:00 when a date is picked, quick picks fill both, Clear empties
   both, a date without a time is invalid. UI only; the API payload is unchanged.
3. Mobile check (rows stack, dialog full height), empty and error states pass, small visual fixes.
4. README: setup (Docker and manual), tests, seed, decisions summary linking DECISIONS.md, API
   table, How I used AI, known limitations, next steps. Screenshots in `docs/screenshots/`.
5. Walkthrough video (2 to 3 min), definition of done.

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
