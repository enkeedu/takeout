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

## URL Structure

```
/                              # home + search
/:state                        # e.g. /nj
/:state/:city                  # e.g. /nj/clinton
/:state/:city/:restaurant_slug # e.g. /nj/clinton/hunan-wok
```

## Project Structure

```
takeout/
├── apps/api/    # FastAPI backend
├── apps/web/    # Next.js frontend
├── data/        # Sample CSV data
└── infra/       # Future infrastructure configs
```
