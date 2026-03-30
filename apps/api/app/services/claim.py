import asyncio
import hashlib
import hmac
import logging
import re
import secrets
import smtplib
import uuid
from dataclasses import dataclass
from datetime import datetime, timedelta, timezone
from email.message import EmailMessage
from typing import Any
from urllib.parse import urlencode

import requests
from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession

try:
    import stripe
except ImportError:  # pragma: no cover - optional until Stripe is configured
    stripe = None

from app.config import settings
from app.models import (
    ClaimRequest,
    ClaimRequestNotification,
    ClaimVerificationSession,
    Restaurant,
    RestaurantLocation,
    RestaurantSlug,
)
from app.schemas.claim import (
    ClaimDepositCheckoutIn,
    ClaimDepositCheckoutOut,
    ClaimManualReviewIn,
    ClaimManualReviewOut,
    ClaimMockDepositCompleteIn,
    ClaimPricingSnapshotOut,
    ClaimProgressStepOut,
    ClaimRequestRestaurantOut,
    ClaimRequestStatusOut,
    ClaimReviewDecisionIn,
    ClaimReviewIssueArea,
    ClaimSendCodeIn,
    ClaimSendCodeOut,
    ClaimSetupIntakeIn,
    ClaimSetupIntakeSummary,
    ClaimSubmitIn,
    ClaimSubmitOut,
    ClaimVerifyCodeIn,
    ClaimVerifyCodeOut,
    KickoffState,
    MonthlyBillingState,
    SetupDepositState,
)

logger = logging.getLogger(__name__)

TWILIO_VERIFY_BASE_URL = "https://verify.twilio.com/v2/Services/{service_sid}"
EMAIL_RE = re.compile(r"^[^\s@]+@[^\s@]+\.[^\s@]+$")
OWNER_NOTIFICATION_CHANNEL = "email"
OWNER_NOTIFICATION_EVENTS = {
    "launch_link_ready",
    "manual_review_saved",
    "ownership_approved",
    "deposit_received",
    "kickoff_scheduled",
    "review_ready",
    "review_changes_requested_received",
    "review_approved_received",
    "site_live",
}
SUPPORT_PHONE_E164 = "+18183420990"
SUPPORT_PHONE_DISPLAY = "(818) 342-0990"
SUPPORT_WHATSAPP_URL = "https://wa.me/18183420990"
REVIEW_ISSUE_AREA_LABELS: dict[ClaimReviewIssueArea, str] = {
    "branding_photos": "Branding, logo, and photos",
    "menu_pricing": "Menu items and pricing",
    "hours_contact": "Hours, phone, and address",
    "fulfillment_ordering": "Pickup, delivery, and ordering flow",
    "links_cta": "Links and guest-facing CTA",
}


class ClaimServiceError(Exception):
    def __init__(self, status_code: int, detail: str):
        super().__init__(detail)
        self.status_code = status_code
        self.detail = detail


@dataclass
class _RestaurantContext:
    id: Any
    name: str
    phone: str | None
    address1: str
    city: str
    state: str
    state_slug: str
    city_slug: str
    restaurant_slug: str


def _utc_now() -> datetime:
    return datetime.now(timezone.utc)


def _hash_secret(value: str) -> str:
    return hashlib.sha256(value.encode("utf-8")).hexdigest()


def _normalize_sms_provider() -> str:
    provider = settings.claim_sms_provider.strip().lower()
    if provider not in {"mock", "twilio"}:
        raise ClaimServiceError(500, "CLAIM_SMS_PROVIDER must be 'mock' or 'twilio'.")
    return provider


def _normalize_payment_provider() -> str:
    provider = settings.claim_payment_provider.strip().lower()
    if provider not in {"mock", "stripe"}:
        raise ClaimServiceError(
            500, "CLAIM_PAYMENT_PROVIDER must be 'mock' or 'stripe'."
        )
    if provider == "stripe" and not settings.stripe_secret_key:
        raise ClaimServiceError(
            503,
            "Stripe payment is not configured right now. Contact support to start kickoff.",
        )
    return provider


def _mock_code() -> str:
    code = settings.claim_sms_mock_code.strip()
    return code or "111111"


def _format_money(cents: int | None, currency: str | None) -> str:
    normalized_cents = int(cents or 0)
    normalized_currency = (currency or "usd").upper()
    return f"{normalized_currency} ${(normalized_cents / 100):,.0f}"


def _format_schedule(when: datetime | None) -> str | None:
    if when is None:
        return None
    local = when.astimezone()
    return local.strftime("%b %d at %I:%M %p").replace(" 0", " ").replace(" at 0", " at ")


def _claim_setup_deposit_cents() -> int:
    return max(0, int(settings.claim_setup_deposit_cents))


def _claim_monthly_plan_cents() -> int:
    return max(0, int(settings.claim_monthly_plan_cents))


def _claim_currency() -> str:
    value = settings.claim_currency.strip().lower()
    return value or "usd"


def _build_launch_url(
    claim_request_id: uuid.UUID | str,
    access_token: str,
    extra_params: dict[str, str] | None = None,
    path_suffix: str = "",
) -> str:
    params = {"access": access_token}
    if extra_params:
        params.update({key: value for key, value in extra_params.items() if value})
    query = urlencode(params)
    return (
        f"{settings.web_base_url.rstrip('/')}/launch/{claim_request_id}{path_suffix}?{query}"
    )


def _build_listing_url(restaurant: _RestaurantContext) -> str:
    return (
        f"{settings.web_base_url.rstrip('/')}/"
        f"{restaurant.state_slug}/{restaurant.city_slug}/{restaurant.restaurant_slug}"
    )


def _build_preview_url(
    restaurant: _RestaurantContext, template_key: str | None
) -> str:
    params = {"preview": "1"}
    if template_key:
        params["template"] = template_key
    return f"{_build_listing_url(restaurant)}?{urlencode(params)}"


def _issue_launch_access_token(claim_request: ClaimRequest) -> str:
    access_token = secrets.token_urlsafe(32)
    claim_request.access_token_hash = _hash_secret(access_token)
    return access_token


def _validate_launch_access(claim_request: ClaimRequest, access_token: str) -> None:
    token = access_token.strip()
    if not token or not claim_request.access_token_hash:
        raise ClaimServiceError(
            403,
            "This launch page needs the secure access token from your claim confirmation link.",
        )
    if not hmac.compare_digest(claim_request.access_token_hash, _hash_secret(token)):
        raise ClaimServiceError(
            403,
            "This launch page needs the secure access token from your claim confirmation link.",
        )


def _ensure_pricing_snapshot(claim_request: ClaimRequest) -> None:
    if claim_request.setup_deposit_cents is None:
        claim_request.setup_deposit_cents = _claim_setup_deposit_cents()
    if claim_request.monthly_plan_cents is None:
        claim_request.monthly_plan_cents = _claim_monthly_plan_cents()
    if not claim_request.currency:
        claim_request.currency = _claim_currency()


def _normalize_review_issue_areas(
    issue_areas: list[str] | None,
) -> list[ClaimReviewIssueArea]:
    normalized: list[ClaimReviewIssueArea] = []
    for item in issue_areas or []:
        value = str(item).strip()
        if value in REVIEW_ISSUE_AREA_LABELS and value not in normalized:
            normalized.append(value)  # type: ignore[arg-type]
    return normalized


def _review_state_value(claim_request: ClaimRequest) -> str:
    if claim_request.status == "approved_for_launch":
        return "approved"
    if claim_request.status == "changes_requested":
        return "changes_requested"
    return "pending"


def _review_issue_area_labels(issue_areas: list[str] | None) -> list[str]:
    return [
        REVIEW_ISSUE_AREA_LABELS[item]
        for item in _normalize_review_issue_areas(issue_areas)
    ]


def _setup_intake_status_value(claim_request: ClaimRequest) -> str:
    if claim_request.setup_intake_submitted_at and claim_request.setup_intake:
        return "submitted"
    return "missing"


def _setup_intake_summary(
    claim_request: ClaimRequest,
) -> ClaimSetupIntakeSummary | None:
    raw = claim_request.setup_intake
    if not raw:
        return None
    try:
        return ClaimSetupIntakeSummary.model_validate(raw)
    except Exception:
        logger.warning("Ignoring invalid setup intake payload for claim %s", claim_request.id)
        return None


