# LeadFlow

A single-screen lead management mini CRM. Track leads, log every discussion in a timeline, and set
follow-up reminders. Today's and overdue follow-ups are pinned to the top of the list.

## Live demo

- Web: TODO after deploy
- API: TODO after deploy

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

Requires Python 3.12, Node 20+, and Postgres 16 with `leadflow` and `leadflow_test` databases.
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
uvicorn app.main:app --reload
```

Web:

```
cd web
npm install
npm run dev
```

## Tests

```
cd api && pytest
cd web && npm run lint && npx tsc --noEmit
```

## Seed data

TODO

## Decisions

TODO: summary linking to [docs/DECISIONS.md](docs/DECISIONS.md).

## API

TODO: endpoint table (see [docs/API.md](docs/API.md)).

## How I used AI

TODO

## Known limitations

TODO

## Next steps

TODO
