# LeadFlow

Single-screen lead management mini CRM (take-home). Lead list with today's and overdue
follow-ups pinned, a timeline dialog per lead, add-lead form. Deadline: Fri 16 Oct 2026.

Current state and next step: @docs/session.md

## Docs map

Read the relevant doc before writing code. Docs are the spec; code follows them.

- `docs/ARCHITECTURE.md`: brief and rubric, scope, module map, data model, flows, frontend, edge cases
- `docs/API.md`: endpoints, validation, error envelope, response shapes
- `docs/RULES.md`: business rules R-1 to R-6 (time, follow-up states, pinning, follow-up lifecycle, status)
- `docs/DECISIONS.md`: decisions D-1 onward, append-only
- `docs/WORKFLOWS.md`: setup, status lifecycle, build stages S1 to S6, definition of done
- `docs/TEST_PLAN.md`: fixtures, seed data, tests per area, mutation checks

## Stack

- `api/`: FastAPI, Pydantic v2, SQLAlchemy 2.0, Alembic, Postgres 16, pytest
- `web/`: Next.js (App Router, TypeScript), Tailwind, shadcn/ui, TanStack Query, react-hook-form + zod, date-fns + date-fns-tz
- `docker-compose.yml`: `db`, `api`, `web`

## Commands

Fill these in as S1 creates them; keep this list accurate.

- Full stack: `docker compose up --build`
- API dev: `cd api && uvicorn app.main:app --reload`
- API tests: `cd api && pytest`
- Migrations: `cd api && alembic upgrade head`
- Seed: `cd api && python -m scripts.seed --reset`
- Web dev: `cd web && npm run dev`
- Web lint/typecheck: `cd web && npm run lint && npx tsc --noEmit`

## How to work here

- Build in stage order (WORKFLOWS.md, Build stages). Do not start a stage until the previous one meets its exit criteria.
- If code and docs disagree, stop and ask. Do not silently change either.
- Cite rule and decision IDs in docstrings for business logic (e.g. `"""Pinned ordering, see R-3."""`) and in commit bodies.
- Business rules live only in `api/app/services/` and `api/app/timeutil.py`. The web app renders what the API returns.
- Keep it small. No auth, pagination, or extra libraries unless a decision in DECISIONS.md says so.

## Keeping context current

- After each finished task: rewrite `docs/session.md` (under 40 lines, current state only, no history).
- When a choice with real alternatives is made: append the next D-number to `docs/DECISIONS.md`. Never edit past entries; supersede them.
- `session.md` points to decisions by ID; reasoning lives only in DECISIONS.md.
- The handoff skill (temp dir, manual) is for mid-task resets; it should reference session.md and rule or decision IDs, not repeat them.
