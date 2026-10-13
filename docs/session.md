# Session state

Updated: Tue 13 Oct 2026, night. Deadline: Fri 16 Oct.

## Done
- S1 Scaffold: compose runs db, api, web; health at `/api/v1/health`.
- S2 API core: exit criteria pass. Models + first migration, error envelope (D-12),
  `timeutil` (R-1, R-6), leads create/get/patch/list with filter, search, counts,
  `follow_up_state` (R-2). 41 API tests green.

## Now
- Stage S3 Follow-up rules, discussions, seed (WORKFLOWS.md, Build stages). Not started.

## Next
1. Pinning in `services/leads.list_leads` (R-3): today it returns `pinned: []` and every
   lead in `others` by activity desc. Add the split, overdue-then-today order, won/lost sink.
2. `PATCH` status: write the `status_change` discussion (R-5, D-9). Same-status no-op exists.
3. `services/discussions.py` + router: add note in one transaction (Write rules, R-4, D-7, D-8),
   timeline newest first, `DELETE /leads/{id}/follow-up`. Extend the 404 test to those routes.
4. `scripts/seed.py --reset` (TEST_PLAN.md seed table); add `SEED_ON_START` to `api/entrypoint.sh`.
5. Run every mutation check in TEST_PLAN.md. "d0 + 24h" means UTC start plus 24 hours;
   adding a day to a ZoneInfo-aware local datetime is wall-clock and breaks nothing.

## Notes
- Services take `now`; routers get it from `Depends(timeutil.utcnow)`, which tests override.
- Tests: `conftest.py` drops and migrates `TEST_DATABASE_URL` (must end in `_test`) and
  wraps each test in a rolled-back transaction. Factories: `make_lead`, `make_discussion`.
- Unknown routes return `NOT_FOUND`, 405 returns `METHOD_NOT_ALLOWED` (not in API.md's table).
- Docker db is published on host port `POSTGRES_HOST_PORT` (default 5433, D-15); host tools
  and pytest use `localhost:5433`, containers use `db:5432`.

## Open questions
- Deploy target (DECISIONS.md, Open), decide Day 3.
