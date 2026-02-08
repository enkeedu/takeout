"""
Fetch Chinese takeout restaurants from Google Places API (New) and output CSV.

Features:
  - Response caching (avoid paying for duplicate API calls)
  - Resumable (survives interruptions, picks up where it left off)
  - Takeout filtering (excludes non-operational, non-takeout, fine dining)
  - Cost estimation before running
  - Metro areas and fetch state stored in database

Usage:
    export GOOGLE_PLACES_API_KEY="your-key"

    # Test with a small city first
    python -m scripts.fetch_restaurants_google --city "Hartford"

    # Full run across all metros
    python -m scripts.fetch_restaurants_google

    # Resume an interrupted run (automatic)
    python -m scripts.fetch_restaurants_google

    # Force refresh cached responses
    python -m scripts.fetch_restaurants_google --force-refresh

    # Skip confirmation prompt
    python -m scripts.fetch_restaurants_google --yes
"""

import argparse
import asyncio
import csv
import json
import logging
import math
import os
import signal
import sys
import time
from dataclasses import dataclass, field
from datetime import datetime, timezone
from pathlib import Path

import requests
from sqlalchemy import select, update
from sqlalchemy.sql import func

from app.database import async_session_maker
from app.models.fetch_metro import FetchMetro

logger = logging.getLogger("fetch_google")

LOG_DIR = Path(__file__).resolve().parent.parent.parent.parent / "data" / "logs"


def _setup_logging(console_level: int = logging.INFO) -> Path:
    """Configure logging with console and file handlers."""
    if getattr(logger, "_configured", False):
        for handler in logger.handlers:
            if isinstance(handler, logging.StreamHandler) and not isinstance(handler, logging.FileHandler):
                handler.setLevel(console_level)
        return getattr(logger, "_log_path", LOG_DIR / "fetch.log")

    LOG_DIR.mkdir(parents=True, exist_ok=True)
    timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
    log_path = LOG_DIR / f"fetch_{timestamp}.log"

    logger.setLevel(logging.DEBUG)
    logger.propagate = False

    # Console: concise, configurable
    console = logging.StreamHandler()
    console.setLevel(console_level)
    console.setFormatter(logging.Formatter("%(message)s"))
    logger.addHandler(console)

    # File: detailed, DEBUG+
    file_handler = logging.FileHandler(log_path, encoding="utf-8")
    file_handler.setLevel(logging.DEBUG)
    file_handler.setFormatter(
        logging.Formatter("[%(asctime)s] %(levelname)-5s %(message)s", datefmt="%Y-%m-%d %H:%M:%S")
    )
    logger.addHandler(file_handler)

    logger._configured = True
    logger._log_path = log_path
    return log_path


API_KEY = os.environ.get("GOOGLE_PLACES_API_KEY", "")
NEARBY_SEARCH_URL = "https://places.googleapis.com/v1/places:searchNearby"

FIELD_MASK = ",".join([
    "places.id",
    "places.displayName",
    "places.formattedAddress",
    "places.addressComponents",
    "places.location",
    "places.nationalPhoneNumber",
    "places.websiteUri",
    "places.regularOpeningHours",
    "places.takeout",
    "places.delivery",
    "places.dineIn",
    "places.businessStatus",
    "places.rating",
    "places.userRatingCount",
    "places.priceLevel",
    "places.googleMapsUri",
])

# Delay between API requests (seconds)
REQUEST_DELAY = 0.5

# Search radius per grid cell in meters
GRID_RADIUS = 5000

# Cost per API call (Nearby Search with advanced fields)
COST_PER_CALL = 0.035

# Cache TTL in days
DEFAULT_CACHE_TTL_DAYS = 30

# Paths
DATA_DIR = Path(__file__).resolve().parent.parent.parent.parent / "data"
CACHE_DIR = DATA_DIR / "cache" / "places_api"

CSV_FIELDNAMES = [
    "name", "phone", "website_url", "address1", "address2",
    "city", "state", "zip", "lat", "lng", "hours_json",
    "google_place_id", "rating", "user_rating_count", "price_level",
    "google_maps_uri", "has_takeout", "has_delivery", "has_dine_in",
    "business_status",
]


