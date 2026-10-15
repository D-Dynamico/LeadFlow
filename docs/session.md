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
  icons, composer note box); checked on desktop and at 390 px. Not yet committed or deployed.
- Mobile, empty and error states pass (TEST_PLAN.md, Web manual checklist); failed-lead dialog fixed.
- README complete except screenshots: features, D-5 callout, setup (Node 22.22+), tests, seed,
  decisions table, API table, How I used AI (user to confirm wording), limitations, next steps.

## Now
- Stage S6 Polish and delivery (WORKFLOWS.md, Build stages). D-19 refresh awaiting commit.

## Next
1. Commit the D-19 refresh, push to redeploy, then screenshots in `docs/screenshots/` (new UI),
   linked from the README.
2. Walkthrough video (2 to 3 min) linked in the README; tick the definition of done
   (WORKFLOWS.md), including a fresh-clone `docker compose up --build`.

## Working agreement (this session)
- Per task: read docs, tests in the same commit, update affected docs, D-entry for real choices,
  run pytest + `npm test` + lint + typecheck, propose the commit citing R/D, rewrite this file, stop.
- Web-only logic changes need a Vitest test; purely visual changes note the manual check (D-17).

## Notes
- Mutation hooks in `hooks/useLeadMutations.ts`; reads and query keys in `hooks/useLeads.ts`.
- `.env` is unreadable here (deny rule) and points tests at 5432; run pytest with
  `TEST_DATABASE_URL=...@localhost:5433/leadflow_test`.
- npm 11.5.2 crashes resolving vitest's peers (`edgesOut`); `npx npm@latest install` works.
- `next dev` leaves an orphaned `next` process on port 3000 after stopping; kill it by PID.
- HR mockup PNGs in the repo root stay untracked (user's choice).