def _owner_notification_sender() -> str:
    sender = (settings.claim_alert_email_from or settings.smtp_username or "").strip()
    if not sender:
        raise RuntimeError("Owner notification email sender is not configured.")
    return sender


async def _get_notification_record(
    db: AsyncSession,
    claim_request_id: uuid.UUID,
    event_key: str,
    channel: str = OWNER_NOTIFICATION_CHANNEL,
) -> ClaimRequestNotification | None:
    result = await db.execute(
        select(ClaimRequestNotification).where(
            ClaimRequestNotification.claim_request_id == claim_request_id,
            ClaimRequestNotification.event_key == event_key,
            ClaimRequestNotification.channel == channel,
        )
    )
    return result.scalar_one_or_none()


async def _get_notification_launch_token(
    db: AsyncSession,
    claim_request_id: uuid.UUID,
) -> str | None:
    result = await db.execute(
        select(ClaimRequestNotification.launch_access_token)
        .where(
            ClaimRequestNotification.claim_request_id == claim_request_id,
            ClaimRequestNotification.launch_access_token.is_not(None),
        )
        .order_by(
            ClaimRequestNotification.sent_at.desc(),
            ClaimRequestNotification.created_at.desc(),
        )
        .limit(1)
    )
    value = result.scalar_one_or_none()
    return value.strip() if isinstance(value, str) and value.strip() else None


def _is_valid_email(value: str) -> bool:
    return bool(EMAIL_RE.match(value.strip()))


def _is_valid_phone(value: str) -> bool:
    digits = "".join(ch for ch in value if ch.isdigit())
    return len(digits) >= 7


def _normalize_phone_to_e164(raw_phone: str | None) -> str | None:
    if not raw_phone:
        return None
    stripped = raw_phone.strip()
    if not stripped:
        return None

    if stripped.startswith("+"):
        digits = "".join(ch for ch in stripped if ch.isdigit())
        if len(digits) >= 8:
            return f"+{digits}"
        return None

    digits = "".join(ch for ch in stripped if ch.isdigit())
    if len(digits) == 10:
        return f"+1{digits}"
    if len(digits) == 11 and digits.startswith("1"):
        return f"+{digits}"
    return None


def _mask_phone(phone: str) -> str:
    digits = "".join(ch for ch in phone if ch.isdigit())
    if len(digits) >= 10:
        return f"(***) ***-{digits[-4:]}"
    if len(digits) >= 4:
        return f"***-{digits[-4:]}"
    return "your listed phone"


def _validate_claim_contact_fields(
    owner_name: str,
    owner_phone: str,
    owner_email: str,
) -> None:
    if not owner_name.strip():
        raise ClaimServiceError(400, "Owner name is required.")
    if not _is_valid_phone(owner_phone):
        raise ClaimServiceError(400, "A valid owner phone is required.")
    if not _is_valid_email(owner_email):
        raise ClaimServiceError(400, "A valid owner email is required.")


def _is_payment_unlocked(claim_request: ClaimRequest) -> bool:
    return (claim_request.verification_status or "").strip().lower() == "verified"


def _status_key(claim_request: ClaimRequest) -> str:
    raw_status = (claim_request.status or "").strip().lower()
    verification_status = (claim_request.verification_status or "").strip().lower()

    if verification_status == "manual_review_requested" or raw_status == "manual_review_requested":
        return "manual_review_requested"
    if raw_status == "live":
        return "live"
    if raw_status == "approved_for_launch":
        return "approved_for_launch"
    if raw_status == "changes_requested":
        return "changes_requested"
    if raw_status == "ready_for_review":
        return "ready_for_review"
    if raw_status in {"build_in_progress", "onboarding_in_progress", "in_progress"}:
        return "build_in_progress"
    if raw_status in {"kickoff_scheduled", "kickoff_confirmed"} or (
        claim_request.kickoff_state in {"scheduled", "confirmed"}
    ):
        return "kickoff_scheduled"
    if raw_status == "deposit_paid" or claim_request.setup_deposit_state == "paid":
        return "deposit_paid"
    return "verified_request_received"


def _setup_deposit_detail(
    claim_request: ClaimRequest, payment_unlocked: bool
) -> tuple[SetupDepositState, str]:
    state: SetupDepositState = claim_request.setup_deposit_state or "pending"
    if state == "paid":
        if claim_request.setup_deposit_paid_at:
            return (
                state,
                f"Setup deposit received on {_format_schedule(claim_request.setup_deposit_paid_at) or 'a recent payment'}.",
            )
        return state, "Setup deposit received."
    if state == "failed":
        return state, "The last payment attempt did not complete. You can retry the setup deposit."
    if state == "refunded":
        return state, "The setup deposit was refunded. Contact support before build resumes."
    if not payment_unlocked:
        return state, "Payment unlocks after ownership review is approved."
    return (
        state,
        f"Pay {_format_money(claim_request.setup_deposit_cents, claim_request.currency)} to start kickoff.",
    )


def _kickoff_detail(claim_request: ClaimRequest) -> tuple[KickoffState, str]:
    state: KickoffState = claim_request.kickoff_state or "pending"
    if state == "confirmed":
        when = _format_schedule(claim_request.kickoff_scheduled_for)
        if when:
            return state, f"Kickoff confirmed for {when}. Build can move forward."
        return state, "Kickoff confirmed. Build can move forward."
    if state == "scheduled":
        when = _format_schedule(claim_request.kickoff_scheduled_for)
        if when:
            return state, f"Kickoff scheduled for {when}."
        return state, "Kickoff is scheduled with the launch team."
    if claim_request.setup_deposit_state == "paid":
        return state, "Deposit received. Support will lock in kickoff timing next."
    return state, "Kickoff scheduling begins after the setup deposit is paid."


def _review_detail(claim_request: ClaimRequest) -> tuple[str, str]:
    state = _review_state_value(claim_request)
    issue_labels = _review_issue_area_labels(claim_request.review_issue_areas)

    if state == "approved":
        return state, "Approval received. Final launch checks are in progress before go-live."
    if state == "changes_requested":
        if issue_labels:
            return state, f"Revisions requested for: {', '.join(issue_labels)}."
        return state, "Revisions requested. The team is updating the build now."
    return state, "Review the website and either approve it for launch or request changes."


def _monthly_billing_detail(
    claim_request: ClaimRequest,
) -> tuple[MonthlyBillingState, str]:
    if _status_key(claim_request) == "live":
        if claim_request.monthly_billing_starts_at:
            return (
                "active",
                f"Monthly billing became active on {_format_schedule(claim_request.monthly_billing_starts_at) or 'launch day'}.",
            )
        return "active", "Monthly billing is active because the site is live."
    return "pending", "The $99/month plan starts only after launch."


