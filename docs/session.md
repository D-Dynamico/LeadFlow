# Session state

Updated: Tue 13 Oct 2026, night. Deadline: Fri 16 Oct.

## Done
- Planning: docs, rules R-1 to R-6, decisions D-1 to D-14, CLAUDE.md, rules, settings.
- S1 Scaffold: exit criteria pass. `docker compose up --build` starts db, api, web;
  `GET /api/v1/health` returns 200; web shows a placeholder page; db has `leadflow` and `leadflow_test`.

## Now
- Stage S2 API core (WORKFLOWS.md, Build stages). Not started.

## Next
1. S2: `models.py` (ARCHITECTURE.md, Data model) and first Alembic migration with the indexes;
   `errors.py` envelope + override default 422 (API.md, D-12); `timeutil.py` (R-1);
   `schemas.py`; leads service + router: create, get, patch, list with status filter and search.
   Tests: follow-up state and leads endpoints against `leadflow_test` (TEST_PLAN.md); needs a
   conftest that uses `TEST_DATABASE_URL`.
2. S3: pinning (R-3), discussions with write-rules transaction (R-4, R-5), mark done, seed script,
   then add the `SEED_ON_START` step to `api/entrypoint.sh`.

## Notes for S2
- Health is mounted under the `/api/v1` prefix, like every other route.
- `api/entrypoint.sh` runs `alembic upgrade head` then uvicorn; seeding is deferred to S3.
- Alembic `env.py` reads `DATABASE_URL` from settings and targets `app.db.Base.metadata`;
  `models.py` must be imported in `env.py` once it exists, or autogenerate sees no tables.
- Local runs: `.env` points `DATABASE_URL` at host `db`; outside Docker override it with
  `localhost` (env var or `api/.env`, which beats the root `.env`).
- API test client uses `httpx2` (Starlette deprecated `httpx`).
- `web/` is Next 16.4 with `output: "standalone"`; shadcn style `base-nova`. Only `button` is added so far.

## Open questions
- Deploy target (DECISIONS.md, Open), decide Day 3.