@dataclass
class MetroArea:
    """Lightweight DTO populated from FetchMetro DB rows."""
    id: str  # UUID as string, for DB updates
    name: str
    state: str
    lat: float
    lng: float
    radius_km: float


@dataclass
class RestaurantRecord:
    place_id: str
    name: str
    phone: str
    website_url: str
    address1: str
    address2: str
    city: str
    state: str
    zip: str
    lat: float
    lng: float
    hours_json: str
    rating: float | None
    user_rating_count: int | None
    price_level: str
    google_maps_uri: str
    has_takeout: bool | None
    has_delivery: bool | None
    has_dine_in: bool | None
    business_status: str


# ---------------------------------------------------------------------------
# Database helpers (async)
# ---------------------------------------------------------------------------

async def _load_metros(city: str | None, state: str | None) -> list[MetroArea]:
    """Load active metros from DB, optionally filtered."""
    async with async_session_maker() as session:
        stmt = select(FetchMetro).where(FetchMetro.is_active.is_(True))
        if city:
            stmt = stmt.where(FetchMetro.name.ilike(city))
        if state:
            stmt = stmt.where(FetchMetro.state == state.upper())
        result = await session.execute(stmt.order_by(FetchMetro.state, FetchMetro.name))
        rows = result.scalars().all()
        return [
            MetroArea(
                id=str(row.id), name=row.name, state=row.state,
                lat=row.lat, lng=row.lng, radius_km=row.radius_km,
            )
            for row in rows
        ]


async def _load_metro_state(metro_id: str) -> tuple[set[str], int, int]:
    """Load completed cells, api_calls, restaurants for a metro."""
    async with async_session_maker() as session:
        result = await session.execute(
            select(
                FetchMetro.completed_cells,
                FetchMetro.total_api_calls,
                FetchMetro.total_restaurants,
            ).where(FetchMetro.id == metro_id)
        )
        row = result.one()
        cells = set(row[0]) if row[0] else set()
        return cells, row[1], row[2]


async def _save_metro_state(
    metro_id: str,
    completed_cells: set[str],
    api_calls: int,
    restaurants: int,
) -> None:
    """Persist metro fetch state to DB."""
    async with async_session_maker() as session:
        async with session.begin():
            await session.execute(
                update(FetchMetro)
                .where(FetchMetro.id == metro_id)
                .values(
                    completed_cells=sorted(completed_cells),
                    total_api_calls=api_calls,
                    total_restaurants=restaurants,
                    updated_at=func.now(),
                )
            )


async def _reset_metro_state(metro_id: str) -> None:
    """Reset fetch state for a metro."""
    async with async_session_maker() as session:
        async with session.begin():
            await session.execute(
                update(FetchMetro)
                .where(FetchMetro.id == metro_id)
                .values(
                    completed_cells=[],
                    total_api_calls=0,
                    total_restaurants=0,
                    fetch_started_at=None,
                    fetch_completed_at=None,
                    updated_at=func.now(),
                )
            )


async def _mark_metro_started(metro_id: str) -> None:
    """Set fetch_started_at for a metro."""
    async with async_session_maker() as session:
        async with session.begin():
            await session.execute(
                update(FetchMetro)
                .where(FetchMetro.id == metro_id)
                .values(fetch_started_at=func.now(), updated_at=func.now())
            )


async def _mark_metro_completed(metro_id: str) -> None:
    """Set fetch_completed_at for a metro."""
    async with async_session_maker() as session:
        async with session.begin():
            await session.execute(
                update(FetchMetro)
                .where(FetchMetro.id == metro_id)
                .values(fetch_completed_at=func.now(), updated_at=func.now())
            )


# ---------------------------------------------------------------------------
# DB State Manager (replaces JSON StateManager)
# ---------------------------------------------------------------------------

@dataclass
class FailedCell:
    metro_name: str
    state: str
    lat: float
    lng: float
    error: str