def _status_summary(
    claim_request: ClaimRequest,
) -> tuple[str, str, str, str, list[ClaimProgressStepOut]]:
    status_key = _status_key(claim_request)
    payment_unlocked = _is_payment_unlocked(claim_request)

    ownership_state = "completed" if payment_unlocked else "current"
    deposit_state = "upcoming"
    kickoff_state = "upcoming"
    build_state = "upcoming"
    live_state = "upcoming"

    if status_key == "manual_review_requested":
        status_label = "Ownership review pending"
        status_detail = (
            "We saved the request and the team is reviewing another ownership path before payment and kickoff unlock."
        )
        next_step_title = "Wait for ownership approval"
        next_step_detail = (
            "Support will review the listing issue and reach out using your preferred contact method."
        )
        ownership_detail = (
            "A team member is reviewing the listing issue because phone verification could not finish cleanly."
        )
    elif status_key == "verified_request_received":
        status_label = "Ownership verified"
        status_detail = (
            "Your listing is unlocked. Pay the setup deposit to move this website into kickoff."
        )
        next_step_title = "Pay the setup deposit"
        next_step_detail = (
            "Use this private launch link to pay the one-time $299 setup deposit. Monthly billing starts only after launch."
        )
        ownership_detail = (
            "The listed business phone was verified and the launch is ready for payment."
        )
        deposit_state = "current"
    elif status_key == "deposit_paid":
        status_label = "Setup deposit paid"
        status_detail = "We received the deposit. Kickoff is the next step, and support will lock in timing with you next."
        next_step_title = "Kickoff is next"
        next_step_detail = (
            "Start setup on WhatsApp now, or wait for support to reach out by your preferred contact method within 24 hours."
        )
        ownership_detail = (
            "The listed business phone was verified and the launch is ready to build."
        )
        deposit_state = "completed"
        kickoff_state = "current"
    elif status_key == "kickoff_scheduled":
        status_label = (
            "Kickoff confirmed"
            if claim_request.kickoff_state == "confirmed"
            else "Kickoff scheduled"
        )
        status_detail = (
            "Your kickoff is on the calendar and the launch team has what they need to keep moving."
        )
        next_step_title = "Stay ready for launch updates"
        next_step_detail = (
            "Support will use your preferred contact method for build updates, review notes, and any final questions."
        )
        ownership_detail = (
            "The listed business phone was verified and the launch is ready to build."
        )
        deposit_state = "completed"
        kickoff_state = "completed"
        build_state = "current"
    elif status_key == "build_in_progress":
        status_label = "Build in progress"
        status_detail = "Kickoff is complete and the team is building your website, menu, and launch details now."
        next_step_title = "Watch for the review handoff"
        next_step_detail = (
            "We will reach out when the launch build is ready for owner review."
        )
        ownership_detail = (
            "The listed business phone was verified and the launch is ready to build."
        )
        deposit_state = "completed"
        kickoff_state = "completed"
        build_state = "current"
    elif status_key == "ready_for_review":
        status_label = "Ready for review"
        status_detail = "Your launch build is ready for the last owner review before go-live."
        next_step_title = "Approve the final review"
        next_step_detail = (
            "Review the website, final menu details, and launch timing so the team can schedule go-live."
        )
        ownership_detail = (
            "The listed business phone was verified and the launch is ready to build."
        )
        deposit_state = "completed"
        kickoff_state = "completed"
        build_state = "current"
    elif status_key == "changes_requested":
        status_label = "Changes requested"
        status_detail = "We received your revision request and the team is updating the build now."
        next_step_title = "Watch for the updated review link"
        next_step_detail = (
            "Support is working through your notes now. We will send a fresh review handoff once the updates are ready."
        )
        ownership_detail = (
            "The listed business phone was verified and the launch is ready to build."
        )
        deposit_state = "completed"
        kickoff_state = "completed"
        build_state = "current"
    elif status_key == "approved_for_launch":
        status_label = "Approved for launch"
        status_detail = "Approval received. Final launch checks are in progress before go-live."
        next_step_title = "We are preparing launch"
        next_step_detail = (
            "No more action is needed from you right now. We will let you know as soon as the site is live."
        )
        ownership_detail = (
            "The listed business phone was verified and the launch is ready to build."
        )
        deposit_state = "completed"
        kickoff_state = "completed"
        build_state = "completed"
        live_state = "current"
    else:
        status_label = "Live"
        status_detail = "Your direct-order website is live and ready to share with guests."
        next_step_title = "Start sending guests to your site"
        next_step_detail = (
            "Use your website, Google profile, and social links to push direct orders into your own channel."
        )
        ownership_detail = (
            "The listed business phone was verified and the launch is complete."
        )
        deposit_state = "completed"
        kickoff_state = "completed"
        build_state = "completed"
        live_state = "current"

    timeline = [
        ClaimProgressStepOut(
            key="ownership_verified",
            label="Ownership verified",
            state=ownership_state,
            detail=ownership_detail,
        ),
        ClaimProgressStepOut(
            key="setup_deposit_paid",
            label="Setup deposit paid",
            state=deposit_state,
            detail=(
                "Pay the one-time setup deposit to start kickoff."
                if deposit_state != "completed"
                else "The setup deposit is in and kickoff can move forward."
            ),
        ),
        ClaimProgressStepOut(
            key="kickoff_scheduled",
            label=(
                "Kickoff pending"
                if kickoff_state == "current"
                else "Kickoff scheduled"
            ),
            state=kickoff_state,
            detail=(
                "Support will lock in kickoff timing after payment."
                if kickoff_state == "current"
                else (
                    "Kickoff timing is confirmed with the launch team."
                    if kickoff_state == "completed"
                    else "Kickoff is scheduled once payment is in."
                )
            ),
        ),
        ClaimProgressStepOut(
            key="build_review",
            label="Build + review",
            state=build_state,
            detail=(
                "We build the site, menu, and launch details for owner review."
                if build_state != "completed"
                else (
                    "Owner review is complete and the launch is in final checks."
                    if status_key == "approved_for_launch"
                    else "The build and review stage is in motion."
                )
            ),
        ),
        ClaimProgressStepOut(
            key="live_launch",
            label="Live launch",
            state=live_state,
            detail=(
                "Share the live direct-order website with guests."
                if live_state == "current"
                else (
                    "The site is almost ready. Final launch checks are underway."
                    if status_key == "approved_for_launch"
                    else "The site goes live after review is complete."
                )
            ),
        ),
    ]

    return status_label, status_detail, next_step_title, next_step_detail, timeline


def _serialize_claim_request_status(
    claim_request: ClaimRequest,
    restaurant: _RestaurantContext,
) -> ClaimRequestStatusOut:
    _ensure_pricing_snapshot(claim_request)
    payment_unlocked = _is_payment_unlocked(claim_request)
    (
        status_label,
        status_detail,
        next_step_title,
        next_step_detail,
        timeline,
    ) = _status_summary(claim_request)
    setup_deposit_state, setup_deposit_detail = _setup_deposit_detail(
        claim_request, payment_unlocked
    )
    kickoff_state, kickoff_detail = _kickoff_detail(claim_request)
    review_state, _ = _review_detail(claim_request)
    monthly_billing_state, monthly_billing_detail = _monthly_billing_detail(
        claim_request
    )
    setup_intake_status = _setup_intake_status_value(claim_request)
    setup_intake_summary = _setup_intake_summary(claim_request)

    return ClaimRequestStatusOut(
        claim_request_id=claim_request.id,
        status=_status_key(claim_request),
        status_label=status_label,
        status_detail=status_detail,
        payment_unlocked=payment_unlocked,
        setup_deposit_state=setup_deposit_state,
        setup_deposit_detail=setup_deposit_detail,
        setup_deposit_paid_at=claim_request.setup_deposit_paid_at,
        kickoff_state=kickoff_state,
        kickoff_detail=kickoff_detail,
        kickoff_scheduled_for=claim_request.kickoff_scheduled_for,
        review_state=review_state,
        review_responded_at=claim_request.review_responded_at,
        review_issue_areas=_normalize_review_issue_areas(claim_request.review_issue_areas),
        review_notes=claim_request.review_notes,
        monthly_billing_state=monthly_billing_state,
        monthly_billing_detail=monthly_billing_detail,
        monthly_billing_starts_at=claim_request.monthly_billing_starts_at,
        setup_intake_status=setup_intake_status,
        setup_intake_submitted_at=claim_request.setup_intake_submitted_at,
        setup_intake_summary=setup_intake_summary,
        pricing=ClaimPricingSnapshotOut(
            setup_deposit_cents=claim_request.setup_deposit_cents or _claim_setup_deposit_cents(),
            monthly_plan_cents=claim_request.monthly_plan_cents or _claim_monthly_plan_cents(),
            currency=claim_request.currency or _claim_currency(),
        ),
        template_key=claim_request.template_key,
        owner_name=claim_request.owner_name,
        owner_phone=claim_request.owner_phone,
        owner_email=claim_request.owner_email,
        preferred_contact_method=claim_request.preferred_contact_method,
        verification_method=claim_request.verification_method,
        verification_status=claim_request.verification_status,
        menu_confirmed=claim_request.menu_confirmed,
        hours_contact_confirmed=claim_request.hours_contact_confirmed,
        launch_terms_accepted_at=claim_request.launch_terms_accepted_at,
        submitted_at=claim_request.submitted_at,
        next_step_title=next_step_title,
        next_step_detail=next_step_detail,
        restaurant=ClaimRequestRestaurantOut(
            name=restaurant.name,
            phone=restaurant.phone,
            address1=restaurant.address1,
            city=restaurant.city,
            state=restaurant.state,
            state_slug=restaurant.state_slug,
            city_slug=restaurant.city_slug,
            restaurant_slug=restaurant.restaurant_slug,
        ),
        timeline=timeline,
    )


