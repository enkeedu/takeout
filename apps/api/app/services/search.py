import math

from sqlalchemy import desc, func, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models import Restaurant, RestaurantLocation, RestaurantSlug
from app.schemas.common import PaginatedResponse, PaginationParams
from app.schemas.restaurant import SearchResultItem


async def search_restaurants(
    db: AsyncSession,
    q: str,
    pagination: PaginationParams,
    state: str | None = None,
    city: str | None = None,
) -> PaginatedResponse[SearchResultItem]:
    tsquery = func.plainto_tsquery("english", q)

    base = (
        select(
            Restaurant.name,
            Restaurant.phone,
            RestaurantLocation.address1,
            RestaurantLocation.city,
            RestaurantLocation.state,
            RestaurantSlug.state_slug,
            RestaurantSlug.city_slug,
            RestaurantSlug.restaurant_slug,
            func.ts_rank(RestaurantLocation.search_vector, tsquery).label("rank"),
        )
        .join(RestaurantLocation, Restaurant.id == RestaurantLocation.restaurant_id)
        .join(RestaurantSlug, RestaurantLocation.id == RestaurantSlug.restaurant_location_id)
        .where(
            RestaurantLocation.search_vector.op("@@")(tsquery),
            RestaurantSlug.is_canonical.is_(True),
        )
    )

    if state:
        base = base.where(RestaurantLocation.state == state.upper())
    if city:
        base = base.where(RestaurantSlug.city_slug == city.lower())

    base = base.order_by(desc("rank"))

    count_result = await db.execute(
        select(func.count()).select_from(base.subquery())
    )
    total = count_result.scalar() or 0

    result = await db.execute(
        base.offset(pagination.offset).limit(pagination.page_size)
    )
    items = [
        SearchResultItem(
            name=row.name,
            phone=row.phone,
            address1=row.address1,
            city=row.city,
            state=row.state,
            state_slug=row.state_slug,
            city_slug=row.city_slug,
            restaurant_slug=row.restaurant_slug,
            rank=row.rank,
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
