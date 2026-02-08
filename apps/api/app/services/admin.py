import math

from sqlalchemy import select, func
from sqlalchemy.ext.asyncio import AsyncSession

from app.models import Restaurant, RestaurantLocation, RestaurantSlug, WebsiteAudit
from app.schemas.admin import ChartEntry, LeadItem, LeadStats, LeadsResponse
from app.schemas.common import PaginationParams

PLATFORM_COSTS: dict[str, int] = {
    "beyondmenu": 50,
    "menupix": 0,
    "wix": 30,
    "squarespace": 35,
    "wordpress": 25,
    "godaddy": 20,
    "toast": 75,
    "chownow": 150,
    "popmenu": 300,
    "menufy": 100,
    "gloria-food": 0,
    "square": 30,
    "clover": 70,
    "olo": 200,
    "grubhub": 0,
    "doordash": 0,
    "ubereats": 0,
    "shopify": 40,
    "weebly": 15,
}
DEFAULT_PLATFORM_COST = 50

LOW_QUALITY_PLATFORMS = {"beyondmenu", "menupix", "allmenus", "zmenu", "restaurantji"}

SORT_KEYS = {"lead_score", "name", "state", "estimated_monthly_spend", "rating"}


def _compute_lead_score(
    website_url: str | None,
    http_status: int | None,
    audit_error: str | None,
    ssl_valid: bool | None,
    platform: str | None,
    restaurant_has_ordering: bool,
    audit_has_ordering: bool | None,
    user_rating_count: int | None,
) -> int:
    score = 0
    if not website_url:
        score += 3
    elif (http_status and http_status >= 400) or audit_error:
        score += 3
    if ssl_valid is False:
        score += 2
    if platform and platform.lower() in LOW_QUALITY_PLATFORMS:
        score += 2
    if not restaurant_has_ordering and not audit_has_ordering:
        score += 2
    if user_rating_count is not None and user_rating_count < 20:
        score += 1
    return score


def _compute_estimated_spend(website_url: str | None, platform: str | None) -> int:
    if not website_url:
        return 0
    if platform:
        return PLATFORM_COSTS.get(platform.lower(), DEFAULT_PLATFORM_COST)
    return DEFAULT_PLATFORM_COST


