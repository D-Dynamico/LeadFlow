# Session state

Updated: Thu 15 Oct 2026. Deadline: Fri 16 Oct.

## Done
- S1 to S5 complete: API (68 pytest tests, mutation checks pass), list, filters, URL state, timeline
  dialog, mutations, Add Lead with `N`. Every functional rubric item works.
- Deployed per D-16: web https://leadflow-web-six.vercel.app (Vercel `leadflow-web`), API
  https://leadflow-api-ebse.onrender.com (Render `leadflow-api`, Singapore), Neon `LeadFlow`
  (Singapore, PG 16). Stale-only reseed via `scripts.seed --if-stale`. Push to `main` redeploys both.
- HR mockups covered: split date and time follow-up inputs, timeline rail with dated cards and a
  display-only "Lead created" entry, note form pinned below the timeline, Add Lead placeholders.
- Web unit tests per D-17: Vitest 4 + Testing Library, `cd web && npm test` (16 tests: `lib/dates.ts`
  and the Add Lead empty-name error). TZ pinned to America/New_York. Awaiting commit approval.

## Now
- Stage S6 Polish and delivery (WORKFLOWS.md, Build stages). Mobile check next.

## Next
1. Mobile check (rows stack, dialog full height), empty and error states pass, small visual fixes.
2. README: setup (Docker and manual), seed, decisions summary linking DECISIONS.md, API table,
   How I used AI, known limitations, next steps. Screenshots in `docs/screenshots/`.
3. Walkthrough video (2 to 3 min), definition of done.

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