class DbStateManager:
    """Track fetch state in the fetch_metros DB table."""

    def __init__(self):
        self._cells: dict[str, set[str]] = {}  # metro_id -> set of cell keys
        self._api_calls: dict[str, int] = {}
        self._restaurants: dict[str, int] = {}
        self.failed_cells: list[FailedCell] = []

    async def load_metro(self, metro: MetroArea) -> None:
        """Load state for a single metro from DB."""
        cells, api_calls, restaurants = await _load_metro_state(metro.id)
        self._cells[metro.id] = cells
        self._api_calls[metro.id] = api_calls
        self._restaurants[metro.id] = restaurants

    def is_cell_completed(self, metro: MetroArea, lat: float, lng: float) -> bool:
        return f"{lat:.4f}_{lng:.4f}" in self._cells.get(metro.id, set())

    def mark_cell_complete(self, metro: MetroArea, lat: float, lng: float) -> None:
        if metro.id not in self._cells:
            self._cells[metro.id] = set()
        self._cells[metro.id].add(f"{lat:.4f}_{lng:.4f}")

    def completed_cell_count(self, metro: MetroArea) -> int:
        return len(self._cells.get(metro.id, set()))

    def record_api_call(self, metro: MetroArea) -> None:
        self._api_calls[metro.id] = self._api_calls.get(metro.id, 0) + 1

    def record_restaurants(self, metro: MetroArea, count: int) -> None:
        self._restaurants[metro.id] = self._restaurants.get(metro.id, 0) + count

    async def save(self, metro: MetroArea) -> None:
        """Persist current state for a metro to DB."""
        await _save_metro_state(
            metro_id=metro.id,
            completed_cells=self._cells.get(metro.id, set()),
            api_calls=self._api_calls.get(metro.id, 0),
            restaurants=self._restaurants.get(metro.id, 0),
        )

    @property
    def total_api_calls(self) -> int:
        return sum(self._api_calls.values())

    @property
    def total_restaurants(self) -> int:
        return sum(self._restaurants.values())


# ---------------------------------------------------------------------------
# Cache Manager (filesystem — unchanged)
# ---------------------------------------------------------------------------

class CacheManager:
    def __init__(self, cache_dir: Path, ttl_days: int = DEFAULT_CACHE_TTL_DAYS, enabled: bool = True):
        self.cache_dir = cache_dir
        self.ttl_days = ttl_days
        self.enabled = enabled
        self.hits = 0
        self.misses = 0

    def _cache_path(self, metro: MetroArea, lat: float, lng: float) -> Path:
        from slugify import slugify
        state_dir = metro.state.upper()
        city_dir = slugify(metro.name)
        filename = f"{lat:.4f}_{lng:.4f}_{GRID_RADIUS}.json"
        return self.cache_dir / state_dir / city_dir / filename

    def get(self, metro: MetroArea, lat: float, lng: float) -> list[dict] | None:
        if not self.enabled:
            return None

        path = self._cache_path(metro, lat, lng)
        if not path.exists():
            self.misses += 1
            return None

        try:
            data = json.loads(path.read_text())
            cached_at = datetime.fromisoformat(data["cached_at"])
            age_days = (datetime.now(timezone.utc) - cached_at).days
            if age_days > self.ttl_days:
                logger.debug("Cache expired (%dd old): %s", age_days, path.name)
                self.misses += 1
                return None
            response = data.get("response")
            if response is None:
                logger.warning("Empty cache response in %s; treating as miss", path.name)
                self.misses += 1
                return None
            self.hits += 1
            return response
        except (json.JSONDecodeError, KeyError, TypeError, ValueError) as e:
            logger.warning("Corrupt cache file %s: %s", path, e)
            self.misses += 1
            return None

    def put(self, metro: MetroArea, lat: float, lng: float, response: list[dict]) -> None:
        if not self.enabled:
            return

        path = self._cache_path(metro, lat, lng)
        path.parent.mkdir(parents=True, exist_ok=True)

        data = {
            "cached_at": datetime.now(timezone.utc).isoformat(),
            "request": {"lat": lat, "lng": lng, "radius": GRID_RADIUS},
            "response": response,
        }

        tmp = path.with_suffix(".tmp")
        tmp.write_text(json.dumps(data))
        tmp.rename(path)


# ---------------------------------------------------------------------------
# Graceful shutdown
# ---------------------------------------------------------------------------

class GracefulShutdown:
    def __init__(self):
        self.requested = False
        signal.signal(signal.SIGINT, self._handler)
        signal.signal(signal.SIGTERM, self._handler)

    def _handler(self, signum, frame):
        if self.requested:
            logger.warning("Force quit.")
            sys.exit(1)
        logger.warning("Shutdown requested. Finishing current cell and saving state...")
        self.requested = True