async def get_leads(
    db: AsyncSession,
    pagination: PaginationParams,
    state_filter: str | None = None,
    sort_by: str = "lead_score",
    sort_dir: str = "desc",
) -> LeadsResponse:
    # Latest audit per restaurant via DISTINCT ON
    latest_audit = (
        select(
            WebsiteAudit.restaurant_id,
            WebsiteAudit.http_status,
            WebsiteAudit.ssl_valid,
            WebsiteAudit.platform,
            WebsiteAudit.has_online_ordering.label("audit_has_ordering"),
            WebsiteAudit.error.label("audit_error"),
        )
        .distinct(WebsiteAudit.restaurant_id)
        .order_by(WebsiteAudit.restaurant_id, WebsiteAudit.checked_at.desc())
        .subquery("latest_audit")
    )

    stmt = (
        select(
            Restaurant.id,
            Restaurant.name,
            Restaurant.phone,
            Restaurant.website_url,
            Restaurant.has_online_ordering,
            Restaurant.rating,
            Restaurant.user_rating_count,
            RestaurantLocation.city,
            RestaurantLocation.state,
            RestaurantSlug.state_slug,
            RestaurantSlug.city_slug,
            RestaurantSlug.restaurant_slug,
            latest_audit.c.http_status,
            latest_audit.c.ssl_valid,
            latest_audit.c.platform,
            latest_audit.c.audit_has_ordering,
            latest_audit.c.audit_error,
        )
        .join(RestaurantLocation, Restaurant.id == RestaurantLocation.restaurant_id)
        .join(RestaurantSlug, RestaurantLocation.id == RestaurantSlug.restaurant_location_id)
        .outerjoin(latest_audit, Restaurant.id == latest_audit.c.restaurant_id)
        .where(RestaurantSlug.is_canonical.is_(True))
    )

    if state_filter:
        stmt = stmt.where(RestaurantLocation.state == state_filter.upper())

    result = await db.execute(stmt)
    rows = result.all()

    # Compute scores and build lead items
    leads: list[LeadItem] = []
    no_website = 0
    broken = 0
    total_score = 0

    for row in rows:
        score = _compute_lead_score(
            website_url=row.website_url,
            http_status=row.http_status,
            audit_error=row.audit_error,
            ssl_valid=row.ssl_valid,
            platform=row.platform,
            restaurant_has_ordering=row.has_online_ordering,
            audit_has_ordering=row.audit_has_ordering,
            user_rating_count=row.user_rating_count,
        )
        spend = _compute_estimated_spend(row.website_url, row.platform)
        total_score += score

        if not row.website_url:
            no_website += 1
        elif (row.http_status and row.http_status >= 400) or row.audit_error:
            broken += 1

        leads.append(LeadItem(
            restaurant_id=str(row.id),
            name=row.name,
            city=row.city,
            state=row.state,
            phone=row.phone,
            website_url=row.website_url,
            platform=row.platform,
            has_online_ordering=row.has_online_ordering or bool(row.audit_has_ordering),
            http_status=row.http_status,
            ssl_valid=row.ssl_valid,
            audit_error=row.audit_error,
            rating=row.rating,
            user_rating_count=row.user_rating_count,
            lead_score=score,
            estimated_monthly_spend=spend,
            state_slug=row.state_slug,
            city_slug=row.city_slug,
            restaurant_slug=row.restaurant_slug,
        ))

    # Sort
    if sort_by not in SORT_KEYS:
        sort_by = "lead_score"
    reverse = sort_dir == "desc"
    leads.sort(
        key=lambda l: (getattr(l, sort_by) or 0, l.name),
        reverse=reverse,
    )

    total = len(leads)
    avg_score = total_score / total if total else 0

    # Chart aggregations
    platform_map: dict[str, int] = {}
    score_buckets = {"0-2": 0, "3-4": 0, "5-6": 0, "7-8": 0, "9+": 0}
    has_website_ok = 0
    has_ordering = 0
    no_ordering = 0

    for lead in leads:
        # Platform counts
        p = lead.platform or ("No website" if not lead.website_url else "Unknown")
        platform_map[p] = platform_map.get(p, 0) + 1

        # Score distribution
        s = lead.lead_score
        if s <= 2:
            score_buckets["0-2"] += 1
        elif s <= 4:
            score_buckets["3-4"] += 1
        elif s <= 6:
            score_buckets["5-6"] += 1
        elif s <= 8:
            score_buckets["7-8"] += 1
        else:
            score_buckets["9+"] += 1

        # Website status
        if lead.website_url and not lead.audit_error and not (lead.http_status and lead.http_status >= 400):
            has_website_ok += 1

        # Ordering
        if lead.has_online_ordering:
            has_ordering += 1
        else:
            no_ordering += 1

    platform_counts = sorted(
        [ChartEntry(label=k, value=v) for k, v in platform_map.items()],
        key=lambda e: e.value, reverse=True,
    )
    score_distribution = [ChartEntry(label=k, value=v) for k, v in score_buckets.items()]
    website_status = [
        ChartEntry(label="Has website", value=has_website_ok),
        ChartEntry(label="No website", value=no_website),
        ChartEntry(label="Broken", value=broken),
    ]
    ordering_counts = [
        ChartEntry(label="Has ordering", value=has_ordering),
        ChartEntry(label="No ordering", value=no_ordering),
    ]

    stats = LeadStats(
        total_restaurants=total,
        no_website_count=no_website,
        broken_website_count=broken,
        avg_lead_score=round(avg_score, 1),
        platform_counts=platform_counts,
        score_distribution=score_distribution,
        website_status=website_status,
        ordering_counts=ordering_counts,
    )

    # Paginate
    start = pagination.offset
    end = start + pagination.page_size
    page_items = leads[start:end]

    return LeadsResponse(
        stats=stats,
        items=page_items,
        total=total,
        page=pagination.page,
        page_size=pagination.page_size,
        total_pages=math.ceil(total / pagination.page_size) if total else 0,
    )


async def get_leads_for_csv(
    db: AsyncSession,
    state_filter: str | None = None,
    sort_by: str = "lead_score",
    sort_dir: str = "desc",
) -> list[LeadItem]:
    """Return all leads (no pagination) for CSV export."""
    # Use a large page_size that bypasses PaginationParams validation
    pagination = PaginationParams.model_construct(page=1, page_size=1_000_000)
    resp = await get_leads(db, pagination, state_filter, sort_by, sort_dir)
    return resp.items