def _parse_twilio_error(response: requests.Response) -> str:
    fallback = f"Twilio Verify returned {response.status_code}."
    try:
        payload = response.json()
    except ValueError:
        return fallback
    if isinstance(payload, dict):
        message = payload.get("message")
        if isinstance(message, str) and message.strip():
            return message.strip()
    return fallback


def _send_twilio_verification_sync(destination_phone: str) -> str:
    if not (
        settings.twilio_account_sid
        and settings.twilio_auth_token
        and settings.twilio_verify_service_sid
    ):
        raise ClaimServiceError(
            503,
            "SMS verification is not configured right now. Use manual review instead.",
        )

    response = requests.post(
        TWILIO_VERIFY_BASE_URL.format(
            service_sid=settings.twilio_verify_service_sid
        )
        + "/Verifications",
        data={"To": destination_phone, "Channel": "sms"},
        auth=(settings.twilio_account_sid, settings.twilio_auth_token),
        timeout=15,
    )
    if response.status_code >= 500:
        raise ClaimServiceError(
            503,
            "SMS verification is temporarily unavailable. Use manual review instead.",
        )
    if response.status_code >= 400:
        raise ClaimServiceError(
            400,
            f"Could not send a verification code to this phone. {_parse_twilio_error(response)}",
        )

    try:
        payload = response.json()
    except ValueError as exc:
        raise ClaimServiceError(
            503,
            "SMS verification is temporarily unavailable. Use manual review instead.",
        ) from exc

    provider_sid = payload.get("sid") if isinstance(payload, dict) else None
    if not isinstance(provider_sid, str) or not provider_sid.strip():
        raise ClaimServiceError(
            503,
            "SMS verification is temporarily unavailable. Use manual review instead.",
        )
    return provider_sid.strip()


async def _send_twilio_verification(destination_phone: str) -> str:
    return await asyncio.to_thread(_send_twilio_verification_sync, destination_phone)


def _check_twilio_verification_sync(destination_phone: str, code: str) -> bool:
    if not (
        settings.twilio_account_sid
        and settings.twilio_auth_token
        and settings.twilio_verify_service_sid
    ):
        raise ClaimServiceError(
            503,
            "SMS verification is not configured right now. Use manual review instead.",
        )

    response = requests.post(
        TWILIO_VERIFY_BASE_URL.format(
            service_sid=settings.twilio_verify_service_sid
        )
        + "/VerificationCheck",
        data={"To": destination_phone, "Code": code},
        auth=(settings.twilio_account_sid, settings.twilio_auth_token),
        timeout=15,
    )
    if response.status_code >= 500:
        raise ClaimServiceError(
            503,
            "SMS verification is temporarily unavailable. Use manual review instead.",
        )
    if response.status_code >= 400:
        detail = _parse_twilio_error(response)
        if response.status_code == 404:
            raise ClaimServiceError(400, "Verification session expired. Send a new code.")
        if response.status_code in {400, 429}:
            return False
        raise ClaimServiceError(400, detail)

    try:
        payload = response.json()
    except ValueError as exc:
        raise ClaimServiceError(
            503,
            "SMS verification is temporarily unavailable. Use manual review instead.",
        ) from exc

    return bool(isinstance(payload, dict) and payload.get("status") == "approved")


async def _check_twilio_verification(destination_phone: str, code: str) -> bool:
    return await asyncio.to_thread(
        _check_twilio_verification_sync, destination_phone, code
    )


async def _get_restaurant_context(
    db: AsyncSession,
    state_slug: str,
    city_slug: str,
    restaurant_slug: str,
) -> _RestaurantContext | None:
    result = await db.execute(
        select(
            Restaurant.id,
            Restaurant.name,
            Restaurant.phone,
            RestaurantLocation.address1,
            RestaurantLocation.city,
            RestaurantLocation.state,
            RestaurantSlug.state_slug,
            RestaurantSlug.city_slug,
            RestaurantSlug.restaurant_slug,
        )
        .join(RestaurantLocation, Restaurant.id == RestaurantLocation.restaurant_id)
        .join(
            RestaurantSlug,
            RestaurantLocation.id == RestaurantSlug.restaurant_location_id,
        )
        .where(
            RestaurantSlug.state_slug == state_slug,
            RestaurantSlug.city_slug == city_slug,
            RestaurantSlug.restaurant_slug == restaurant_slug,
            RestaurantSlug.is_canonical.is_(True),
        )
    )
    row = result.one_or_none()
    if row is None:
        return None
    return _RestaurantContext(
        id=row.id,
        name=row.name,
        phone=row.phone,
        address1=row.address1,
        city=row.city,
        state=row.state,
        state_slug=row.state_slug,
        city_slug=row.city_slug,
        restaurant_slug=row.restaurant_slug,
    )


async def _get_restaurant_context_by_id(
    db: AsyncSession, restaurant_id: Any
) -> _RestaurantContext | None:
    result = await db.execute(
        select(
            Restaurant.id,
            Restaurant.name,
            Restaurant.phone,
            RestaurantLocation.address1,
            RestaurantLocation.city,
            RestaurantLocation.state,
            RestaurantSlug.state_slug,
            RestaurantSlug.city_slug,
            RestaurantSlug.restaurant_slug,
        )
        .join(RestaurantLocation, Restaurant.id == RestaurantLocation.restaurant_id)
        .join(
            RestaurantSlug,
            RestaurantLocation.id == RestaurantSlug.restaurant_location_id,
        )
        .where(
            Restaurant.id == restaurant_id,
            RestaurantSlug.is_canonical.is_(True),
        )
    )
    row = result.one_or_none()
    if row is None:
        return None
    return _RestaurantContext(
        id=row.id,
        name=row.name,
        phone=row.phone,
        address1=row.address1,
        city=row.city,
        state=row.state,
        state_slug=row.state_slug,
        city_slug=row.city_slug,
        restaurant_slug=row.restaurant_slug,
    )


async def _count_recent_send_attempts(
    db: AsyncSession, restaurant_id: Any, request_ip: str | None
) -> int:
    if not request_ip:
        return 0
    window_start = _utc_now() - timedelta(
        minutes=max(1, settings.claim_verification_send_window_minutes)
    )
    result = await db.execute(
        select(func.count())
        .select_from(ClaimVerificationSession)
        .where(
            ClaimVerificationSession.restaurant_id == restaurant_id,
            ClaimVerificationSession.requested_ip == request_ip,
            ClaimVerificationSession.created_at >= window_start,
        )
    )
    return int(result.scalar_one() or 0)


def _build_claim_email(
    restaurant: _RestaurantContext,
    claim_request: ClaimRequest,
) -> EmailMessage | None:
    if not settings.claim_alert_email_to or not settings.claim_alert_email_from:
        logger.warning("Claim alert email skipped: recipient/sender config missing.")
        return None
    if not settings.smtp_host or not settings.smtp_port:
        logger.warning("Claim alert email skipped: SMTP config missing.")
        return None

    message = EmailMessage()
    message["Subject"] = (
        f"[Takeout] New claim request - {restaurant.name} ({restaurant.city}, {restaurant.state})"
    )
    message["From"] = settings.claim_alert_email_from
    message["To"] = settings.claim_alert_email_to
    message.set_content(
        "\n".join(
            [
                "A new restaurant claim request was submitted.",
                "",
                f"Restaurant: {restaurant.name}",
                f"Location: {restaurant.address1}, {restaurant.city}, {restaurant.state}",
                f"Listing path: /{restaurant.state_slug}/{restaurant.city_slug}/{restaurant.restaurant_slug}",
                f"Verification method: {claim_request.verification_method}",
                f"Verification status: {claim_request.verification_status}",
                f"Owner name: {claim_request.owner_name}",
                f"Owner phone: {claim_request.owner_phone}",
                f"Owner email: {claim_request.owner_email}",
                f"Preferred contact: {claim_request.preferred_contact_method}",
                f"Template: {claim_request.template_key}",
                f"Menu confirmed: {'yes' if claim_request.menu_confirmed else 'no'}",
                f"Hours/contact confirmed: {'yes' if claim_request.hours_contact_confirmed else 'no'}",
                (
                    f"Manual review reason: {claim_request.manual_review_reason}"
                    if claim_request.manual_review_reason
                    else "Manual review reason: n/a"
                ),
                f"Claim request ID: {claim_request.id}",
                "",
                "This claim has been stored in the database.",
            ]
        )
    )
    return message


