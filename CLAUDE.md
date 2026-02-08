# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

chinese-takeout.com — A US Chinese restaurant directory with location browsing, full-text search, and restaurant showcase templates.

## Commands

### Start all services
```bash
docker compose up --build
```

### Access points
- Web: http://localhost:3001
- API: http://localhost:8001
- Swagger docs: http://localhost:8001/docs
- Postgres: localhost:5433 (user: takeout, db: takeout)

### Database migrations
```bash
# Migrations auto-run on API startup via entrypoint.sh
# Manual:
docker compose exec api alembic upgrade head

# Create new migration:
docker compose exec api alembic revision --autogenerate -m "description"
```

### Import data
```bash
docker compose exec api python -m scripts.import_restaurants /data/sample_restaurants.csv
```

### Frontend
```bash
# Inside apps/web/:
npm run dev        # dev server with turbopack
npm run build      # production build
```

### Rebuild a single service
```bash
docker compose up --build api
docker compose up --build web
```

## Architecture

Monorepo with three services orchestrated via Docker Compose on a shared `takeout-net` bridge network.

### apps/api — FastAPI backend (Python 3.12)
- **Entry:** `app/main.py` → FastAPI app with CORS, routers mounted at `/`
- **Database:** Async SQLAlchemy + asyncpg → PostgreSQL 16
- **Routing layers:** `routers/` → `services/` → SQLAlchemy queries
- **Schemas:** Pydantic v2 models in `schemas/`
- **Migrations:** Alembic in `alembic/versions/`, auto-run on startup

### apps/web — Next.js 15 frontend (TypeScript, React 19)
- **App Router** with dynamic segments: `[state]/[city]/[slug]`
- **Tailwind CSS 4** via `@tailwindcss/postcss`
- **SSR API calls** use `INTERNAL_API_URL` (http://api:8000 inside Docker)
- **Client API calls** use `NEXT_PUBLIC_API_URL` (http://localhost:8001)
- **API helper:** `src/lib/api.ts` — `apiFetch()` auto-selects URL based on context

### Database (PostgreSQL 16)
Four tables: `restaurants`, `restaurant_locations`, `restaurant_slugs`, `fetch_metros`

Key relationships:
- `restaurants` 1→N `restaurant_locations` 1→1 `restaurant_slugs`
- Full-text search via PL/pgSQL trigger `update_location_search_vector()` on `restaurant_locations` that joins restaurant name + city + state into a `tsvector` column with GIN index

Deduplication on import: `google_place_id` → `(phone + address1 + zip)` → `(name + address1 + zip)`

### Port mapping
| Service  | Host  | Internal |
|----------|-------|----------|
| Postgres | 5433  | 5432     |
| API      | 8001  | 8000     |
| Web      | 3001  | 3000     |

## Key Conventions

- **URL case:** Lowercase in URLs (`/nj/clinton/hunan-wok`). API normalizes state to uppercase for DB queries.
- **Slug collisions:** Append `-2`, `-3`, etc.
- **Next.js 15 async params:** `params` and `searchParams` are Promises — always `await` them.
- **Pagination:** 1-indexed `page` + `page_size` (max 100). Response shape: `PaginatedResponse<T>`.
- **Restaurant templates:** Three showcase templates (market, modern, luxe) selected deterministically by hashing restaurant ID. Preview mode via `?template=...&preview=1`.
- **Build backend:** Use `setuptools.build_meta` in pyproject.toml (not `_legacy:_Backend`).
- **Docker entrypoint:** Use `bash entrypoint.sh` (not `./entrypoint.sh`) because volume mount overrides chmod.
