from datetime import datetime
from typing import Literal

from pydantic import BaseModel

from app.schemas.claim import ClaimSetupIntakeSummary


class LeadItem(BaseModel):
    restaurant_id: str
    name: str
    city: str
    state: str
    phone: str | None = None
    website_url: str | None = None
    platform: str | None = None
    has_online_ordering: bool = False
    http_status: int | None = None
    ssl_valid: bool | None = None
    audit_error: str | None = None
    rating: float | None = None
    user_rating_count: int | None = None
    lead_score: int
    estimated_monthly_spend: int
    state_slug: str
    city_slug: str
    restaurant_slug: str


class ChartEntry(BaseModel):
    label: str
    value: int


class LeadStats(BaseModel):
    total_restaurants: int
    no_website_count: int
    broken_website_count: int
    avg_lead_score: float
    platform_counts: list[ChartEntry]
    score_distribution: list[ChartEntry]
    website_status: list[ChartEntry]
    ordering_counts: list[ChartEntry]


class LeadsResponse(BaseModel):
    stats: LeadStats
    items: list[LeadItem]
    total: int
    page: int
    page_size: int
    total_pages: int


AdminClaimQueueAction = Literal[
    "approve_manual_review",
    "mark_kickoff_scheduled",
    "mark_kickoff_confirmed",
    "mark_build_in_progress",
    "mark_review_ready",
    "mark_live",
]


class AdminClaimQueueItem(BaseModel):
    claim_request_id: str
    status: str
    status_label: str
    status_detail: str
    payment_unlocked: bool
    setup_deposit_state: str
    kickoff_state: str
    review_state: str
    submitted_at: datetime
    kickoff_scheduled_for: datetime | None = None
    review_responded_at: datetime | None = None
    review_issue_areas: list[str] = []
    review_notes: str | None = None
    setup_intake_status: str
    setup_intake_submitted_at: datetime | None = None
    setup_intake_summary: ClaimSetupIntakeSummary | None = None
    template_key: str
    owner_name: str
    owner_phone: str
    owner_email: str
    preferred_contact_method: str
    verification_method: str
    verification_status: str
    manual_review_reason: str | None = None
    restaurant_name: str
    restaurant_city: str
    restaurant_state: str
    state_slug: str
    city_slug: str
    restaurant_slug: str


class AdminClaimQueueResponse(BaseModel):
    items: list[AdminClaimQueueItem]


class AdminUnlistedOwnerRequestItem(BaseModel):
    request_id: str
    restaurant_name: str
    city: str
    state: str
    restaurant_phone: str | None = None
    owner_name: str
    owner_phone: str
    owner_email: str
    preferred_contact_method: str
    website_url: str | None = None
    google_maps_url: str | None = None
    yelp_url: str | None = None
    notes: str | None = None
    source_path: str | None = None
    status: str
    created_at: datetime


class AdminUnlistedOwnerRequestResponse(BaseModel):
    items: list[AdminUnlistedOwnerRequestItem]


class AdminClaimQueueUpdateIn(BaseModel):
    action: AdminClaimQueueAction
    kickoff_scheduled_for: datetime | None = None


class AdminDiagnosticsOut(BaseModel):
    api_admin_token_configured: bool
    payment_provider: str
    stripe_ready: bool
    sms_provider: str
    smtp_ready: bool
    smtp_auth_configured: bool
    smtp_sender_ready: bool
    web_base_url_configured: bool
    claim_alert_recipient_ready: bool
    claim_alert_ready: bool
    owner_notifications_ready: bool
    warnings: list[str]


class AdminTestEmailIn(BaseModel):
    recipient: str | None = None


class AdminTestEmailOut(BaseModel):
    recipient: str
    detail: str