def _send_email_sync(message: EmailMessage) -> None:
    with smtplib.SMTP(settings.smtp_host, settings.smtp_port, timeout=15) as smtp:
        smtp.ehlo()
        if settings.smtp_use_tls:
            smtp.starttls()
            smtp.ehlo()
        if settings.smtp_username:
            smtp.login(settings.smtp_username, settings.smtp_password or "")
        smtp.send_message(message)


async def _send_claim_alert_email(
    restaurant: _RestaurantContext,
    claim_request: ClaimRequest,
) -> None:
    message = _build_claim_email(restaurant, claim_request)
    if message is None:
        return
    await asyncio.to_thread(_send_email_sync, message)


def _build_owner_review_ops_email(
    restaurant: _RestaurantContext,
    claim_request: ClaimRequest,
    launch_url: str,
    decision: str,
) -> EmailMessage | None:
    if not settings.claim_alert_email_to or not settings.claim_alert_email_from:
        logger.warning("Owner review ops alert skipped: recipient/sender config missing.")
        return None
    if not settings.smtp_host or not settings.smtp_port:
        logger.warning("Owner review ops alert skipped: SMTP config missing.")
        return None

    decision_label = (
        "approved for launch" if decision == "approved" else "requested changes"
    )
    issue_labels = _review_issue_area_labels(claim_request.review_issue_areas)

    message = EmailMessage()
    message["Subject"] = (
        f"[Takeout] Owner {decision_label} - {restaurant.name} ({restaurant.city}, {restaurant.state})"
    )
    message["From"] = settings.claim_alert_email_from
    message["To"] = settings.claim_alert_email_to
    message.set_content(
        "\n".join(
            [
                f"The owner {decision_label}.",
                "",
                f"Restaurant: {restaurant.name}",
                f"Location: {restaurant.address1}, {restaurant.city}, {restaurant.state}",
                f"Owner name: {claim_request.owner_name}",
                f"Owner phone: {claim_request.owner_phone}",
                f"Owner email: {claim_request.owner_email}",
                f"Decision: {decision_label}",
                (
                    f"Issue areas: {', '.join(issue_labels)}"
                    if issue_labels
                    else "Issue areas: n/a"
                ),
                (
                    f"Owner notes: {claim_request.review_notes}"
                    if claim_request.review_notes
                    else "Owner notes: n/a"
                ),
                f"Launch page: {launch_url}",
                f"Claim request ID: {claim_request.id}",
            ]
        )
    )
    return message


async def _send_owner_review_ops_alert(
    restaurant: _RestaurantContext,
    claim_request: ClaimRequest,
    *,
    access_token: str | None = None,
) -> None:
    token = (access_token or "").strip()
    if not token:
        raise RuntimeError("Owner review ops alert needs a launch access token.")
    decision = _review_state_value(claim_request)
    launch_url = _build_launch_url(claim_request.id, token)
    message = _build_owner_review_ops_email(
        restaurant,
        claim_request,
        launch_url,
        decision,
    )
    if message is None:
        return
    await asyncio.to_thread(_send_email_sync, message)


def _build_owner_notification_email(
    restaurant: _RestaurantContext,
    claim_request: ClaimRequest,
    event_key: str,
    launch_url: str,
) -> EmailMessage:
    if event_key not in OWNER_NOTIFICATION_EVENTS:
        raise RuntimeError(f"Unsupported owner notification event: {event_key}")
    if not settings.smtp_host or not settings.smtp_port:
        raise RuntimeError("Owner notification email skipped: SMTP config missing.")

    preview_url = _build_preview_url(restaurant, claim_request.template_key)
    listing_url = _build_listing_url(restaurant)
    restaurant_label = f"{restaurant.name} in {restaurant.city}, {restaurant.state}"
    owner_name = claim_request.owner_name.strip() or "there"
    scheduled_for = _format_schedule(claim_request.kickoff_scheduled_for)

    if event_key == "launch_link_ready":
        subject = "Your launch link is ready"
        changed = f"Your private launch link for {restaurant_label} is ready."
        next_step = (
            f"Next: pay the {_format_money(claim_request.setup_deposit_cents, claim_request.currency)} "
            "setup deposit to move this website into kickoff."
        )
        extra_lines: list[str] = []
    elif event_key == "manual_review_saved":
        subject = "Your claim is in review"
        changed = f"We saved your ownership review request for {restaurant_label}."
        next_step = (
            "Next: our team will review the listing issue and reach out before payment and kickoff unlock."
        )
        extra_lines = []
    elif event_key == "ownership_approved":
        subject = "Ownership approved - setup deposit unlocked"
        changed = f"Ownership review is complete for {restaurant_label}."
        next_step = (
            f"Next: pay the {_format_money(claim_request.setup_deposit_cents, claim_request.currency)} "
            "setup deposit from your private launch page."
        )
        extra_lines = []
    elif event_key == "deposit_received":
        subject = "Setup deposit received"
        changed = f"We received the setup deposit for {restaurant_label}."
        next_step = (
            "Next: open your private launch page to share your setup details for Google, Yelp, domain access, assets, and hours. Support will still reach out within 24 hours to lock in kickoff."
        )
        extra_lines = []
    elif event_key == "kickoff_scheduled":
        subject = (
            f"Kickoff scheduled for {scheduled_for}"
            if scheduled_for
            else "Kickoff scheduled"
        )
        changed = f"Kickoff is on the calendar for {restaurant_label}."
        next_step = (
            "Next: have your menu, hours, logo, and any Google, Yelp, or domain logins nearby for the kickoff handoff."
        )
        extra_lines = [f"Scheduled time: {scheduled_for}"] if scheduled_for else []
    elif event_key == "review_ready":
        subject = "Your website is ready for review"
        changed = f"The first polished website build for {restaurant_label} is ready for owner review."
        next_step = (
            "Next: open your private launch page to review status, then use the preview link below to inspect the site and send back any final edits."
        )
        extra_lines = [f"Preview website: {preview_url}"]
    elif event_key == "review_changes_requested_received":
        subject = "Change request received - we're updating your build"
        changed = f"We received your revision request for {restaurant_label}."
        next_step = (
            "Next: the team will work through your notes and send a fresh review handoff when the updated build is ready."
        )
        issue_labels = _review_issue_area_labels(claim_request.review_issue_areas)
        extra_lines = (
            [f"Requested updates: {', '.join(issue_labels)}"] if issue_labels else []
        )
        if claim_request.review_notes:
            extra_lines.append(f"Your notes: {claim_request.review_notes}")
    elif event_key == "review_approved_received":
        subject = "Approval received - final launch checks started"
        changed = f"Thanks for approving the website build for {restaurant_label}."
        next_step = (
            "Next: the team is running final launch checks now. We will let you know as soon as the site is live."
        )
        extra_lines = [f"Live website after launch: {listing_url}"]
    elif event_key == "site_live":
        subject = "Your direct-order website is live"
        changed = f"Your direct-order website for {restaurant_label} is live."
        next_step = (
            "Next: open your private launch page for the live link, QR code, and launch checklist. Then update Google, Yelp, and social links so guests start ordering directly."
        )
        extra_lines = [f"Live website: {listing_url}"]
    else:  # pragma: no cover - guarded above
        raise RuntimeError(f"Unsupported owner notification event: {event_key}")

    message = EmailMessage()
    message["Subject"] = subject
    message["From"] = _owner_notification_sender()
    message["To"] = claim_request.owner_email
    message.set_content(
        "\n".join(
            [
                f"Hi {owner_name},",
                "",
                changed,
                next_step,
                "",
                f"Open your private launch page: {launch_url}",
                *extra_lines,
                "",
                f"Support phone: {SUPPORT_PHONE_DISPLAY}",
                f"WhatsApp: {SUPPORT_WHATSAPP_URL}",
            ]
        )
    )
    return message


