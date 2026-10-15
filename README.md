# LeadFlow

A single-screen lead management mini CRM. Track leads, log every discussion in a timeline, and set
follow-up reminders. Today's and overdue follow-ups are pinned to the top of the list.

Overdue follow-ups are pinned too, not just today's, because a missed follow-up needs attention
first (D-5). Overdue leads show in red, today's in amber.

Features:

- Search leads and filter them by status
- Open a lead to see its history and add notes
- Set a follow-up with each note, or pick Tomorrow, In 3 days or Next Monday
- Change a lead's status, edit its details, or mark a follow-up done
- Press `N` to add a lead
- Dates and "today" follow your own time zone

## Live demo

- Web: https://leadflow-web-six.vercel.app
- API: https://leadflow-api-ebse.onrender.com/api/v1 (docs: https://leadflow-api-ebse.onrender.com/docs)

Demo data refreshes when it's more than 6 hours old. The free API sleeps when idle, so the first
request can take about a minute.

## Stack

- `api/`: FastAPI, Pydantic v2, SQLAlchemy 2.0, Alembic, Postgres 16, pytest
- `web/`: Next.js (App Router, TypeScript), Tailwind, shadcn/ui, TanStack Query
- `docker-compose.yml`: `db`, `api`, `web`

## Setup with Docker

```
cp .env.example .env
docker compose up --build
```

- Web: http://localhost:3000
- API: http://localhost:8000/api/v1 (health: `/api/v1/health`)
- API docs: http://localhost:8000/docs

## Manual setup

