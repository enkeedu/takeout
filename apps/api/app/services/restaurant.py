from sqlalchemy import select, update
from sqlalchemy.ext.asyncio import AsyncSession

from app.models import OwnerSiteProfile, Restaurant, RestaurantLocation, RestaurantSlug
from app.schemas.restaurant import RestaurantDetail

TEMPLATE_KEYS = {
    "local-order",
    "local-storefront",
    "local-express",
    "local-feast",
    "ming",
    "ming-slim",
    "ming-balanced",
    "ming-full",
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
            RestaurantLocation.hours_json,
            Restaurant.has_online_ordering,
            Restaurant.has_ai_phone,
            Restaurant.is_claimed,
            Restaurant.rating,
            Restaurant.user_rating_count,
            Restaurant.price_level,
            Restaurant.google_place_id,
            Restaurant.google_maps_uri,
            RestaurantLocation.address1,
            RestaurantLocation.address2,
            RestaurantLocation.city,
            RestaurantLocation.state,
            RestaurantLocation.zip,
            RestaurantLocation.lat,
            RestaurantLocation.lng,
            RestaurantLocation.timezone,
            RestaurantLocation.has_takeout,
            RestaurantLocation.has_delivery,
            RestaurantLocation.has_dine_in,
            RestaurantLocation.business_status,
            RestaurantLocation.template_key,
            OwnerSiteProfile.business_name,
            OwnerSiteProfile.phone.label("owner_phone"),
            OwnerSiteProfile.address1.label("owner_address1"),
            OwnerSiteProfile.address2.label("owner_address2"),
            OwnerSiteProfile.city.label("owner_city"),
            OwnerSiteProfile.state.label("owner_state"),
            OwnerSiteProfile.zip.label("owner_zip"),
            OwnerSiteProfile.short_description,
            OwnerSiteProfile.logo_url,
            OwnerSiteProfile.photo_urls,
            OwnerSiteProfile.menu_image_urls,
            OwnerSiteProfile.template_key.label("owner_template_key"),
            OwnerSiteProfile.hours_json.label("owner_hours_json"),
            OwnerSiteProfile.is_published,
            RestaurantSlug.state_slug,
            RestaurantSlug.city_slug,
            RestaurantSlug.restaurant_slug,
            RestaurantSlug.is_canonical,
        )
        .join(RestaurantLocation, Restaurant.id == RestaurantLocation.restaurant_id)
        .join(RestaurantSlug, RestaurantLocation.id == RestaurantSlug.restaurant_location_id)
        .outerjoin(OwnerSiteProfile, OwnerSiteProfile.restaurant_id == Restaurant.id)
        .where(
            RestaurantSlug.state_slug == state_slug.lower(),
            RestaurantSlug.city_slug == city_slug.lower(),
            RestaurantSlug.restaurant_slug == restaurant_slug.lower(),
        )
    )
    row = result.one_or_none()
    if row is None:
        return None

    use_owner_profile = bool(row.is_published)
    effective_name = (row.business_name or row.name) if use_owner_profile else row.name
    effective_phone = (row.owner_phone or row.phone) if use_owner_profile else row.phone
    effective_address1 = (
        (row.owner_address1 or row.address1) if use_owner_profile else row.address1
    )
    effective_address2 = (
        (row.owner_address2 or row.address2) if use_owner_profile else row.address2
    )
    effective_city = (row.owner_city or row.city) if use_owner_profile else row.city
    effective_state = (row.owner_state or row.state) if use_owner_profile else row.state
    effective_zip = (row.owner_zip or row.zip) if use_owner_profile else row.zip
    effective_hours = (
        (row.owner_hours_json or row.hours_json) if use_owner_profile else row.hours_json
    )
    effective_template_key = (
        (row.owner_template_key or row.template_key)
        if use_owner_profile
        else row.template_key
    )

    return RestaurantDetail(
        id=row.id,
        name=effective_name,
        short_description=row.short_description if use_owner_profile else None,
        phone=effective_phone,
        website_url=row.website_url,
        logo_url=row.logo_url if use_owner_profile else None,
        photo_urls=row.photo_urls if use_owner_profile else None,
        menu_image_urls=row.menu_image_urls if use_owner_profile else None,
        site_profile_published=use_owner_profile,
        has_online_ordering=row.has_online_ordering,
        has_ai_phone=row.has_ai_phone,
        is_claimed=row.is_claimed,
        rating=row.rating,
        user_rating_count=row.user_rating_count,
        price_level=row.price_level,
        google_place_id=row.google_place_id,
        google_maps_uri=row.google_maps_uri,
        address1=effective_address1,
        address2=effective_address2,
        city=effective_city,
        state=effective_state,
        zip=effective_zip,
        lat=row.lat,
        lng=row.lng,
        timezone=row.timezone,
        hours_json=effective_hours,
        has_takeout=row.has_takeout,
        has_delivery=row.has_delivery,
        has_dine_in=row.has_dine_in,
        business_status=row.business_status,
        template_key=effective_template_key,
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