async def send_owner_launch_notification(
    db: AsyncSession,
    restaurant: _RestaurantContext,
    claim_request: ClaimRequest,
    event_key: str,
    *,
    access_token: str | None = None,
) -> None:
    existing = await _get_notification_record(db, claim_request.id, event_key)
    if existing is not None and existing.status == "sent":
        return

    notification = existing or ClaimRequestNotification(
        claim_request_id=claim_request.id,
        event_key=event_key,
        channel=OWNER_NOTIFICATION_CHANNEL,
        recipient=claim_request.owner_email,
        status="failed",
    )
    if existing is None:
        db.add(notification)

    token = (
        (access_token or "").strip()
        or (notification.launch_access_token or "").strip()
        or await _get_notification_launch_token(db, claim_request.id)
    )

    generated_token = False
    previous_hash = claim_request.access_token_hash
    if not token:
        token = _issue_launch_access_token(claim_request)
        generated_token = True

    launch_url = _build_launch_url(claim_request.id, token)

    try:
        message = _build_owner_notification_email(
            restaurant,
            claim_request,
            event_key,
            launch_url,
        )
        await asyncio.to_thread(_send_email_sync, message)
    except Exception as exc:
        if generated_token:
            claim_request.access_token_hash = previous_hash
        notification.recipient = claim_request.owner_email
        notification.launch_access_token = None if generated_token else (token or None)
        notification.status = "failed"
        notification.sent_at = None
        notification.last_error = str(exc)
        await db.commit()
        logger.warning(
            "Owner notification failed for claim %s (%s): %s",
            claim_request.id,
            event_key,
            exc,
        )
        return

    notification.recipient = claim_request.owner_email
    notification.launch_access_token = token
    notification.status = "sent"
    notification.sent_at = _utc_now()
    notification.last_error = None
    await db.commit()


async def send_claim_code(
    db: AsyncSession,
    payload: ClaimSendCodeIn,
    request_ip: str | None,
) -> ClaimSendCodeOut:
    restaurant = await _get_restaurant_context(
        db, payload.state_slug, payload.city_slug, payload.restaurant_slug
    )
    if restaurant is None:
        raise ClaimServiceError(404, "Restaurant not found.")

    destination_phone = _normalize_phone_to_e164(restaurant.phone)
    if not destination_phone:
        raise ClaimServiceError(
            400,
            "This listing does not have a text-capable business phone. Use manual review instead.",
        )

    recent_send_count = await _count_recent_send_attempts(
        db, restaurant.id, request_ip
    )
    if recent_send_count >= settings.claim_verification_send_limit:
        raise ClaimServiceError(
            429,
            "Too many verification texts were requested recently. Try again later or use manual review.",
        )

    provider = _normalize_sms_provider()
    expires_at = _utc_now() + timedelta(
        minutes=max(1, settings.claim_verification_code_ttl_minutes)
    )
    session = ClaimVerificationSession(
        restaurant_id=restaurant.id,
        destination_phone=destination_phone,
        requested_ip=request_ip,
        provider=provider,
        status="failed",
        expires_at=expires_at,
    )
    if provider == "mock":
        session.code_hash = _hash_secret(_mock_code())

    db.add(session)
    await db.flush()

    try:
        if provider == "twilio":
            session.provider_sid = await _send_twilio_verification(destination_phone)
        session.status = "sent"
        await db.commit()
    except ClaimServiceError:
        await db.commit()
        raise
    except Exception as exc:  # pragma: no cover - defensive
        logger.exception("Unexpected claim code send failure: %s", exc)
        await db.commit()
        raise ClaimServiceError(
            503,
            "SMS verification is temporarily unavailable. Use manual review instead.",
        ) from exc

    return ClaimSendCodeOut(
        session_id=session.id,
        masked_phone=_mask_phone(destination_phone),
        expires_in_seconds=max(60, settings.claim_verification_code_ttl_minutes * 60),
        provider_mode=provider,
    )


async def verify_claim_code(
    db: AsyncSession, payload: ClaimVerifyCodeIn
) -> ClaimVerifyCodeOut:
    result = await db.execute(
        select(ClaimVerificationSession).where(
            ClaimVerificationSession.id == payload.session_id
        )
    )
    session = result.scalar_one_or_none()
    if session is None:
        raise ClaimServiceError(404, "Verification session not found.")

    now = _utc_now()
    if session.expires_at and session.expires_at <= now:
        session.status = "expired"
        await db.commit()
        raise ClaimServiceError(400, "Verification code expired. Send a new code.")

    if session.status in {"failed", "expired"}:
        raise ClaimServiceError(400, "Verification session is no longer valid.")

    if session.attempt_count >= settings.claim_verification_attempt_limit:
        session.status = "failed"
        await db.commit()
        raise ClaimServiceError(400, "Too many verification attempts. Send a new code.")

    session.attempt_count += 1

    try:
        if session.provider == "mock":
            approved = payload.code == _mock_code()
        elif session.provider == "twilio":
            approved = await _check_twilio_verification(
                session.destination_phone, payload.code
            )
        else:
            raise ClaimServiceError(500, "Unsupported verification provider.")
    except ClaimServiceError:
        await db.commit()
        raise
    except Exception as exc:  # pragma: no cover - defensive
        logger.exception("Unexpected claim code verify failure: %s", exc)
        await db.commit()
        raise ClaimServiceError(
            503,
            "SMS verification is temporarily unavailable. Use manual review instead.",
        ) from exc

    if not approved:
        if session.attempt_count >= settings.claim_verification_attempt_limit:
            session.status = "failed"
        await db.commit()
        raise ClaimServiceError(
            400,
            "Verification code did not match. Try again or use manual review.",
        )

    verified_token = secrets.token_urlsafe(24)
    session.status = "verified"
    session.verified_at = now
    session.verification_token_hash = _hash_secret(verified_token)
    session.verification_token_expires_at = now + timedelta(
        minutes=max(1, settings.claim_verified_token_ttl_minutes)
    )
    await db.commit()

    return ClaimVerifyCodeOut(
        verified=True,
        verified_token=verified_token,
        expires_in_seconds=max(60, settings.claim_verified_token_ttl_minutes * 60),
    )


async def submit_claim_request(
    db: AsyncSession, payload: ClaimSubmitIn
) -> ClaimSubmitOut:
    _validate_claim_contact_fields(
        payload.owner_name, payload.owner_phone, payload.owner_email
    )
    if not payload.menu_confirmed or not payload.hours_contact_confirmed:
        raise ClaimServiceError(
            400,
            "Menu and hours/contact confirmation are required before submitting.",
        )
    if not payload.launch_terms_accepted:
        raise ClaimServiceError(
            400,
            "You need to accept the launch terms before starting checkout.",
        )

    token_hash = _hash_secret(payload.verified_token)
    result = await db.execute(
        select(ClaimVerificationSession).where(
            ClaimVerificationSession.verification_token_hash == token_hash
        )
    )
    session = result.scalar_one_or_none()
    if session is None:
        raise ClaimServiceError(400, "Verification token is invalid or expired.")

    now = _utc_now()
    if (
        session.status != "verified"
        or not session.verification_token_expires_at
        or session.verification_token_expires_at <= now
    ):
        raise ClaimServiceError(400, "Verification token is invalid or expired.")

    existing_result = await db.execute(
        select(ClaimRequest).where(
            ClaimRequest.verification_session_id == session.id
        )
    )
    existing_claim = existing_result.scalar_one_or_none()
    if existing_claim is not None:
        existing_claim.owner_name = payload.owner_name
        existing_claim.owner_phone = payload.owner_phone
        existing_claim.owner_email = payload.owner_email
        existing_claim.preferred_contact_method = payload.preferred_contact_method
        existing_claim.template_key = payload.template_key
        existing_claim.menu_confirmed = payload.menu_confirmed
        existing_claim.hours_contact_confirmed = payload.hours_contact_confirmed
        existing_claim.launch_terms_accepted_at = now
        _ensure_pricing_snapshot(existing_claim)
        access_token = _issue_launch_access_token(existing_claim)
        await db.commit()
        restaurant = await _get_restaurant_context_by_id(db, session.restaurant_id)
        if restaurant is not None:
            try:
                await send_owner_launch_notification(
                    db,
                    restaurant,
                    existing_claim,
                    "launch_link_ready",
                    access_token=access_token,
                )
            except Exception as exc:  # pragma: no cover - notification failure should not block
                logger.warning(
                    "Owner launch-link notification failed for claim %s: %s",
                    existing_claim.id,
                    exc,
                )
        return ClaimSubmitOut(
            claim_request_id=existing_claim.id,
            status=existing_claim.status,
            launch_access_token=access_token,
        )

    claim_request = ClaimRequest(
        restaurant_id=session.restaurant_id,
        verification_session_id=session.id,
        owner_name=payload.owner_name,
        owner_phone=payload.owner_phone,
        owner_email=payload.owner_email,
        preferred_contact_method=payload.preferred_contact_method,
        template_key=payload.template_key,
        menu_confirmed=payload.menu_confirmed,
        hours_contact_confirmed=payload.hours_contact_confirmed,
        verification_method="sms",
        verification_status="verified",
        status="verified_request_received",
        launch_terms_accepted_at=now,
        setup_deposit_state="pending",
        kickoff_state="pending",
        submitted_at=now,
    )
    _ensure_pricing_snapshot(claim_request)
    access_token = _issue_launch_access_token(claim_request)
    db.add(claim_request)
    await db.commit()
    await db.refresh(claim_request)

    restaurant = await _get_restaurant_context_by_id(db, session.restaurant_id)
    if restaurant is not None:
        try:
            await _send_claim_alert_email(restaurant, claim_request)
        except Exception as exc:  # pragma: no cover - email failure should not block
            logger.warning(
                "Claim alert email failed for claim %s: %s", claim_request.id, exc
            )
        try:
            await send_owner_launch_notification(
                db,
                restaurant,
                claim_request,
                "launch_link_ready",
                access_token=access_token,
            )
        except Exception as exc:  # pragma: no cover - notification failure should not block
            logger.warning(
                "Owner launch-link notification failed for claim %s: %s",
                claim_request.id,
                exc,
            )

    return ClaimSubmitOut(
        claim_request_id=claim_request.id,
        status=claim_request.status,
        launch_access_token=access_token,
    )


