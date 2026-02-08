import math

from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models import Restaurant, RestaurantLocation, RestaurantSlug
from app.schemas.browse import CityOut, StateOut
from app.schemas.common import PaginatedResponse, PaginationParams
from app.schemas.restaurant import RestaurantListItem


async def list_states(db: AsyncSession) -> list[StateOut]:
    result = await db.execute(
        select(
            RestaurantLocation.state,
            func.count().label("restaurant_count"),
        )
        .group_by(RestaurantLocation.state)
        .order_by(RestaurantLocation.state)
    )
    return [
        StateOut(state=row.state, restaurant_count=row.restaurant_count)
        for row in result.all()
    ]


async def list_cities(
    db: AsyncSession, state: str, pagination: PaginationParams
) -> PaginatedResponse[CityOut]:
    base = (
        select(
            RestaurantLocation.city,
            RestaurantSlug.city_slug,
            RestaurantLocation.state,
            func.count().label("restaurant_count"),
        )
        .join(RestaurantSlug, RestaurantLocation.id == RestaurantSlug.restaurant_location_id)
        .where(RestaurantLocation.state == state.upper())
        .where(RestaurantSlug.is_canonical.is_(True))
        .group_by(RestaurantLocation.city, RestaurantSlug.city_slug, RestaurantLocation.state)
        .order_by(RestaurantLocation.city)
    )

    # Count total cities
    count_result = await db.execute(
        select(func.count()).select_from(
            base.subquery()
        )
    )
    total = count_result.scalar() or 0

    # Paginate
    result = await db.execute(
        base.offset(pagination.offset).limit(pagination.page_size)
    )
    items = [
        CityOut(
            city=row.city,
            city_slug=row.city_slug,
            state=row.state,
            restaurant_count=row.restaurant_count,
        )
        for row in result.all()
    ]

    return PaginatedResponse(
        items=items,
        total=total,
        page=pagination.page,
        page_size=pagination.page_size,
        total_pages=math.ceil(total / pagination.page_size) if total > 0 else 0,
    )


async def list_restaurants_in_city(
    db: AsyncSession,
    state_slug: str,
    city_slug: str,
    pagination: PaginationParams,
) -> PaginatedResponse[RestaurantListItem]:
    base = (
        select(
            Restaurant.name,
            Restaurant.phone,
            Restaurant.rating,
            Restaurant.user_rating_count,
            Restaurant.price_level,
            Restaurant.has_online_ordering,
            Restaurant.has_ai_phone,
            Restaurant.is_claimed,
            RestaurantLocation.address1,
            RestaurantLocation.city,
            RestaurantLocation.state,
            RestaurantLocation.zip,
            RestaurantSlug.state_slug,
            RestaurantSlug.city_slug,
            RestaurantSlug.restaurant_slug,
        )
        .join(RestaurantLocation, Restaurant.id == RestaurantLocation.restaurant_id)
        .join(RestaurantSlug, RestaurantLocation.id == RestaurantSlug.restaurant_location_id)
        .where(
            RestaurantSlug.state_slug == state_slug.lower(),
            RestaurantSlug.city_slug == city_slug.lower(),
            RestaurantSlug.is_canonical.is_(True),
        )
        .order_by(Restaurant.name)
    )

    count_result = await db.execute(
        select(func.count()).select_from(base.subquery())
    )
    total = count_result.scalar() or 0

    result = await db.execute(
        base.offset(pagination.offset).limit(pagination.page_size)
    )
    items = [
        RestaurantListItem(
            name=row.name,
            phone=row.phone,
            has_online_ordering=row.has_online_ordering,
            has_ai_phone=row.has_ai_phone,
            is_claimed=row.is_claimed,
            address1=row.address1,
            city=row.city,
            state=row.state,
            zip=row.zip,
            state_slug=row.state_slug,
            city_slug=row.city_slug,
            restaurant_slug=row.restaurant_slug,
            rating=row.rating,
            user_rating_count=row.user_rating_count,
            price_level=row.price_level,
        )
        for row in result.all()
    ]

    return PaginatedResponse(
        items=items,
        total=total,
        page=pagination.page,
        page_size=pagination.page_size,
        total_pages=math.ceil(total / pagination.page_size) if total > 0 else 0,
    )