# ---------------------------------------------------------------------------
# Grid generation
# ---------------------------------------------------------------------------

def generate_grid_points(center_lat: float, center_lng: float, radius_km: float) -> list[tuple[float, float]]:
    """Generate a grid of lat/lng points to cover a metro area."""
    cell_radius_km = GRID_RADIUS / 1000
    step_km = cell_radius_km * 1.5  # overlap for coverage

    points = []
    steps = max(1, int(radius_km / step_km))

    for i in range(-steps, steps + 1):
        for j in range(-steps, steps + 1):
            dist = math.sqrt((i * step_km) ** 2 + (j * step_km) ** 2)
            if dist > radius_km:
                continue
            dlat = (i * step_km) / 111.0
            dlng = (j * step_km) / (111.0 * math.cos(math.radians(center_lat)))
            points.append((center_lat + dlat, center_lng + dlng))

    return points


# ---------------------------------------------------------------------------
# Address / hours parsing
# ---------------------------------------------------------------------------

def parse_address_components(components: list[dict]) -> dict:
    """Extract structured address fields from Google addressComponents."""
    result = {"street_number": "", "route": "", "city": "", "state": "", "zip": ""}

    for comp in components:
        types = comp.get("types", [])
        if "street_number" in types:
            result["street_number"] = comp.get("shortText", comp.get("longText", ""))
        elif "route" in types:
            result["route"] = comp.get("shortText", comp.get("longText", ""))
        elif "locality" in types:
            result["city"] = comp.get("longText", comp.get("shortText", ""))
        elif "administrative_area_level_1" in types:
            result["state"] = comp.get("shortText", "")
        elif "postal_code" in types:
            result["zip"] = comp.get("shortText", comp.get("longText", ""))

    return result


def parse_hours(opening_hours: dict | None) -> str:
    """Convert Google regularOpeningHours to our hours_json format."""
    if not opening_hours:
        return ""

    periods = opening_hours.get("periods", [])
    if not periods:
        return ""

    day_names = ["sunday", "monday", "tuesday", "wednesday", "thursday", "friday", "saturday"]
    hours: dict[str, list] = {day: [] for day in day_names}

    for period in periods:
        open_info = period.get("open", {})
        close_info = period.get("close", {})

        open_day = open_info.get("day", 0)
        open_hour = open_info.get("hour", 0)
        open_minute = open_info.get("minute", 0)

        close_hour = close_info.get("hour", 0)
        close_minute = close_info.get("minute", 0)

        if 0 <= open_day <= 6:
            day_name = day_names[open_day]
            open_time = f"{open_hour:02d}:{open_minute:02d}"
            close_time = f"{close_hour:02d}:{close_minute:02d}"
            hours[day_name].append({"open": open_time, "close": close_time})

    hours = {day: times for day, times in hours.items() if times}
    if not hours:
        return ""

    return json.dumps(hours)


# ---------------------------------------------------------------------------
# Filtering
# ---------------------------------------------------------------------------

def should_include(place: dict) -> tuple[bool, str]:
    """Check if a restaurant should be included. Returns (include, reason)."""
    status = place.get("businessStatus", "")
    if status and status != "OPERATIONAL":
        return False, f"status={status}"

    # Exclude if explicitly no takeout
    if place.get("takeout") is False:
        return False, "no takeout"

    # Exclude very expensive (fine dining)
    price = place.get("priceLevel", "")
    if price == "PRICE_LEVEL_VERY_EXPENSIVE":
        return False, f"price={price}"

    return True, ""


# ---------------------------------------------------------------------------
# API call with retry
# ---------------------------------------------------------------------------

_SEARCH_FAILED = None  # sentinel: distinguishes "no results" from "request failed"