async def submit_manual_review_request(
    db: AsyncSession, payload: ClaimManualReviewIn
) -> ClaimManualReviewOut:
    _validate_claim_contact_fields(
        payload.owner_name, payload.owner_phone, payload.owner_email
    )
    if not payload.reason.strip():
        raise ClaimServiceError(400, "Tell us why manual review is needed.")

    restaurant = await _get_restaurant_context(
        db, payload.state_slug, payload.city_slug, payload.restaurant_slug
    )
    if restaurant is None:
        raise ClaimServiceError(404, "Restaurant not found.")

    claim_request = ClaimRequest(
        restaurant_id=restaurant.id,
        owner_name=payload.owner_name,
        owner_phone=payload.owner_phone,
        owner_email=payload.owner_email,
        preferred_contact_method=payload.preferred_contact_method,
        template_key=payload.template_key,
        menu_confirmed=False,
        hours_contact_confirmed=False,
        verification_method="manual_review",
        verification_status="manual_review_requested",
        manual_review_reason=payload.reason,
        setup_deposit_state="pending",
        kickoff_state="pending",
        status="manual_review_requested",
        submitted_at=_utc_now(),
    )
    _ensure_pricing_snapshot(claim_request)
    access_token = _issue_launch_access_token(claim_request)
    db.add(claim_request)
    await db.commit()
    await db.refresh(claim_request)

    try:
        await _send_claim_alert_email(restaurant, claim_request)
    except Exception as exc:  # pragma: no cover - email failure should not block
        logger.warning(
            "Manual review alert email failed for claim %s: %s",
            claim_request.id,
            exc,
        )
    try:
        await send_owner_launch_notification(
            db,
            restaurant,
            claim_request,
            "manual_review_saved",
            access_token=access_token,
        )
    except Exception as exc:  # pragma: no cover - notification failure should not block
        logger.warning(
            "Owner manual-review notification failed for claim %s: %s",
            claim_request.id,
            exc,
        )

    return ClaimManualReviewOut(
        claim_request_id=claim_request.id,
        status=claim_request.status,
        launch_access_token=access_token,
    )


async def _get_claim_request_or_404(
    db: AsyncSession, claim_request_id: uuid.UUID
) -> ClaimRequest:
    result = await db.execute(
        select(ClaimRequest).where(ClaimRequest.id == claim_request_id)
    )
    claim_request = result.scalar_one_or_none()
    if claim_request is None:
        raise ClaimServiceError(404, "Claim request not found.")
    return claim_request


async def get_claim_request_status(
    db: AsyncSession, claim_request_id: uuid.UUID, access_token: str
) -> ClaimRequestStatusOut:
    claim_request = await _get_claim_request_or_404(db, claim_request_id)
    _validate_launch_access(claim_request, access_token)

    restaurant = await _get_restaurant_context_by_id(db, claim_request.restaurant_id)
    if restaurant is None:
        raise ClaimServiceError(404, "Restaurant not found for this claim request.")

    return _serialize_claim_request_status(claim_request, restaurant)


async def submit_claim_setup_intake(
    db: AsyncSession,
    claim_request_id: uuid.UUID,
    payload: ClaimSetupIntakeIn,
) -> ClaimRequestStatusOut:
    claim_request = await _get_claim_request_or_404(db, claim_request_id)
    _validate_launch_access(claim_request, payload.access_token)

    if claim_request.setup_deposit_state != "paid":
        raise ClaimServiceError(
            400,
            "Setup details unlock after the setup deposit is paid.",
        )

    claim_request.preferred_contact_method = payload.preferred_contact_method
    claim_request.setup_intake = {
        "preferredContactMethod": payload.preferred_contact_method,
        "hoursFulfillmentNotes": payload.hours_fulfillment_notes,
        "googleBusinessProfileStatus": payload.google_business_profile_status,
        "yelpStatus": payload.yelp_status,
        "domainStatus": payload.domain_status,
        "logoPhotosStatus": payload.logo_photos_status,
        "posPaymentStatus": payload.pos_payment_status,
        "setupNotes": payload.setup_notes,
    }
    claim_request.setup_intake_submitted_at = _utc_now()
    await db.commit()

    restaurant = await _get_restaurant_context_by_id(db, claim_request.restaurant_id)
    if restaurant is None:
        raise ClaimServiceError(404, "Restaurant not found for this claim request.")

    return _serialize_claim_request_status(claim_request, restaurant)


async def submit_claim_review_decision(
    db: AsyncSession,
    claim_request_id: uuid.UUID,
    payload: ClaimReviewDecisionIn,
) -> ClaimRequestStatusOut:
    claim_request = await _get_claim_request_or_404(db, claim_request_id)
    _validate_launch_access(claim_request, payload.access_token)

    requested_issue_areas = _normalize_review_issue_areas(payload.issue_areas)
    requested_notes = payload.notes.strip() if payload.notes else None
    if payload.decision == "changes_requested" and not (
        requested_issue_areas or requested_notes
    ):
        raise ClaimServiceError(
            400,
            "Tell us what should change before sending revisions back to the team.",
        )

    target_status = (
        "approved_for_launch"
        if payload.decision == "approved"
        else "changes_requested"
    )
    current_status = _status_key(claim_request)
    current_review_state = _review_state_value(claim_request)

    if current_status != "ready_for_review":
        if current_status == target_status and (
            current_review_state == "approved"
            if payload.decision == "approved"
            else current_review_state == "changes_requested"
        ):
            restaurant = await _get_restaurant_context_by_id(db, claim_request.restaurant_id)
            if restaurant is None:
                raise ClaimServiceError(404, "Restaurant not found for this claim request.")
            return _serialize_claim_request_status(claim_request, restaurant)
        raise ClaimServiceError(
            400,
            "This review step is already closed. Use the latest launch email or contact support if you still need help.",
        )

    now = _utc_now()
    if payload.decision == "approved":
        claim_request.status = "approved_for_launch"
        claim_request.review_state = "approved"
    else:
        claim_request.status = "changes_requested"
        claim_request.review_state = "changes_requested"

    claim_request.review_responded_at = now
    claim_request.review_issue_areas = requested_issue_areas or []
    claim_request.review_notes = requested_notes
    await db.commit()

    restaurant = await _get_restaurant_context_by_id(db, claim_request.restaurant_id)
    if restaurant is None:
        raise ClaimServiceError(404, "Restaurant not found for this claim request.")

    try:
        await send_owner_launch_notification(
            db,
            restaurant,
            claim_request,
            (
                "review_approved_received"
                if payload.decision == "approved"
                else "review_changes_requested_received"
            ),
            access_token=payload.access_token,
        )
    except Exception as exc:  # pragma: no cover - notification failure should not block
        logger.warning(
            "Owner review confirmation notification failed for claim %s: %s",
            claim_request.id,
            exc,
        )

    try:
        await _send_owner_review_ops_alert(
            restaurant,
            claim_request,
            access_token=payload.access_token,
        )
    except Exception as exc:  # pragma: no cover - internal email failure should not block
        logger.warning(
            "Owner review ops alert failed for claim %s: %s",
            claim_request.id,
            exc,
        )

    return _serialize_claim_request_status(claim_request, restaurant)


