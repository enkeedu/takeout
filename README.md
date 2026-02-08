# chinese-takeout.com

US Chinese restaurant directory. Phase 1 focuses on restaurant info, location browsing, and search.

## Stack

- Frontend: Next.js (App Router) + Tailwind
- Backend: FastAPI + SQLAlchemy (async) + Pydantic
- Database: PostgreSQL
- Local dev: run API + web directly (no Docker required)

## Local Quick Start (No Docker)

### 1. Prerequisites

- PostgreSQL running locally on `localhost:5432`
- Python `3.12+`
- [`uv`](https://docs.astral.sh/uv/)
- Node `20+` + npm

### 2. Create local DB (one-time)

```bash
psql postgres -c "CREATE ROLE takeout WITH LOGIN PASSWORD 'takeout_dev';"
psql postgres -c "CREATE DATABASE takeout OWNER takeout;"
```

If role/database already exist, PostgreSQL will report that and you can continue.

### 3. API setup + migrations + dataset import

```bash
cd apps/api

# Current workaround: skip editable install of the local project package
uv sync --no-install-project

DATABASE_URL=postgresql+asyncpg://takeout:takeout_dev@localhost:5432/takeout \
  .venv/bin/alembic upgrade head

# Full shared dataset (safe to re-run)
DATABASE_URL=postgresql+asyncpg://takeout:takeout_dev@localhost:5432/takeout \
  DEBUG=false .venv/bin/python -m scripts.import_restaurants ../../data/chinese_restaurants.csv

# Optional sample menus
DATABASE_URL=postgresql+asyncpg://takeout:takeout_dev@localhost:5432/takeout \
  .venv/bin/python -m scripts.seed_menus --all
```

### 4. Run API

```bash
cd apps/api
DATABASE_URL=postgresql+asyncpg://takeout:takeout_dev@localhost:5432/takeout \
  DEBUG=false .venv/bin/uvicorn app.main:app --reload --host 127.0.0.1 --port 8001
```

### 5. Run web app

```bash
cd apps/web
npm install
NEXT_PUBLIC_API_URL=http://localhost:8001 \
INTERNAL_API_URL=http://localhost:8001 \
npm run dev -- --port 3001
```

### 6. Access

- Web: `http://localhost:3001`
- API: `http://localhost:8001`
- API docs: `http://localhost:8001/docs`
- Admin menu editor example: `http://localhost:3001/admin/menus/nj/clinton/hunan-wok`

Optional admin token for protected admin endpoints:

```bash
ADMIN_TOKEN=change-me
NEXT_PUBLIC_ADMIN_TOKEN=change-me
```

## Team Bootstrap (Full Dataset)

Use this when a teammate wants the shared dataset locally without running the Google Places fetcher.

```bash
cd apps/api
uv sync --no-install-project

DATABASE_URL=postgresql+asyncpg://takeout:takeout_dev@localhost:5432/takeout \
  .venv/bin/alembic upgrade head

DATABASE_URL=postgresql+asyncpg://takeout:takeout_dev@localhost:5432/takeout \
  DEBUG=false .venv/bin/python -m scripts.import_restaurants ../../data/chinese_restaurants.csv
```

Quick verification:

```bash
curl http://localhost:8001/health
curl http://localhost:8001/restaurants/az/chandler/chino-mex
psql -h localhost -U takeout -d takeout -c "select count(*) from restaurants;"
```

## Sharing Data

To load restaurant data without running Google Places fetches:

```bash
cd apps/api
DATABASE_URL=postgresql+asyncpg://takeout:takeout_dev@localhost:5432/takeout \
  DEBUG=false .venv/bin/python -m scripts.import_restaurants ../../data/chinese_restaurants.csv
```

The import script handles deduplication, so it is safe to re-run.

## Alembic + Data Strategy

- Alembic is for schema changes and lightweight seed data (for example metro seed rows).
- The large restaurant dataset is loaded via `scripts.import_restaurants`, not embedded in Alembic revisions.
- This keeps migrations small, reviewable, and fast.

## URL Structure

```text
/                              # home + search
/:state                        # e.g. /nj
/:state/:city                  # e.g. /nj/clinton
/:state/:city/:restaurant_slug # e.g. /nj/clinton/hunan-wok
```

## Project Structure

```text
takeout/
├── apps/api/    # FastAPI backend
├── apps/web/    # Next.js frontend
├── data/        # Shared CSV data and fetch cache/logs
└── Example/     # Example reference assets
```
