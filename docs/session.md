# Session state

Updated: Thu 15 Oct 2026. Deadline: Fri 16 Oct.

## Done
- S1 to S5 complete: API (74 pytest tests, mutation checks pass), list, filters, URL state, timeline
  dialog, mutations, Add Lead with `N`. Every functional rubric item works.
- Deployed per D-16: web https://leadflow-web-six.vercel.app (Vercel `leadflow-web`), API
  https://leadflow-api-ebse.onrender.com (Render `leadflow-api`, Singapore), Neon `LeadFlow`
  (Singapore, PG 16). Stale-only reseed via `scripts.seed --if-stale`. Push to `main` redeploys both.
- HR mockups covered (split follow-up inputs, timeline rail, pinned note form, "Lead created").
- Web unit tests per D-17: Vitest 4, `cd web && npm test` (30 tests), TZ pinned to New York.
- Edit lead details inline in the dialog header (D-18); PATCH details tested.
- Visual refresh per D-19 (slate and indigo, avatars, status dots, follow-up banner, timeline
  icons, composer note box); committed, pushed and live on Vercel.
- Fresh-clone check passed: `docker compose up --build`, seed, browser read and write, pytest 74,
  Vitest 30, lint, `npm run typecheck` (runs `next typegen` first so a clean checkout passes).
- Mobile, empty and error states pass (TEST_PLAN.md, Web manual checklist); failed-lead dialog fixed.
- README complete except the video; limitations note the shared demo database (D-13).
- Screenshots in `docs/screenshots/` (list, timeline, add lead, mobile), taken from the live
  site with Playwright at 2x, linked from the README.

## Now
- Stage S6 Polish and delivery (WORKFLOWS.md, Build stages). User handles the remaining items.

## Next
1. Walkthrough video (2 to 3 min) linked in the README; tick the definition of done (WORKFLOWS.md).

## Working agreement (this session)
- Per task: read docs, tests in the same commit, update affected docs, D-entry for real choices,
  run pytest + `npm test` + lint + typecheck, propose the commit citing R/D, rewrite this file, stop.
- Web-only logic changes need a Vitest test; purely visual changes note the manual check (D-17).

## Notes
- Mutation hooks in `hooks/useLeadMutations.ts`; reads and query keys in `hooks/useLeads.ts`.
- `.env` is unreadable here (deny rule) and points tests at 5432; run pytest with
  `TEST_DATABASE_URL=...@localhost:5433/leadflow_test`.
- npm 11.5.2 crashed resolving vitest's peers without a lockfile; with it, `npm install` works.
- `next dev` leaves an orphaned `next` process on port 3000 after stopping; kill it by PID.
- HR mockup PNGs in the repo root stay untracked (user's choice).
