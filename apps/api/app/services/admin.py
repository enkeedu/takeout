import asyncio
import logging
import math
import uuid
from email.message import EmailMessage

from sqlalchemy import select, func
from sqlalchemy.ext.asyncio import AsyncSession

from app.config import settings
from app.models import ClaimRequest, Restaurant, RestaurantLocation, RestaurantSlug, WebsiteAudit
from app.schemas.admin import (
    AdminClaimQueueItem,
    AdminClaimQueueResponse,
    AdminClaimQueueUpdateIn,
    AdminDiagnosticsOut,
    ChartEntry,
    LeadItem,
    LeadStats,
    LeadsResponse,
)
from app.schemas.common import PaginationParams
from app.services.claim import (
    ClaimServiceError,
    _RestaurantContext,
    _send_email_sync,
    _serialize_claim_request_status,
    _utc_now,
    send_owner_launch_notification,
)

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

logger = logging.getLogger(__name__)


def _smtp_sender() -> str:
    return (settings.claim_alert_email_from or settings.smtp_username or "").strip()


def _smtp_transport_ready() -> bool:
    return bool((settings.smtp_host or "").strip() and settings.smtp_port)


def _smtp_auth_configured() -> bool:
    return bool((settings.smtp_username or "").strip() and (settings.smtp_password or "").strip())


def _smtp_auth_partial() -> bool:
    username = (settings.smtp_username or "").strip()
    password = (settings.smtp_password or "").strip()
    return bool((username and not password) or (password and not username))


def _build_admin_claim_queue_item(
    claim_request: ClaimRequest,
    restaurant_name: str,
    restaurant_phone: str | None,
    address1: str,
    city: str,
    state: str,
    state_slug: str,
    city_slug: str,
    restaurant_slug: str,
) -> AdminClaimQueueItem:
    restaurant = _RestaurantContext(
        id=claim_request.restaurant_id,
        name=restaurant_name,
        phone=restaurant_phone,
        address1=address1,
        city=city,
        state=state,
        state_slug=state_slug,
        city_slug=city_slug,
        restaurant_slug=restaurant_slug,
    )
    status = _serialize_claim_request_status(claim_request, restaurant)
    return AdminClaimQueueItem(
        claim_request_id=str(claim_request.id),
        status=status.status,
        status_label=status.status_label,
        status_detail=status.status_detail,
        payment_unlocked=status.payment_unlocked,
        setup_deposit_state=status.setup_deposit_state,
        kickoff_state=status.kickoff_state,
        review_state=status.review_state,
        submitted_at=claim_request.submitted_at,
        kickoff_scheduled_for=claim_request.kickoff_scheduled_for,
        review_responded_at=claim_request.review_responded_at,
        review_issue_areas=claim_request.review_issue_areas or [],
        review_notes=claim_request.review_notes,
        setup_intake_status=status.setup_intake_status,
        setup_intake_submitted_at=status.setup_intake_submitted_at,
        setup_intake_summary=status.setup_intake_summary,
        template_key=claim_request.template_key,
        owner_name=claim_request.owner_name,
        owner_phone=claim_request.owner_phone,
        owner_email=claim_request.owner_email,
        preferred_contact_method=claim_request.preferred_contact_method,
        verification_method=claim_request.verification_method,
        verification_status=claim_request.verification_status,
        manual_review_reason=claim_request.manual_review_reason,
        restaurant_name=restaurant_name,
        restaurant_city=city,
        restaurant_state=state,
        state_slug=state_slug,
        city_slug=city_slug,
        restaurant_slug=restaurant_slug,
    )


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


async def get_claim_queue(db: AsyncSession) -> AdminClaimQueueResponse:
    stmt = (
        select(
            ClaimRequest,
            Restaurant.name,
            Restaurant.phone,
            RestaurantLocation.address1,
            RestaurantLocation.city,
            RestaurantLocation.state,
            RestaurantSlug.state_slug,
            RestaurantSlug.city_slug,
            RestaurantSlug.restaurant_slug,
        )
        .join(Restaurant, ClaimRequest.restaurant_id == Restaurant.id)
        .join(RestaurantLocation, Restaurant.id == RestaurantLocation.restaurant_id)
        .join(RestaurantSlug, RestaurantLocation.id == RestaurantSlug.restaurant_location_id)
        .where(RestaurantSlug.is_canonical.is_(True))
        .order_by(ClaimRequest.submitted_at.desc())
        .limit(100)
    )
    result = await db.execute(stmt)
    items: list[AdminClaimQueueItem] = []
    for (
        claim_request,
        restaurant_name,
        restaurant_phone,
        address1,
        city,
        state,
        state_slug,
        city_slug,
        restaurant_slug,
    ) in result.all():
        items.append(
            _build_admin_claim_queue_item(
                claim_request,
                restaurant_name,
                restaurant_phone,
                address1,
                city,
                state,
                state_slug,
                city_slug,
                restaurant_slug,
            )
        )
    return AdminClaimQueueResponse(items=items)


