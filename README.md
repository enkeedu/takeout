# chinese-takeout.com

US Chinese restaurant directory. Phase 1: restaurant info, location browsing, and search.

## Stack

- **Frontend:** Next.js (App Router) + Tailwind
- **Backend:** FastAPI + SQLAlchemy (async) + Pydantic
- **Database:** PostgreSQL 16
- **Dev:** Docker Compose

## Quick Start

```bash
# Start all services
docker compose up --build

# Run database migrations (auto-runs on API startup, or manually)
docker compose exec api alembic upgrade head

# Import sample data
docker compose exec api python -m scripts.import_restaurants /data/sample_restaurants.csv

# Access
# Web:  http://localhost:3001
# API:  http://localhost:8001
# Docs: http://localhost:8001/docs
```

## Team Bootstrap (Full Dataset)

Use this when a teammate wants the shared dataset locally without running the Google Places fetcher.

```bash
# 1) Start services
docker compose up --build -d

# 2) Apply schema + seed migrations
docker compose exec api alembic upgrade head

# 3) Import the shared dataset (safe to re-run)
docker compose exec api env DEBUG=false \
  python -m scripts.import_restaurants /data/chinese_restaurants.csv
```

Quick verification:

```bash
curl http://localhost:8001/health
docker compose exec postgres psql -U takeout -d takeout -c "select count(*) from restaurants;"
```

If someone needs a totally fresh local DB:

```bash
docker compose down -v
docker compose up --build -d
docker compose exec api alembic upgrade head
docker compose exec api env DEBUG=false \
  python -m scripts.import_restaurants /data/chinese_restaurants.csv
```

## URL Structure

```
/                              # home + search
/:state                        # e.g. /nj
/:state/:city                  # e.g. /nj/clinton
/:state/:city/:restaurant_slug # e.g. /nj/clinton/hunan-wok
```

## Sharing Data

To load restaurant data without running the Google Places API scrape yourself:

```bash
# Import from the shared CSV
docker compose exec api python -m scripts.import_restaurants /data/chinese_restaurants.csv
```

The import script handles deduplication automatically, so it's safe to re-run.

## Alembic + Data Strategy

- Alembic is used for schema changes and lightweight seed data (for example `fetch_metros`).
- The large restaurant dataset is loaded via `scripts.import_restaurants`, not embedded in Alembic revisions.
- This keeps migrations fast/reviewable and avoids large data blobs in revision files.

## Project Structure

```
takeout/
├── apps/api/    # FastAPI backend
├── apps/web/    # Next.js frontend
├── data/        # Sample CSV data
└── infra/       # Future infrastructure configs
```
