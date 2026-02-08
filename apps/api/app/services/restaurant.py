from sqlalchemy import select, update
from sqlalchemy.ext.asyncio import AsyncSession

from app.models import Restaurant, RestaurantLocation, RestaurantSlug
from app.schemas.restaurant import RestaurantDetail

TEMPLATE_KEYS = {
    "ming",
    "ming-slim",
    "ming-balanced",
    "ming-full",
    "night-market",
    "wok-fire",
}


async def get_restaurant_detail(
    db: AsyncSession,
    state_slug: str,
    city_slug: str,
    restaurant_slug: str,
) -> RestaurantDetail | None:
    result = await db.execute(
        select(
            Restaurant.id,
            Restaurant.name,
            Restaurant.phone,
            Restaurant.website_url,
            Restaurant.has_online_ordering,
            Restaurant.has_ai_phone,
            Restaurant.is_claimed,
            RestaurantLocation.address1,
            RestaurantLocation.address2,
            RestaurantLocation.city,
            RestaurantLocation.state,
            RestaurantLocation.zip,
            RestaurantLocation.lat,
            RestaurantLocation.lng,
            RestaurantLocation.timezone,
            RestaurantLocation.hours_json,
            RestaurantLocation.template_key,
            RestaurantSlug.state_slug,
            RestaurantSlug.city_slug,
            RestaurantSlug.restaurant_slug,
            RestaurantSlug.is_canonical,
        )
        .join(RestaurantLocation, Restaurant.id == RestaurantLocation.restaurant_id)
        .join(RestaurantSlug, RestaurantLocation.id == RestaurantSlug.restaurant_location_id)
        .where(
            RestaurantSlug.state_slug == state_slug.lower(),
            RestaurantSlug.city_slug == city_slug.lower(),
            RestaurantSlug.restaurant_slug == restaurant_slug.lower(),
        )
    )
    row = result.one_or_none()
    if row is None:
        return None

    return RestaurantDetail(
        id=row.id,
        name=row.name,
        phone=row.phone,
        website_url=row.website_url,
        has_online_ordering=row.has_online_ordering,
        has_ai_phone=row.has_ai_phone,
        is_claimed=row.is_claimed,
        address1=row.address1,
        address2=row.address2,
        city=row.city,
        state=row.state,
        zip=row.zip,
        lat=row.lat,
        lng=row.lng,
        timezone=row.timezone,
        hours_json=row.hours_json,
        template_key=row.template_key,
        state_slug=row.state_slug,
        city_slug=row.city_slug,
        restaurant_slug=row.restaurant_slug,
        is_canonical=row.is_canonical,
    )


async def get_all_slugs(db: AsyncSession) -> list[dict]:
    """Return all canonical slugs for sitemap generation."""
    result = await db.execute(
        select(
            RestaurantSlug.state_slug,
            RestaurantSlug.city_slug,
            RestaurantSlug.restaurant_slug,
        ).where(RestaurantSlug.is_canonical.is_(True))
    )
    return [
        {
            "state_slug": row.state_slug,
            "city_slug": row.city_slug,
            "restaurant_slug": row.restaurant_slug,
        }
        for row in result.all()
    ]


async def set_restaurant_template(
    db: AsyncSession,
    state_slug: str,
    city_slug: str,
    restaurant_slug: str,
    template_key: str,
) -> RestaurantDetail:
    normalized_template = template_key.strip().lower()
    if normalized_template not in TEMPLATE_KEYS:
        raise ValueError("Invalid template key.")

    location_result = await db.execute(
        select(RestaurantLocation.id)
        .join(
            RestaurantSlug,
            RestaurantSlug.restaurant_location_id == RestaurantLocation.id,
        )
        .where(
            RestaurantSlug.state_slug == state_slug.lower(),
            RestaurantSlug.city_slug == city_slug.lower(),
            RestaurantSlug.restaurant_slug == restaurant_slug.lower(),
            RestaurantSlug.is_canonical.is_(True),
        )
    )
    location_id = location_result.scalar_one_or_none()
    if location_id is None:
        raise LookupError("Restaurant not found.")

    await db.execute(
        update(RestaurantLocation)
        .where(RestaurantLocation.id == location_id)
        .values(template_key=normalized_template)
    )
    await db.commit()

    detail = await get_restaurant_detail(db, state_slug, city_slug, restaurant_slug)
    if detail is None:
        raise LookupError("Restaurant not found.")
    return detail