def _mark_setup_deposit_paid(
    claim_request: ClaimRequest,
    *,
    payment_intent_id: str | None = None,
    customer_id: str | None = None,
) -> None:
    _ensure_pricing_snapshot(claim_request)
    claim_request.setup_deposit_state = "paid"
    claim_request.setup_deposit_paid_at = claim_request.setup_deposit_paid_at or _utc_now()
    if payment_intent_id:
        claim_request.stripe_payment_intent_id = payment_intent_id
    if customer_id:
        claim_request.stripe_customer_id = customer_id
    if _status_key(claim_request) in {
        "verified_request_received",
        "manual_review_requested",
        "deposit_paid",
    }:
        claim_request.status = "deposit_paid"


def _mark_setup_deposit_failed(claim_request: ClaimRequest) -> None:
    if claim_request.setup_deposit_state != "paid":
        claim_request.setup_deposit_state = "failed"
    if _is_payment_unlocked(claim_request):
        claim_request.status = "verified_request_received"


async def create_deposit_checkout(
    db: AsyncSession,
    claim_request_id: uuid.UUID,
    payload: ClaimDepositCheckoutIn,
) -> ClaimDepositCheckoutOut:
    claim_request = await _get_claim_request_or_404(db, claim_request_id)
    _validate_launch_access(claim_request, payload.access_token)

    if not _is_payment_unlocked(claim_request):
        raise ClaimServiceError(
            400,
            "Payment is locked until ownership review is approved.",
        )

    if claim_request.setup_deposit_state == "paid":
        return ClaimDepositCheckoutOut(
            checkout_url=_build_launch_url(
                claim_request.id,
                payload.access_token,
                {"payment": "paid"},
            )
        )

    _ensure_pricing_snapshot(claim_request)
    provider = _normalize_payment_provider()

    if provider == "mock":
        claim_request.setup_deposit_state = "pending"
        claim_request.status = "verified_request_received"
        await db.commit()
        return ClaimDepositCheckoutOut(
            checkout_url=_build_launch_url(
                claim_request.id,
                payload.access_token,
                path_suffix="/deposit/mock",
            )
        )

    if stripe is None:
        raise ClaimServiceError(
            503,
            "Stripe payment is not installed right now. Contact support to start kickoff.",
        )

    stripe.api_key = settings.stripe_secret_key

    def _create_session():
        return stripe.checkout.Session.create(
            mode="payment",
            success_url=_build_launch_url(
                claim_request.id,
                payload.access_token,
                {"payment": "success"},
            ),
            cancel_url=_build_launch_url(
                claim_request.id,
                payload.access_token,
                {"payment": "cancelled"},
            ),
            line_items=[
                {
                    "quantity": 1,
                    "price_data": {
                        "currency": claim_request.currency or _claim_currency(),
                        "unit_amount": claim_request.setup_deposit_cents
                        or _claim_setup_deposit_cents(),
                        "product_data": {
                            "name": "Chinese Takeout Website Setup Deposit",
                            "description": "One-time setup deposit. Monthly billing begins only after launch.",
                        },
                    },
                }
            ],
            customer_email=claim_request.owner_email,
            metadata={"claim_request_id": str(claim_request.id)},
            payment_intent_data={
                "metadata": {"claim_request_id": str(claim_request.id)}
            },
        )

    try:
        session = await asyncio.to_thread(_create_session)
    except Exception as exc:  # pragma: no cover - network/Stripe error
        logger.exception("Stripe checkout session creation failed: %s", exc)
        raise ClaimServiceError(
            503,
            "Could not start checkout right now. Try again or contact support.",
        ) from exc

    checkout_url = getattr(session, "url", None)
    if not checkout_url:
        raise ClaimServiceError(
            503,
            "Could not start checkout right now. Try again or contact support.",
        )

    claim_request.setup_deposit_state = "pending"
    claim_request.stripe_checkout_session_id = getattr(session, "id", None)
    customer_id = getattr(session, "customer", None)
    if isinstance(customer_id, str):
        claim_request.stripe_customer_id = customer_id
    await db.commit()

    return ClaimDepositCheckoutOut(checkout_url=checkout_url)


async def complete_mock_deposit_checkout(
    db: AsyncSession,
    claim_request_id: uuid.UUID,
    payload: ClaimMockDepositCompleteIn,
) -> ClaimRequestStatusOut:
    if _normalize_payment_provider() != "mock":
        raise ClaimServiceError(404, "Mock checkout is not available.")

    claim_request = await _get_claim_request_or_404(db, claim_request_id)
    _validate_launch_access(claim_request, payload.access_token)

    if payload.outcome == "paid":
        _mark_setup_deposit_paid(claim_request)
    elif payload.outcome == "failed":
        _mark_setup_deposit_failed(claim_request)
    else:
        if claim_request.setup_deposit_state != "paid":
            claim_request.setup_deposit_state = "pending"
            if _is_payment_unlocked(claim_request):
                claim_request.status = "verified_request_received"

    await db.commit()
    restaurant = await _get_restaurant_context_by_id(db, claim_request.restaurant_id)
    if restaurant is None:
        raise ClaimServiceError(404, "Restaurant not found for this claim request.")
    if payload.outcome == "paid":
        try:
            await send_owner_launch_notification(
                db,
                restaurant,
                claim_request,
                "deposit_received",
                access_token=payload.access_token,
            )
        except Exception as exc:  # pragma: no cover - notification failure should not block
            logger.warning(
                "Deposit received notification failed for claim %s: %s",
                claim_request.id,
                exc,
            )
    return _serialize_claim_request_status(claim_request, restaurant)


async def handle_deposit_webhook(
    db: AsyncSession,
    payload: bytes,
    signature: str | None,
) -> dict[str, bool]:
    if _normalize_payment_provider() != "stripe":
        return {"received": True}
    if stripe is None or not settings.stripe_webhook_secret:
        raise ClaimServiceError(503, "Stripe webhook is not configured.")

    try:
        event = stripe.Webhook.construct_event(
            payload=payload,
            sig_header=signature,
            secret=settings.stripe_webhook_secret,
        )
    except Exception as exc:
        raise ClaimServiceError(400, f"Invalid Stripe webhook payload: {exc}") from exc

    event_type = getattr(event, "type", "")
    data_object = event["data"]["object"]

    if event_type in {"checkout.session.completed", "checkout.session.async_payment_succeeded"}:
        session_id = data_object.get("id")
        if not session_id:
            return {"received": True}
        result = await db.execute(
            select(ClaimRequest).where(
                ClaimRequest.stripe_checkout_session_id == session_id
            )
        )
        claim_request = result.scalar_one_or_none()
        if claim_request is None:
            return {"received": True}
        _mark_setup_deposit_paid(
            claim_request,
            payment_intent_id=data_object.get("payment_intent"),
            customer_id=data_object.get("customer"),
        )
        await db.commit()
        restaurant = await _get_restaurant_context_by_id(db, claim_request.restaurant_id)
        if restaurant is not None:
            try:
                await send_owner_launch_notification(
                    db,
                    restaurant,
                    claim_request,
                    "deposit_received",
                )
            except Exception as exc:  # pragma: no cover - notification failure should not block
                logger.warning(
                    "Deposit received notification failed for claim %s: %s",
                    claim_request.id,
                    exc,
                )
        return {"received": True}

    if event_type in {
        "checkout.session.async_payment_failed",
        "checkout.session.expired",
    }:
        session_id = data_object.get("id")
        if not session_id:
            return {"received": True}
        result = await db.execute(
            select(ClaimRequest).where(
                ClaimRequest.stripe_checkout_session_id == session_id
            )
        )
        claim_request = result.scalar_one_or_none()
        if claim_request is None:
            return {"received": True}
        _mark_setup_deposit_failed(claim_request)
        await db.commit()

    return {"received": True}