async def get_admin_diagnostics() -> AdminDiagnosticsOut:
    payment_provider = settings.claim_payment_provider.strip().lower() or "mock"
    sms_provider = settings.claim_sms_provider.strip().lower() or "mock"
    smtp_ready = _smtp_transport_ready()
    smtp_auth_configured = _smtp_auth_configured()
    sender_ready = bool(_smtp_sender())
    web_base_url_configured = bool((settings.web_base_url or "").strip())
    claim_alert_recipient_ready = bool((settings.claim_alert_email_to or "").strip())
    stripe_ready = bool(
        payment_provider == "stripe"
        and (settings.stripe_secret_key or "").strip()
        and (settings.stripe_webhook_secret or "").strip()
    )
    claim_alert_ready = bool(
        smtp_ready
        and sender_ready
        and claim_alert_recipient_ready
    )
    owner_notifications_ready = bool(
        smtp_ready
        and sender_ready
        and web_base_url_configured
    )

    warnings: list[str] = []
    if not (settings.admin_token or "").strip():
        warnings.append(
            "API admin token is missing. /admin actions stay blocked until ADMIN_TOKEN is set."
        )
    if payment_provider == "stripe" and not stripe_ready:
        warnings.append(
            "Stripe is selected, but the secret key or webhook secret is still missing."
        )
    if payment_provider != "stripe":
        warnings.append(
            "Stripe is not the active payment provider yet. Deposit checkout will fall back to mock mode."
        )
    if not smtp_ready:
        warnings.append(
            "SMTP host or port is missing, so owner launch emails and internal alerts cannot send yet."
        )
    elif _smtp_auth_partial():
        warnings.append(
            "SMTP username/password is only partially configured. Leave both blank for no-auth SMTP or set both values together."
        )
    if smtp_ready and not sender_ready:
        warnings.append(
            "SMTP transport is configured, but sender identity is missing. Set CLAIM_ALERT_EMAIL_FROM or SMTP_USERNAME."
        )
    if smtp_ready and sender_ready and not web_base_url_configured:
        warnings.append(
            "Owner notification emails need WEB_BASE_URL so launch links point to the right site."
        )
    if smtp_ready and sender_ready and not claim_alert_recipient_ready:
        warnings.append(
            "Internal claim alert emails need CLAIM_ALERT_EMAIL_TO so new claims have an inbox destination."
        )

    return AdminDiagnosticsOut(
        api_admin_token_configured=bool((settings.admin_token or "").strip()),
        payment_provider=payment_provider,
        stripe_ready=stripe_ready,
        sms_provider=sms_provider,
        smtp_ready=smtp_ready,
        smtp_auth_configured=smtp_auth_configured,
        smtp_sender_ready=sender_ready,
        web_base_url_configured=web_base_url_configured,
        claim_alert_recipient_ready=claim_alert_recipient_ready,
        claim_alert_ready=claim_alert_ready,
        owner_notifications_ready=owner_notifications_ready,
        warnings=warnings,
    )


async def send_admin_test_email(recipient: str | None = None) -> str:
    if not _smtp_transport_ready():
        raise ClaimServiceError(
            400,
            "SMTP host/port is not configured yet. Set SMTP_HOST and SMTP_PORT first.",
        )

    sender = _smtp_sender()
    if not sender:
        raise ClaimServiceError(
            400,
            "Sender identity is missing. Set CLAIM_ALERT_EMAIL_FROM or SMTP_USERNAME first.",
        )

    target = (recipient or settings.claim_alert_email_to or "").strip()
    if not target:
        raise ClaimServiceError(
            400,
            "No test-email recipient was provided. Add CLAIM_ALERT_EMAIL_TO or enter a recipient.",
        )
    if "@" not in target:
        raise ClaimServiceError(400, "Test email recipient must be a valid email address.")

    message = EmailMessage()
    message["Subject"] = "Chinese Takeout SMTP test"
    message["From"] = sender
    message["To"] = target
    message.set_content(
        "\n".join(
            [
                "This is a test email from the Chinese Takeout admin readiness panel.",
                "",
                f"Sent at: {_utc_now().isoformat()}",
                f"SMTP host: {(settings.smtp_host or '').strip() or '(missing)'}",
                f"SMTP port: {settings.smtp_port or '(missing)'}",
                f"SMTP auth configured: {'yes' if _smtp_auth_configured() else 'no'}",
                f"WEB_BASE_URL configured: {'yes' if (settings.web_base_url or '').strip() else 'no'}",
                "",
                "If you received this email, SMTP delivery from the current API environment is working.",
            ]
        )
    )

    try:
        await asyncio.to_thread(_send_email_sync, message)
    except Exception as exc:
        raise ClaimServiceError(500, f"SMTP test failed: {exc}") from exc

    return target


