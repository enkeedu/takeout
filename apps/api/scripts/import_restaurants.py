"""
Import restaurants from CSV into the database.

Usage:
    python -m scripts.import_restaurants [path_to_csv]
    Default: /app/../data/sample_restaurants.csv
"""

import asyncio
import csv
import json
import sys
from pathlib import Path

from slugify import slugify
from sqlalchemy import select

from app.database import async_session_maker
from app.models import Restaurant, RestaurantLocation, RestaurantSlug


def parse_bool(value: str | None) -> bool | None:
    """Parse CSV boolean string to Python bool."""
    if value is None or value == "":
        return None
    return str(value).strip().lower() in ("true", "1", "yes")


def normalize_state(value: str | None) -> str | None:
    """Return 2-letter uppercase state/province code, else None."""
    if not value:
        return None
    normalized = str(value).strip().upper().replace(".", "")
    if len(normalized) != 2:
        return None
    return normalized


async def find_duplicate_location(session, row: dict) -> bool:
    """Check for duplicate by google_place_id OR (phone + address1 + zip) OR (name + address1 + zip)."""
    # Check by google_place_id (most reliable)
    google_place_id = row.get("google_place_id", "").strip()
    if google_place_id:
        result = await session.execute(
            select(Restaurant).where(Restaurant.google_place_id == google_place_id)
        )
        if result.scalar_one_or_none():
            return True

    phone = row.get("phone", "").strip()
    address1 = row["address1"].strip()
    zip_code = row["zip"].strip()
    name = row["name"].strip()

    # Check by phone + address1 + zip
    if phone:
        result = await session.execute(
            select(RestaurantLocation)
            .join(Restaurant)
            .where(
                Restaurant.phone == phone,
                RestaurantLocation.address1 == address1,
                RestaurantLocation.zip == zip_code,
            )
        )
        if result.scalar_one_or_none():
            return True

    # Check by name + address1 + zip
    result = await session.execute(
        select(RestaurantLocation)
        .join(Restaurant)
        .where(
            Restaurant.name == name,
            RestaurantLocation.address1 == address1,
            RestaurantLocation.zip == zip_code,
        )
    )
    return result.scalar_one_or_none() is not None


async def generate_unique_slug(
    session, state: str, city: str, name: str
) -> tuple[str, str, str]:
    """Generate unique (state_slug, city_slug, restaurant_slug) with collision handling."""
    state_slug = state.strip().lower()
    city_slug = slugify(city.strip())
    base_slug = slugify(name.strip())
    candidate = base_slug
    counter = 2

    while True:
        result = await session.execute(
            select(RestaurantSlug).where(
                RestaurantSlug.state_slug == state_slug,
                RestaurantSlug.city_slug == city_slug,
                RestaurantSlug.restaurant_slug == candidate,
            )
        )
        if result.scalar_one_or_none() is None:
            return state_slug, city_slug, candidate
        candidate = f"{base_slug}-{counter}"
        counter += 1


async def import_csv(csv_path: str) -> None:
    imported = 0
    skipped = 0
    skipped_invalid_state = 0

    async with async_session_maker() as session:
        async with session.begin():
            with open(csv_path, newline="", encoding="utf-8") as f:
                reader = csv.DictReader(f)
                for row in reader:
                    state_code = normalize_state(row.get("state"))
                    if not state_code:
                        print(f"  Skipped (invalid state): {row.get('name', '?')} state={row.get('state', '')!r}")
                        skipped += 1
                        skipped_invalid_state += 1
                        continue

                    # Dedup check
                    if await find_duplicate_location(session, row):
                        print(f"  Skipped (duplicate): {row['name']} at {row['address1']}")
                        skipped += 1
                        continue

                    # Create restaurant
                    restaurant = Restaurant(
                        name=row["name"].strip(),
                        phone=row.get("phone", "").strip() or None,
                        website_url=row.get("website_url", "").strip() or None,
                        google_place_id=row.get("google_place_id", "").strip() or None,
                        rating=float(row["rating"]) if row.get("rating") else None,
                        user_rating_count=int(row["user_rating_count"]) if row.get("user_rating_count") else None,
                        price_level=row.get("price_level", "").strip() or None,
                        google_maps_uri=row.get("google_maps_uri", "").strip() or None,
                    )
                    session.add(restaurant)
                    await session.flush()

                    # Create location
                    location = RestaurantLocation(
                        restaurant_id=restaurant.id,
                        address1=row["address1"].strip(),
                        address2=row.get("address2", "").strip() or None,
                        city=row["city"].strip(),
                        state=state_code,
                        zip=row["zip"].strip(),
                        lat=float(row["lat"]) if row.get("lat") else None,
                        lng=float(row["lng"]) if row.get("lng") else None,
                        hours_json=json.loads(row["hours_json"]) if row.get("hours_json") else None,
                        has_takeout=parse_bool(row.get("has_takeout")),
                        has_delivery=parse_bool(row.get("has_delivery")),
                        has_dine_in=parse_bool(row.get("has_dine_in")),
                        business_status=row.get("business_status", "").strip() or None,
                    )
                    session.add(location)
                    await session.flush()

                    # Generate slug
                    state_slug, city_slug, restaurant_slug = await generate_unique_slug(
                        session, state_code, row["city"], row["name"]
                    )
                    slug = RestaurantSlug(
                        restaurant_location_id=location.id,
                        state_slug=state_slug,
                        city_slug=city_slug,
                        restaurant_slug=restaurant_slug,
                        is_canonical=True,
                    )
                    session.add(slug)
                    imported += 1
                    print(f"  Imported: /{state_slug}/{city_slug}/{restaurant_slug}")

    print(f"\nDone. Imported {imported}, skipped {skipped}.")
    if skipped_invalid_state:
        print(f"  Skipped invalid state rows: {skipped_invalid_state}")


if __name__ == "__main__":
    csv_file = sys.argv[1] if len(sys.argv) > 1 else str(
        Path(__file__).resolve().parent.parent.parent.parent / "data" / "sample_restaurants.csv"
    )
    print(f"Importing from: {csv_file}")
    asyncio.run(import_csv(csv_file))
