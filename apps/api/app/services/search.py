import math
import re

from sqlalchemy import and_, case, desc, func, literal, or_, select
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
    name: str | None = None,
    phone: str | None = None,
    zip_code: str | None = None,
    address: str | None = None,
) -> PaginatedResponse[SearchResultItem]:
    normalized_q = " ".join((q or "").strip().split())
    normalized_name = " ".join((name or "").strip().split())
    normalized_phone = re.sub(r"\D", "", phone or "")
    normalized_address = " ".join((address or "").strip().split())
    normalized_city = " ".join((city or "").strip().split())
    normalized_state = " ".join((state or "").strip().split())
    normalized_zip = " ".join((zip_code or "").strip().split())

    query_parts = [
        normalized_q,
        normalized_name,
        normalized_address,
        normalized_city,
        normalized_state,
        normalized_zip,
    ]
    normalized_query = " ".join(part for part in query_parts if part)
    lowered_query = normalized_query.lower()
    hyphen_query = lowered_query.replace(" ", "-")
    normalized_query_digits = re.sub(r"\D", "", normalized_query)
    phone_digits_expr = func.regexp_replace(
        func.coalesce(Restaurant.phone, ""),
        r"[^0-9]",
        "",
        "g",
    )

    has_structured_filter = any(
        [
            normalized_name,
            normalized_phone,
            normalized_address,
            normalized_city,
            normalized_state,
            normalized_zip,
        ]
    )
    if not normalized_query and not has_structured_filter:
        return PaginatedResponse(
            items=[],
            total=0,
            page=pagination.page,
            page_size=pagination.page_size,
            total_pages=0,
        )

    if normalized_query:
        tokens = [token for token in re.findall(r"[a-z0-9]+", lowered_query) if len(token) >= 2]
        tsquery = func.websearch_to_tsquery("english", normalized_query)
        fts_match = func.coalesce(RestaurantLocation.search_vector.op("@@")(tsquery), False)
        fts_rank = func.coalesce(func.ts_rank(RestaurantLocation.search_vector, tsquery), 0.0)

        searchable_text = func.concat_ws(
            " ",
            Restaurant.name,
            RestaurantLocation.address1,
            RestaurantLocation.city,
            RestaurantLocation.state,
            RestaurantLocation.zip,
        )
        token_all_match = (
            and_(*[searchable_text.ilike(f"%{token}%") for token in tokens]) if tokens else None
        )
        broad_match = or_(
            Restaurant.name.ilike(f"%{normalized_query}%"),
            RestaurantLocation.address1.ilike(f"%{normalized_query}%"),
            RestaurantLocation.city.ilike(f"%{normalized_query}%"),
            RestaurantLocation.state.ilike(f"%{normalized_query}%"),
            RestaurantLocation.zip.ilike(f"{normalized_query}%"),
            phone_digits_expr.ilike(f"%{normalized_query_digits}%")
            if normalized_query_digits
            else False,
            RestaurantSlug.city_slug.ilike(f"%{hyphen_query}%"),
            RestaurantSlug.restaurant_slug.ilike(f"%{hyphen_query}%"),
        )

        exact_name_score = case((func.lower(Restaurant.name) == lowered_query, 8.0), else_=0.0)
        prefix_name_score = case((func.lower(Restaurant.name).like(f"{lowered_query}%"), 4.0), else_=0.0)
        contains_name_score = case((func.lower(Restaurant.name).like(f"%{lowered_query}%"), 2.0), else_=0.0)
        city_score = case((func.lower(RestaurantLocation.city).like(f"%{lowered_query}%"), 1.4), else_=0.0)
        state_score = case((func.lower(RestaurantLocation.state) == lowered_query, 1.2), else_=0.0)
        zip_score = case((RestaurantLocation.zip.ilike(f"{normalized_query}%"), 1.8), else_=0.0)
        phone_score = (
            case((phone_digits_expr.ilike(f"%{normalized_query_digits}%"), 2.6), else_=0.0)
            if normalized_query_digits
            else 0.0
        )
        token_score = case((token_all_match, 2.5), else_=0.0) if token_all_match is not None else 0.0
        rank_score = (
            fts_rank * 2.5
            + exact_name_score
            + prefix_name_score
            + contains_name_score
            + city_score
            + state_score
            + zip_score
            + phone_score
            + token_score
        )
        text_match = or_(
            fts_match,
            broad_match,
            token_all_match if token_all_match is not None else False,
        )
    else:
        rank_score = literal(0.0)
        text_match = literal(True)

    base = (
        select(
            Restaurant.name,
            Restaurant.phone,
            Restaurant.website_url,
            Restaurant.has_online_ordering,
            Restaurant.is_claimed,
            Restaurant.rating,
            Restaurant.user_rating_count,
            RestaurantLocation.address1,
            RestaurantLocation.city,
            RestaurantLocation.state,
            RestaurantSlug.state_slug,
            RestaurantSlug.city_slug,
            RestaurantSlug.restaurant_slug,
            rank_score.label("rank"),
        )
        .join(RestaurantLocation, Restaurant.id == RestaurantLocation.restaurant_id)
        .join(RestaurantSlug, RestaurantLocation.id == RestaurantSlug.restaurant_location_id)
        .where(
            text_match,
            RestaurantSlug.is_canonical.is_(True),
        )
    )

    if normalized_name:
        base = base.where(Restaurant.name.ilike(f"%{normalized_name}%"))
    if normalized_phone:
        base = base.where(phone_digits_expr.ilike(f"%{normalized_phone}%"))
    if normalized_address:
        base = base.where(RestaurantLocation.address1.ilike(f"%{normalized_address}%"))
    if normalized_state:
        if len(normalized_state) == 2:
            base = base.where(RestaurantLocation.state == normalized_state.upper())
        else:
            base = base.where(RestaurantLocation.state.ilike(f"%{normalized_state}%"))
    if normalized_city:
        city_slug = normalized_city.lower().replace(" ", "-")
        base = base.where(
            or_(
                RestaurantLocation.city.ilike(f"%{normalized_city}%"),
                RestaurantSlug.city_slug == city_slug,
            )
        )
    if normalized_zip:
        base = base.where(RestaurantLocation.zip.ilike(f"{normalized_zip}%"))

    base = base.order_by(desc("rank"), Restaurant.user_rating_count.desc().nullslast(), Restaurant.name)

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
            website_url=row.website_url,
            has_online_ordering=row.has_online_ordering,
            is_claimed=row.is_claimed,
            rating=row.rating,
            user_rating_count=row.user_rating_count,
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