async def update_claim_queue_item(
    db: AsyncSession,
    claim_request_id: str,
    payload: AdminClaimQueueUpdateIn,
) -> AdminClaimQueueItem:
    try:
        claim_uuid = uuid.UUID(claim_request_id)
    except ValueError as exc:
        raise ClaimServiceError(400, "Claim request ID is invalid.") from exc

    result = await db.execute(
        select(ClaimRequest).where(ClaimRequest.id == claim_uuid)
    )
    claim_request = result.scalar_one_or_none()
    if claim_request is None:
        raise ClaimServiceError(404, "Claim request not found.")

    now = _utc_now()
    action = payload.action

    if action == "approve_manual_review":
        if claim_request.verification_status != "manual_review_requested":
            raise ClaimServiceError(400, "This claim is not waiting on manual review.")
        claim_request.verification_status = "verified"
        claim_request.status = "verified_request_received"
    elif action == "mark_kickoff_scheduled":
        if claim_request.setup_deposit_state != "paid":
            raise ClaimServiceError(400, "Setup deposit must be paid before kickoff is scheduled.")
        claim_request.kickoff_state = "scheduled"
        claim_request.kickoff_scheduled_for = payload.kickoff_scheduled_for or now
        claim_request.status = "kickoff_scheduled"
    elif action == "mark_kickoff_confirmed":
        if claim_request.setup_deposit_state != "paid":
            raise ClaimServiceError(400, "Setup deposit must be paid before kickoff is confirmed.")
        claim_request.kickoff_state = "confirmed"
        claim_request.kickoff_scheduled_for = (
            claim_request.kickoff_scheduled_for or payload.kickoff_scheduled_for or now
        )
        claim_request.status = "kickoff_confirmed"
    elif action == "mark_build_in_progress":
        if claim_request.setup_deposit_state != "paid":
            raise ClaimServiceError(400, "Setup deposit must be paid before build can start.")
        if claim_request.kickoff_state == "pending":
            claim_request.kickoff_state = "confirmed"
            claim_request.kickoff_scheduled_for = claim_request.kickoff_scheduled_for or now
        claim_request.status = "build_in_progress"
    elif action == "mark_review_ready":
        claim_request.status = "ready_for_review"
        claim_request.review_state = "pending"
        claim_request.review_responded_at = None
        claim_request.review_issue_areas = None
        claim_request.review_notes = None
    elif action == "mark_live":
        if claim_request.setup_deposit_state != "paid":
            raise ClaimServiceError(400, "Setup deposit must be paid before launch can go live.")
        if claim_request.status != "approved_for_launch":
            raise ClaimServiceError(
                400, "The owner must approve the review before the site can go live."
            )
        claim_request.status = "live"
        claim_request.monthly_billing_starts_at = claim_request.monthly_billing_starts_at or now
        if claim_request.kickoff_state == "pending":
            claim_request.kickoff_state = "confirmed"
            claim_request.kickoff_scheduled_for = claim_request.kickoff_scheduled_for or now
    else:
        raise ClaimServiceError(400, "Unsupported admin action.")

    await db.commit()

    row = await db.execute(
        select(
            ClaimRequest,
            Restaurant.name,
            Restaurant.phone,
            RestaurantLocation.address1,
            RestaurantLocation.city,
            RestaurantLocation.state,
            RestaurantSlug.state_slug,
            RestaurantSlug.city_slug,
            RestaurantSlug.restaurant_slug,
        )
        .join(Restaurant, ClaimRequest.restaurant_id == Restaurant.id)
        .join(RestaurantLocation, Restaurant.id == RestaurantLocation.restaurant_id)
        .join(RestaurantSlug, RestaurantLocation.id == RestaurantSlug.restaurant_location_id)
        .where(
            ClaimRequest.id == claim_request.id,
            RestaurantSlug.is_canonical.is_(True),
        )
    )
    (
        claim_request,
        restaurant_name,
        restaurant_phone,
        address1,
        city,
        state,
        state_slug,
        city_slug,
        restaurant_slug,
    ) = row.one()
    restaurant = _RestaurantContext(
        id=claim_request.restaurant_id,
        name=restaurant_name,
        phone=restaurant_phone,
        address1=address1,
        city=city,
        state=state,
        state_slug=state_slug,
        city_slug=city_slug,
        restaurant_slug=restaurant_slug,
    )
    notification_event: str | None = None
    if action == "approve_manual_review":
        notification_event = "ownership_approved"
    elif action == "mark_kickoff_scheduled":
        notification_event = "kickoff_scheduled"
    elif action == "mark_review_ready":
        notification_event = "review_ready"
    elif action == "mark_live":
        notification_event = "site_live"

    if notification_event:
        try:
            await send_owner_launch_notification(
                db,
                restaurant,
                claim_request,
                notification_event,
            )
        except Exception as exc:  # pragma: no cover - notification failure should not block
            logger.warning(
                "Owner notification failed for claim %s (%s): %s",
                claim_request.id,
                notification_event,
                exc,
            )
    return _build_admin_claim_queue_item(
        claim_request,
        restaurant_name,
        restaurant_phone,
        address1,
        city,
        state,
        state_slug,
        city_slug,
        restaurant_slug,
    )
