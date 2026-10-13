# LeadFlow workflows

## Setup

Target: a fresh clone runs with one command.

```
cp .env.example .env
docker compose up --build
# web: http://localhost:3000   api: http://localhost:8000/api/v1   docs: http://localhost:8000/docs
```

Compose services:

- `db`: postgres:16, healthcheck `pg_isready`, named volume, creates `leadflow` and `leadflow_test`
- `api`: waits for `db` healthy, runs `alembic upgrade head`, seeds if `SEED_ON_START=true`, then uvicorn
- `web`: Next.js production build, `NEXT_PUBLIC_API_URL` from env

`.env.example` must list every variable the code reads:

```
POSTGRES_USER=leadflow
POSTGRES_PASSWORD=leadflow
POSTGRES_DB=leadflow
DATABASE_URL=postgresql+psycopg://leadflow:leadflow@db:5432/leadflow
TEST_DATABASE_URL=postgresql+psycopg://leadflow:leadflow@localhost:5432/leadflow_test
FRONTEND_ORIGIN=http://localhost:3000
SEED_ON_START=true
LOG_LEVEL=info
NEXT_PUBLIC_API_URL=http://localhost:8000/api/v1
```

Manual setup (without Docker) is also documented in the README: Python 3.12 venv for `api/`,
Node 20 for `web/`, a local Postgres.

## Lead status lifecycle

```
new → contacted → qualified → proposal_sent → won
                                           ↘ lost
```

The arrows are the usual path, not a constraint: any status can move to any other (R-5, D-10).
`won` and `lost` are terminal in the UI sense only: they sink in `others` when no follow-up is set (R-3).

## Build stages

Each stage ends with its exit criteria met and its commits made. Day plan: S1 to S3 on Wed,
S4 and S5 on Thu, S6 on Fri.

### S1 Scaffold
Repo layout ([Module map](ARCHITECTURE.md#module-map)), `.gitignore`, `.env.example` (above), compose
with `db`, FastAPI app with `/health`, Next.js app with shadcn, README skeleton.
Exit: `docker compose up` starts all three; `/health` returns 200; web shows a placeholder page.

### S2 API core
Models and first migration ([Data model](ARCHITECTURE.md#data-model)), error envelope and handlers
([Error envelope](API.md#error-envelope)), `timeutil` (R-1), leads endpoints: create, get, patch status,
list with filter and search ([Endpoints](API.md#endpoints)).
Exit: the follow-up state and leads endpoint tests pass; every endpoint returns the codes in API.md.

### S3 Follow-up rules, discussions, seed
Pinning and ordering (R-3), discussions endpoints with the transaction
([Write rules](ARCHITECTURE.md#write-rules), R-4), status_change entries (R-5), mark done, seed script
([Seed data](TEST_PLAN.md#fixtures-and-seed-data)).
Exit: all API tests pass; seeded data shows every follow-up state; every
[mutation check](TEST_PLAN.md#mutation-checks) fails its test as expected.

### S4 Frontend list
API client and hooks, `LeadList` with pinned and others, `LeadRow`, badges, time ago, search, status
chips with counts, URL state ([Frontend structure](ARCHITECTURE.md#frontend-structure)).
Exit: list matches the API for every seeded lead; filter and search work; refresh keeps the view.

### S5 Dialog and mutations
Timeline dialog, add-discussion form with quick picks, status select, add-lead dialog, cache updates
([Cache updates](ARCHITECTURE.md#cache-updates)).
Exit: every functional rubric item ([Brief and rubric](ARCHITECTURE.md#brief-and-rubric)) works by
hand; the list updates without a visible refetch.

### S6 Polish and delivery
Overdue styling, skeletons, empty states, mobile check, README (setup, decisions summary linking to
DECISIONS.md, API table, How I used AI, next steps), screenshots, video, optional deploy.
Exit: the definition of done below is fully checked.

## Definition of done

- [ ] Fresh clone + `cp .env.example .env` + `docker compose up --build` works on a clean machine
- [ ] All rubric items work by hand, including bonus items
- [ ] `pytest` green; `npm run lint` and `npx tsc --noEmit` clean
- [ ] README: setup (Docker and manual), tests, seed, decisions summary, API table, How I used AI,
      known limitations, next steps
- [ ] `.env.example` lists every variable the code reads
- [ ] Screenshots in `docs/screenshots/`; walkthrough video (2 to 3 min) linked in README
- [ ] Commit history is conventional, one idea per commit, no squash, no tool trailers
- [ ] Repo is public; no secrets committed
