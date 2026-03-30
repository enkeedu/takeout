import math

from sqlalchemy import case, func, select
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
    online_expr = func.sum(
        case((Restaurant.has_online_ordering.is_(True), 1), else_=0)
    )
    no_online_expr = func.sum(
        case((Restaurant.has_online_ordering.is_(False), 1), else_=0)
    )
    claimed_expr = func.sum(case((Restaurant.is_claimed.is_(True), 1), else_=0))
    unclaimed_expr = func.sum(case((Restaurant.is_claimed.is_(False), 1), else_=0))
    ai_expr = func.sum(case((Restaurant.has_ai_phone.is_(True), 1), else_=0))
    website_expr = func.sum(
        case((Restaurant.website_url.is_not(None), 1), else_=0)
    )
    opportunity_expr = no_online_expr * 4 + unclaimed_expr * 3 + func.count()

    base = (
        select(
            RestaurantLocation.city,
            RestaurantSlug.city_slug,
            RestaurantLocation.state,
            func.count().label("restaurant_count"),
            online_expr.label("online_ordering_count"),
            no_online_expr.label("no_online_ordering_count"),
            claimed_expr.label("claimed_count"),
            unclaimed_expr.label("unclaimed_count"),
            ai_expr.label("ai_phone_count"),
            website_expr.label("website_count"),
            opportunity_expr.label("opportunity_score"),
        )
        .join(Restaurant, Restaurant.id == RestaurantLocation.restaurant_id)
        .join(RestaurantSlug, RestaurantLocation.id == RestaurantSlug.restaurant_location_id)
        .where(RestaurantLocation.state == state.upper())
        .where(RestaurantSlug.is_canonical.is_(True))
        .group_by(RestaurantLocation.city, RestaurantSlug.city_slug, RestaurantLocation.state)
        .order_by(opportunity_expr.desc(), func.count().desc(), RestaurantLocation.city)
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
            online_ordering_count=row.online_ordering_count,
            no_online_ordering_count=row.no_online_ordering_count,
            claimed_count=row.claimed_count,
            unclaimed_count=row.unclaimed_count,
            ai_phone_count=row.ai_phone_count,
            website_count=row.website_count,
            opportunity_score=row.opportunity_score,
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
    lead_score_expr = (
        case((Restaurant.is_claimed.is_(False), 45), else_=0)
        + case((Restaurant.has_online_ordering.is_(False), 35), else_=0)
        + case((Restaurant.website_url.is_(None), 10), else_=0)
        + case((Restaurant.has_ai_phone.is_(False), 10), else_=0)
        + case(
            (Restaurant.user_rating_count >= 100, 12),
            (Restaurant.user_rating_count >= 50, 8),
            (Restaurant.user_rating_count >= 20, 4),
            else_=0,
        )
    )

    base = (
        select(
            Restaurant.name,
            Restaurant.phone,
            Restaurant.website_url,
            Restaurant.rating,
            Restaurant.user_rating_count,
            Restaurant.price_level,
            Restaurant.has_online_ordering,
            Restaurant.has_ai_phone,
            Restaurant.is_claimed,
            lead_score_expr.label("lead_score"),
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
        .order_by(
            lead_score_expr.desc(),
            Restaurant.user_rating_count.desc().nullslast(),
            Restaurant.rating.desc().nullslast(),
            Restaurant.name,
        )
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
            website_url=row.website_url,
            has_online_ordering=row.has_online_ordering,
            has_ai_phone=row.has_ai_phone,
            is_claimed=row.is_claimed,
            lead_score=row.lead_score,
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