def search_nearby(lat: float, lng: float, api_key: str, max_retries: int = 3) -> list[dict] | None:
    """Call Google Places searchNearby with retry. Returns None on total failure."""
    headers = {
        "Content-Type": "application/json",
        "X-Goog-Api-Key": api_key,
        "X-Goog-FieldMask": FIELD_MASK,
    }

    body = {
        "includedTypes": ["chinese_restaurant"],
        "maxResultCount": 20,
        "locationRestriction": {
            "circle": {
                "center": {"latitude": lat, "longitude": lng},
                "radius": float(GRID_RADIUS),
            }
        },
    }

    last_error = ""
    for attempt in range(max_retries):
        try:
            resp = requests.post(NEARBY_SEARCH_URL, json=body, headers=headers, timeout=30)
            resp.raise_for_status()
            return resp.json().get("places", [])
        except requests.exceptions.HTTPError:
            if resp.status_code == 429:
                wait = (2 ** attempt) * 15
                logger.warning("Rate limited at (%.4f, %.4f), waiting %ds (attempt %d/%d)",
                               lat, lng, wait, attempt + 1, max_retries)
                time.sleep(wait)
                last_error = f"429 rate limited"
            elif resp.status_code >= 500:
                wait = (2 ** attempt) * 5
                logger.warning("Server error %d at (%.4f, %.4f), retrying in %ds...",
                               resp.status_code, lat, lng, wait)
                time.sleep(wait)
                last_error = f"server error {resp.status_code}"
            else:
                last_error = f"HTTP {resp.status_code}: {resp.text[:200]}"
                logger.error("API error at (%.4f, %.4f): %s", lat, lng, last_error)
                return _SEARCH_FAILED
        except requests.exceptions.RequestException as e:
            last_error = str(e)[:200]
            if attempt < max_retries - 1:
                wait = (2 ** attempt) * 5
                logger.warning("Request error at (%.4f, %.4f): %s, retrying in %ds...",
                               lat, lng, last_error, wait)
                time.sleep(wait)
            else:
                logger.error("Request failed at (%.4f, %.4f) after %d attempts: %s",
                             lat, lng, max_retries, last_error)
                return _SEARCH_FAILED

    logger.error("All %d retries exhausted at (%.4f, %.4f): %s", max_retries, lat, lng, last_error)
    return _SEARCH_FAILED


# ---------------------------------------------------------------------------
# Record conversion
# ---------------------------------------------------------------------------

def place_to_record(place: dict) -> RestaurantRecord | None:
    """Convert a Google Places result to a RestaurantRecord."""
    name = place.get("displayName", {}).get("text", "").strip()
    if not name:
        return None

    addr = parse_address_components(place.get("addressComponents", []))
    address1 = f"{addr['street_number']} {addr['route']}".strip()
    city = addr["city"]
    state = addr["state"]
    zip_code = addr["zip"]

    if not address1 or not city or not state or not zip_code:
        return None

    location = place.get("location", {})

    return RestaurantRecord(
        place_id=place.get("id", ""),
        name=name,
        phone=place.get("nationalPhoneNumber", "").strip(),
        website_url=place.get("websiteUri", "").strip(),
        address1=address1,
        address2="",
        city=city,
        state=state,
        zip=zip_code,
        lat=location.get("latitude", 0.0),
        lng=location.get("longitude", 0.0),
        hours_json=parse_hours(place.get("regularOpeningHours")),
        rating=place.get("rating"),
        user_rating_count=place.get("userRatingCount"),
        price_level=place.get("priceLevel", ""),
        google_maps_uri=place.get("googleMapsUri", ""),
        has_takeout=place.get("takeout"),
        has_delivery=place.get("delivery"),
        has_dine_in=place.get("dineIn"),
        business_status=place.get("businessStatus", ""),
    )


# ---------------------------------------------------------------------------
# Metro fetching (core loop)
# ---------------------------------------------------------------------------