Requires Python 3.12, Node 22.22+ (the web tests' jsdom needs it; the app itself runs on Node 20.9+),
and Postgres 16 with `leadflow` and `leadflow_test` databases.
The easiest way is to run only the database with `docker compose up db`. It is published on host
port 5433 (`POSTGRES_HOST_PORT`), so it does not clash with a native Postgres on 5432. If you use
your own Postgres instead, point `DATABASE_URL` and `TEST_DATABASE_URL` at it.

API:

```
cd api
python -m venv .venv
source .venv/bin/activate        # Windows: .venv\Scripts\activate
pip install -r requirements-dev.txt
export DATABASE_URL=postgresql+psycopg://leadflow:leadflow@localhost:5433/leadflow
alembic upgrade head
python -m scripts.seed           # optional demo data, see Seed data
uvicorn app.main:app --reload
```

Web:

```
cd web
npm install
npm run dev                      # reads NEXT_PUBLIC_API_URL, default http://localhost:8000/api/v1
```

## Tests

```
cd api && pytest                              # 74 tests against the leadflow_test database (D-2)
cd web && npm test                            # 25 Vitest tests
cd web && npm run lint && npx tsc --noEmit
```

- API tests run on real Postgres, each in a rolled-back transaction, with `now` fixed so time-based
  rules are deterministic. They cover follow-up states across time zones, near midnight and on a DST
  day, pinning order, the note and follow-up write rules, status history, and every error code.
- Web tests cover the browser-side date helpers (23:30, Monday and DST cases) and the lead forms.
  The time zone is pinned to `America/New_York` (D-17).
- The time, pinning and write rules have mutation checks: break the code on purpose and a named
  test must fail ([docs/TEST_PLAN.md](docs/TEST_PLAN.md#mutation-checks)).

## Seed data

```
cd api
python -m scripts.seed                 # adds demo leads only if the database has none
python -m scripts.seed --reset         # wipes leads first
python -m scripts.seed --tz UTC        # place "today" in another zone (default Asia/Kolkata)
```

Eight leads with realistic call notes cover every follow-up state (overdue, including one due
earlier today; today; upcoming; none) and every status, including won and lost. All times are relative to when the
script runs. Docker seeds once on first start (`SEED_ON_START=true`). The live demo uses
`--if-stale` instead and reseeds only when the data is more than `RESEED_AFTER_HOURS` old (D-16).

## Decisions

Full log with alternatives and reasons: [docs/DECISIONS.md](docs/DECISIONS.md). Business rules:
[docs/RULES.md](docs/RULES.md).

| | Decision |
| --- | --- |
| D-2 | Postgres everywhere, including tests, for real `timestamptz` behaviour |
| D-3 | Store UTC; the client sends its time zone and the server decides what "today" is |
| D-4 | Pinning is computed on the server; the web app renders `pinned` and `others` as returned |
| D-5 | Overdue follow-ups are pinned with today's |
| D-6 | Last note, last activity and next follow-up are stored on the lead, written in the same transaction as the note |
| D-7 | A note without a follow-up clears the follow-up; "Mark done" clears it without a note |
| D-8 | Follow-ups in the past are rejected |
| D-9, D-10 | Status changes are logged in the timeline; any transition is allowed |
| D-11 | Mutations return the updated lead, so the list updates without a visible refetch |
| D-12 | One error envelope for every error, including validation |
| D-13, D-14 | No authentication, no pagination: out of scope for a single-user demo |
| D-16 | Deployed on Vercel, Render and Neon; demo data reseeds only when stale |
| D-17 | Vitest for browser-side date logic |
| D-18 | Lead details are edited inline in the dialog header |
| D-19 | Slate and indigo visual refresh with CRM-style list, dialog and timeline |

## API

Base path `/api/v1`, JSON, datetimes in UTC. Validation rules and response shapes:
[docs/API.md](docs/API.md). Interactive docs at `/docs`.

| Method and path | Purpose | Success | Errors |
| --- | --- | --- | --- |
| `GET /leads?status=&q=&tz=` | List, split into pinned and others, with counts | 200 | 422 `INVALID_STATUS`, `INVALID_TIMEZONE` |
| `POST /leads` | Create a lead | 201 + `Location` | 422 `VALIDATION_ERROR` |
| `GET /leads/{id}?tz=` | One lead | 200 | 404 `LEAD_NOT_FOUND` |
| `PATCH /leads/{id}` | Update status, name, company, phone | 200 | 404, 422 |
| `GET /leads/{id}/discussions` | Timeline, newest first | 200 | 404 |
| `POST /leads/{id}/discussions` | Add a note, optional follow-up | 201, `{ discussion, lead }` | 404, 422 `VALIDATION_ERROR`, `FOLLOW_UP_IN_PAST` |
| `DELETE /leads/{id}/follow-up` | Mark the follow-up done | 204 | 404 |
| `GET /health` | Liveness | 200 | |

Every error uses one shape (D-12):

```json
{ "error": { "code": "LEAD_NOT_FOUND", "message": "Lead not found", "details": null } }
```

## How I used AI

I used Claude Code as a pair programmer throughout. Before any code, I wrote the specs in `docs/`
(architecture, API, business rules, decisions, test plan) and project rules in `CLAUDE.md` and
`.claude/rules/`, so the assistant worked from the docs and stopped to ask when code and docs
disagreed. It drafted most of the implementation, tests and docs; I set the scope, made the
decisions in DECISIONS.md, reviewed each change before it was committed, and approved every commit
message. Time-sensitive rules were checked with mutation tests rather than taken on trust, and UI
changes were checked by hand in the browser. AI is not part of the product.

## Known limitations

- Single user, no login (D-13): everyone on the live demo shares one database and sees the same
  leads; two people editing the same lead: the last write wins
- No pagination or search index (D-14); fine at demo scale, not for thousands of leads
- Notes cannot be edited or deleted, and leads cannot be deleted
- Live demo: the free API sleeps when idle, so the first request after a pause takes about a
  minute, and demo data resets once it is more than 6 hours old
- No end-to-end browser tests and no CI; the flows are checked by hand
  ([manual checklist](docs/TEST_PLAN.md#web-manual-checklist))

## Next steps

- Authentication and per-rep ownership of leads
- Pagination and a trigram index for search (D-14)
- CI running pytest, Vitest, lint and typecheck on every push; Playwright for the main flows
- Edit and delete notes; archive leads
- Reminders by email or calendar for today's follow-ups