async def fetch_metro(
    metro: MetroArea,
    api_key: str,
    seen_ids: set[str],
    cache: CacheManager,
    state: DbStateManager,
    shutdown: GracefulShutdown,
) -> list[RestaurantRecord]:
    """Fetch all Chinese takeout restaurants in a metro area."""
    grid_points = generate_grid_points(metro.lat, metro.lng, metro.radius_km)
    completed = state.completed_cell_count(metro)
    remaining = len(grid_points) - completed
    logger.info("  %s, %s: %d cells (%d cached, %d remaining)",
                metro.name, metro.state, len(grid_points), completed, remaining)

    records = []
    filtered_count = 0

    for i, (lat, lng) in enumerate(grid_points):
        if shutdown.requested:
            break

        if state.is_cell_completed(metro, lat, lng):
            logger.debug("    Skipping completed cell at (%.4f, %.4f)", lat, lng)
            continue

        # Try cache first
        places = cache.get(metro, lat, lng)
        if places is None:
            logger.debug("    Cache miss at (%.4f, %.4f); querying API", lat, lng)
            places = search_nearby(lat, lng, api_key)
            state.record_api_call(metro)
            time.sleep(REQUEST_DELAY)
            if places is None:
                state.failed_cells.append(
                    FailedCell(
                        metro_name=metro.name,
                        state=metro.state,
                        lat=lat,
                        lng=lng,
                        error="request failed (see log)",
                    )
                )
                logger.error("    Cell %d/%d failed at (%.4f, %.4f); will retry on resume",
                             i + 1, len(grid_points), lat, lng)
                continue
            cache.put(metro, lat, lng, places)
        else:
            logger.debug("    Cache hit at (%.4f, %.4f)", lat, lng)

        new_count = 0
        for place in places:
            pid = place.get("id", "")
            if pid in seen_ids:
                continue
            seen_ids.add(pid)

            include, reason = should_include(place)
            if not include:
                pname = place.get("displayName", {}).get("text", "?")
                logger.info("    Filtered: %s (%s)", pname, reason)
                filtered_count += 1
                continue

            record = place_to_record(place)
            if record:
                records.append(record)
                new_count += 1

        state.mark_cell_complete(metro, lat, lng)

        if new_count > 0:
            logger.info("    Cell %d/%d: +%d new (%d total)",
                        i + 1, len(grid_points), new_count, len(records))

        # Save state periodically (every 10 cells)
        if (i + 1) % 10 == 0:
            await state.save(metro)
            logger.debug("    Saved state at cell %d/%d", i + 1, len(grid_points))

    if filtered_count > 0:
        logger.info("  Filtered out %d restaurants", filtered_count)

    return records


# ---------------------------------------------------------------------------
# CSV writing (append-safe)
# ---------------------------------------------------------------------------

def write_csv_header(output_path: Path) -> None:
    """Write CSV header if file doesn't exist or is empty."""
    output_path.parent.mkdir(parents=True, exist_ok=True)
    if not output_path.exists() or output_path.stat().st_size == 0:
        with open(output_path, "w", newline="", encoding="utf-8") as f:
            writer = csv.DictWriter(f, fieldnames=CSV_FIELDNAMES)
            writer.writeheader()


def append_csv(records: list[RestaurantRecord], output_path: Path) -> None:
    """Append records to CSV."""
    with open(output_path, "a", newline="", encoding="utf-8") as f:
        writer = csv.DictWriter(f, fieldnames=CSV_FIELDNAMES)
        for r in records:
            writer.writerow({
                "name": r.name,
                "phone": r.phone,
                "website_url": r.website_url,
                "address1": r.address1,
                "address2": r.address2,
                "city": r.city,
                "state": r.state,
                "zip": r.zip,
                "lat": r.lat,
                "lng": r.lng,
                "hours_json": r.hours_json,
                "google_place_id": r.place_id,
                "rating": r.rating if r.rating is not None else "",
                "user_rating_count": r.user_rating_count if r.user_rating_count is not None else "",
                "price_level": r.price_level,
                "google_maps_uri": r.google_maps_uri,
                "has_takeout": r.has_takeout if r.has_takeout is not None else "",
                "has_delivery": r.has_delivery if r.has_delivery is not None else "",
                "has_dine_in": r.has_dine_in if r.has_dine_in is not None else "",
                "business_status": r.business_status,
            })


# ---------------------------------------------------------------------------
# Cost estimation
# ---------------------------------------------------------------------------

def estimate_cost(metros: list[MetroArea], state_mgr: DbStateManager) -> dict:
    """Estimate API cost for the remaining work."""
    total_cells = 0
    remaining_cells = 0
    for metro in metros:
        points = generate_grid_points(metro.lat, metro.lng, metro.radius_km)
        total_cells += len(points)
        completed = state_mgr.completed_cell_count(metro)
        remaining_cells += max(0, len(points) - completed)

    return {
        "total_metros": len(metros),
        "total_cells": total_cells,
        "remaining_cells": remaining_cells,
        "already_completed": total_cells - remaining_cells,
        "estimated_cost": round(remaining_cells * COST_PER_CALL, 2),
    }


# ---------------------------------------------------------------------------
# Summary
# ---------------------------------------------------------------------------

def print_summary(all_records: list[RestaurantRecord], state_mgr: DbStateManager, cache: CacheManager) -> None:
    total = len(all_records)
    if total == 0:
        logger.info("")
        logger.info("No restaurants found.")
        return

    with_phone = sum(1 for r in all_records if r.phone)
    with_website = sum(1 for r in all_records if r.website_url)
    with_hours = sum(1 for r in all_records if r.hours_json)
    with_rating = sum(1 for r in all_records if r.rating is not None)
    with_takeout = sum(1 for r in all_records if r.has_takeout is True)

    ratings = [r.rating for r in all_records if r.rating is not None]
    avg_rating = sum(ratings) / len(ratings) if ratings else 0

    price_counts: dict[str, int] = {}
    for r in all_records:
        level = r.price_level or "UNKNOWN"
        price_counts[level] = price_counts.get(level, 0) + 1

    state_counts: dict[str, int] = {}
    for r in all_records:
        state_counts[r.state] = state_counts.get(r.state, 0) + 1

    pct = lambda n: f"{100 * n / total:5.1f}%"

    logger.info("")
    logger.info("%s", "=" * 60)
    logger.info("FETCH SUMMARY")
    logger.info("%s", "=" * 60)
    logger.info("Total restaurants:    %d", total)
    logger.info("API calls made:       %d", state_mgr.total_api_calls)
    logger.info("Cache hits/misses:    %d/%d", cache.hits, cache.misses)
    logger.info("Estimated cost:       $%.2f", state_mgr.total_api_calls * COST_PER_CALL)
    logger.info("")
    logger.info("FIELD COMPLETENESS:")
    logger.info("  Phone:              %4d (%s)", with_phone, pct(with_phone))
    logger.info("  Website:            %4d (%s)", with_website, pct(with_website))
    logger.info("  Hours:              %4d (%s)", with_hours, pct(with_hours))
    logger.info("  Rating:             %4d (%s)", with_rating, pct(with_rating))
    logger.info("  Takeout flag:       %4d (%s)", with_takeout, pct(with_takeout))
    logger.info("")
    logger.info("AVG RATING:           %.2f", avg_rating)
    logger.info("")
    logger.info("PRICE LEVELS:")
    for level, count in sorted(price_counts.items(), key=lambda x: -x[1]):
        logger.info("  %-35s %4d (%s)", level, count, pct(count))
    logger.info("")
    logger.info("TOP STATES:")
    for s, count in sorted(state_counts.items(), key=lambda x: -x[1])[:10]:
        logger.info("  %-10s %4d (%s)", s, count, pct(count))
    logger.info("%s", "=" * 60)


# ---------------------------------------------------------------------------
# Main
# ---------------------------------------------------------------------------

async def main():
    parser = argparse.ArgumentParser(description="Fetch Chinese takeout restaurants from Google Places API")
    parser.add_argument("--city", help="Fetch only a specific city (by name)")
    parser.add_argument("--state", help="Fetch only cities in a specific state (2-letter code)")
    parser.add_argument("--limit", type=int, help="Stop after fetching this many restaurants")
    parser.add_argument("--output", help="Output CSV path", default=str(DATA_DIR / "chinese_restaurants.csv"))
    parser.add_argument("--yes", "-y", action="store_true", help="Skip confirmation prompt")
    parser.add_argument("--no-cache", action="store_true", help="Disable response caching")
    parser.add_argument("--force-refresh", action="store_true", help="Ignore cached responses")
    parser.add_argument("--cache-ttl-days", type=int, default=DEFAULT_CACHE_TTL_DAYS, help="Cache TTL in days")
    parser.add_argument("--fresh", action="store_true", help="Reset state and start fresh")
    parser.add_argument(
        "--log-level",
        type=str.upper,
        default="INFO",
        choices=["DEBUG", "INFO", "WARNING", "ERROR"],
        help="Console log level",
    )
    args = parser.parse_args()

    log_path = _setup_logging(console_level=getattr(logging, args.log_level, logging.INFO))
    logger.info("Log file: %s", log_path)

    api_key = API_KEY
    if not api_key:
        logger.error("Error: Set GOOGLE_PLACES_API_KEY environment variable")
        sys.exit(1)

    # Load metros from database
    metros = await _load_metros(args.city, args.state)
    if not metros:
        if args.city:
            logger.error("Error: No active metro found matching city '%s'", args.city)
        elif args.state:
            logger.error("Error: No active metros found for state '%s'", args.state)
        else:
            logger.error("Error: No active metros in database. Run 'alembic upgrade head' to seed data.")
        sys.exit(1)

    # Initialize managers
    cache = CacheManager(
        cache_dir=CACHE_DIR,
        ttl_days=0 if args.force_refresh else args.cache_ttl_days,
        enabled=not args.no_cache,
    )
    state_mgr = DbStateManager()

    if args.fresh:
        logger.info("Resetting state for targeted metros...")
        for metro in metros:
            await _reset_metro_state(metro.id)
            logger.info("  Reset: %s, %s", metro.name, metro.state)
    else:
        for metro in metros:
            await state_mgr.load_metro(metro)
        if state_mgr.total_api_calls > 0:
            logger.info("Resuming from previous run")
            logger.info("  Previous progress: %d API calls, %d restaurants",
                        state_mgr.total_api_calls, state_mgr.total_restaurants)
            logger.info("")

    # Cost estimate
    cost = estimate_cost(metros, state_mgr)
    logger.info("%s", "=" * 60)
    logger.info("  Metros:             %d", cost["total_metros"])
    logger.info("  Total grid cells:   %d", cost["total_cells"])
    logger.info("  Already completed:  %d", cost["already_completed"])
    logger.info("  Remaining cells:    %d", cost["remaining_cells"])
    logger.info("  Estimated cost:     $%.2f", cost["estimated_cost"])
    logger.info("  Cache:              %s",
                "disabled" if args.no_cache else f"enabled (TTL={args.cache_ttl_days}d)")
    logger.info("%s", "=" * 60)
    logger.info("")

    if cost["remaining_cells"] == 0:
        logger.info("All cells already completed. Use --fresh to start over.")
        return

    if not args.yes:
        confirm = input("Proceed? [Y/n]: ").strip().lower()
        if confirm in ("n", "no"):
            logger.info("Aborted.")
            return

    # Setup
    shutdown = GracefulShutdown()
    output_path = Path(args.output)
    write_csv_header(output_path)

    all_records: list[RestaurantRecord] = []
    seen_ids: set[str] = set()

    logger.info("Fetching Chinese takeout restaurants from %d metro area(s)...", len(metros))
    logger.info("")

    for metro in metros:
        if shutdown.requested:
            break

        await _mark_metro_started(metro.id)
        records = await fetch_metro(metro, api_key, seen_ids, cache, state_mgr, shutdown)
        all_records.extend(records)
        state_mgr.record_restaurants(metro, len(records))

        # Write batch to CSV and save state
        append_csv(records, output_path)
        await state_mgr.save(metro)

        # Mark completed if all cells done
        grid_points = generate_grid_points(metro.lat, metro.lng, metro.radius_km)
        if state_mgr.completed_cell_count(metro) >= len(grid_points):
            await _mark_metro_completed(metro.id)

        logger.info("  -> %s: %d restaurants (running total: %d)",
                    metro.name, len(records), len(all_records))
        logger.info("")

        if args.limit and len(all_records) >= args.limit:
            logger.info("Reached limit of %d restaurants.", args.limit)
            break

    if state_mgr.failed_cells:
        logger.warning("Failed cells: %d (will retry on resume)", len(state_mgr.failed_cells))
        for cell in state_mgr.failed_cells[:50]:
            logger.warning("  %s, %s (%.4f, %.4f): %s",
                           cell.metro_name, cell.state, cell.lat, cell.lng, cell.error)
        if len(state_mgr.failed_cells) > 50:
            logger.warning("  ... %d more", len(state_mgr.failed_cells) - 50)

    print_summary(all_records, state_mgr, cache)
    logger.info("")
    logger.info("CSV written to: %s", output_path)

    if shutdown.requested:
        logger.info("Run the same command again to resume.")


if __name__ == "__main__":
    asyncio.run(main())
