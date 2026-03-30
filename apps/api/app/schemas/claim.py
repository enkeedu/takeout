import uuid
from datetime import datetime
from typing import Literal

from pydantic import AliasChoices, BaseModel, ConfigDict, Field, field_validator

ClaimSmsProvider = Literal["mock", "twilio"]
PreferredContactMethod = Literal["call", "text", "whatsapp", "email"]
ClaimTemplateKey = Literal["local-order", "local-storefront", "local-express"]
SetupDepositState = Literal["pending", "paid", "failed", "refunded"]
KickoffState = Literal["pending", "scheduled", "confirmed"]
MonthlyBillingState = Literal["pending", "active"]
SetupIntakeStatus = Literal["missing", "submitted"]
MockDepositOutcome = Literal["paid", "failed", "cancelled"]
ClaimReviewState = Literal["pending", "changes_requested", "approved"]
ClaimReviewDecision = Literal["approved", "changes_requested"]
ClaimSetupExternalStatus = Literal["ready", "need_help", "not_sure"]
ClaimSetupDomainStatus = Literal["have_access", "need_help", "no_domain_yet", "not_sure"]
ClaimSetupAssetStatus = Literal["ready", "partial", "need_help"]
ClaimSetupPosStatus = Literal["ready", "need_help", "not_applicable", "not_sure"]
ClaimReviewIssueArea = Literal[
    "branding_photos",
    "menu_pricing",
    "hours_contact",
    "fulfillment_ordering",
    "links_cta",
]


class CamelModel(BaseModel):
    model_config = ConfigDict(populate_by_name=True, serialize_by_alias=True)


class ClaimRestaurantContext(CamelModel):
    state_slug: str = Field(
        ...,
        validation_alias=AliasChoices("stateSlug", "state_slug"),
        serialization_alias="stateSlug",
    )
    city_slug: str = Field(
        ...,
        validation_alias=AliasChoices("citySlug", "city_slug"),
        serialization_alias="citySlug",
    )
    restaurant_slug: str = Field(
        ...,
        validation_alias=AliasChoices("restaurantSlug", "restaurant_slug"),
        serialization_alias="restaurantSlug",
    )

    @field_validator("state_slug", "city_slug", "restaurant_slug")
    @classmethod
    def normalize_slug(cls, value: str) -> str:
        return value.strip().lower()


class ClaimSendCodeIn(ClaimRestaurantContext):
    pass


class ClaimSendCodeOut(CamelModel):
    session_id: uuid.UUID = Field(serialization_alias="sessionId")
    masked_phone: str = Field(serialization_alias="maskedPhone")
    expires_in_seconds: int = Field(serialization_alias="expiresInSeconds")
    provider_mode: ClaimSmsProvider = Field(serialization_alias="providerMode")


class ClaimVerifyCodeIn(CamelModel):
    session_id: uuid.UUID = Field(
        ...,
        validation_alias=AliasChoices("sessionId", "session_id"),
        serialization_alias="sessionId",
    )
    code: str

    @field_validator("code")
    @classmethod
    def normalize_code(cls, value: str) -> str:
        return value.strip()


class ClaimVerifyCodeOut(CamelModel):
    verified: bool
    verified_token: str = Field(serialization_alias="verifiedToken")
    expires_in_seconds: int = Field(serialization_alias="expiresInSeconds")


class ClaimSubmitIn(CamelModel):
    verified_token: str = Field(
        ...,
        validation_alias=AliasChoices("verifiedToken", "verified_token"),
        serialization_alias="verifiedToken",
    )
    owner_name: str = Field(
        ...,
        validation_alias=AliasChoices("ownerName", "owner_name"),
        serialization_alias="ownerName",
    )
    owner_phone: str = Field(
        ...,
        validation_alias=AliasChoices("ownerPhone", "owner_phone"),
        serialization_alias="ownerPhone",
    )
    owner_email: str = Field(
        ...,
        validation_alias=AliasChoices("ownerEmail", "owner_email"),
        serialization_alias="ownerEmail",
    )
    preferred_contact_method: PreferredContactMethod = Field(
        ...,
        validation_alias=AliasChoices(
            "preferredContactMethod", "preferred_contact_method"
        ),
        serialization_alias="preferredContactMethod",
    )
    template_key: ClaimTemplateKey = Field(
        ...,
        validation_alias=AliasChoices("templateKey", "template_key"),
        serialization_alias="templateKey",
    )
    menu_confirmed: bool = Field(
        ...,
        validation_alias=AliasChoices("menuConfirmed", "menu_confirmed"),
        serialization_alias="menuConfirmed",
    )
    hours_contact_confirmed: bool = Field(
        ...,
        validation_alias=AliasChoices(
            "hoursContactConfirmed", "hours_contact_confirmed"
        ),
        serialization_alias="hoursContactConfirmed",
    )
    launch_terms_accepted: bool = Field(
        ...,
        validation_alias=AliasChoices(
            "launchTermsAccepted", "launch_terms_accepted"
        ),
        serialization_alias="launchTermsAccepted",
    )

    @field_validator("verified_token", "owner_name", "owner_phone", "owner_email")
    @classmethod
    def trim_string(cls, value: str) -> str:
        return value.strip()


class ClaimSubmitOut(CamelModel):
    claim_request_id: uuid.UUID = Field(serialization_alias="claimRequestId")
    status: str
    launch_access_token: str = Field(serialization_alias="launchAccessToken")


ClaimProgressState = Literal["completed", "current", "upcoming"]


class ClaimProgressStepOut(CamelModel):
    key: str
    label: str
    state: ClaimProgressState
    detail: str


class ClaimRequestRestaurantOut(CamelModel):
    name: str
    phone: str | None = None
    address1: str
    city: str
    state: str
    state_slug: str = Field(serialization_alias="stateSlug")
    city_slug: str = Field(serialization_alias="citySlug")
    restaurant_slug: str = Field(serialization_alias="restaurantSlug")


class ClaimPricingSnapshotOut(CamelModel):
    setup_deposit_cents: int = Field(serialization_alias="setupDepositCents")
    monthly_plan_cents: int = Field(serialization_alias="monthlyPlanCents")
    currency: str


class ClaimSetupIntakeSummary(CamelModel):
    preferred_contact_method: PreferredContactMethod = Field(
        validation_alias=AliasChoices(
            "preferredContactMethod", "preferred_contact_method"
        ),
        serialization_alias="preferredContactMethod",
    )
    hours_fulfillment_notes: str | None = Field(
        default=None,
        validation_alias=AliasChoices(
            "hoursFulfillmentNotes", "hours_fulfillment_notes"
        ),
        serialization_alias="hoursFulfillmentNotes",
    )
    google_business_profile_status: ClaimSetupExternalStatus = Field(
        validation_alias=AliasChoices(
            "googleBusinessProfileStatus", "google_business_profile_status"
        ),
        serialization_alias="googleBusinessProfileStatus",
    )
    yelp_status: ClaimSetupExternalStatus = Field(
        validation_alias=AliasChoices("yelpStatus", "yelp_status"),
        serialization_alias="yelpStatus",
    )
    domain_status: ClaimSetupDomainStatus = Field(
        validation_alias=AliasChoices("domainStatus", "domain_status"),
        serialization_alias="domainStatus",
    )
    logo_photos_status: ClaimSetupAssetStatus = Field(
        validation_alias=AliasChoices("logoPhotosStatus", "logo_photos_status"),
        serialization_alias="logoPhotosStatus",
    )
    pos_payment_status: ClaimSetupPosStatus = Field(
        validation_alias=AliasChoices("posPaymentStatus", "pos_payment_status"),
        serialization_alias="posPaymentStatus",
    )
    setup_notes: str | None = Field(
        default=None,
        validation_alias=AliasChoices("setupNotes", "setup_notes"),
        serialization_alias="setupNotes",
    )

    @field_validator("hours_fulfillment_notes", "setup_notes")
    @classmethod
    def trim_optional_setup_notes(cls, value: str | None) -> str | None:
        if value is None:
            return None
        trimmed = value.strip()
        return trimmed or None


class ClaimRequestStatusOut(CamelModel):
    claim_request_id: uuid.UUID = Field(serialization_alias="claimRequestId")
    status: str
    status_label: str = Field(serialization_alias="statusLabel")
    status_detail: str = Field(serialization_alias="statusDetail")
    payment_unlocked: bool = Field(serialization_alias="paymentUnlocked")
    setup_deposit_state: SetupDepositState = Field(
        serialization_alias="setupDepositState"
    )
    setup_deposit_detail: str = Field(serialization_alias="setupDepositDetail")
    setup_deposit_paid_at: datetime | None = Field(
        serialization_alias="setupDepositPaidAt"
    )
    kickoff_state: KickoffState = Field(serialization_alias="kickoffState")
    kickoff_detail: str = Field(serialization_alias="kickoffDetail")
    kickoff_scheduled_for: datetime | None = Field(
        serialization_alias="kickoffScheduledFor"
    )
    review_state: ClaimReviewState = Field(serialization_alias="reviewState")
    review_responded_at: datetime | None = Field(
        serialization_alias="reviewRespondedAt"
    )
    review_issue_areas: list[ClaimReviewIssueArea] = Field(
        serialization_alias="reviewIssueAreas"
    )
    review_notes: str | None = Field(serialization_alias="reviewNotes")
    monthly_billing_state: MonthlyBillingState = Field(
        serialization_alias="monthlyBillingState"
    )
    monthly_billing_detail: str = Field(serialization_alias="monthlyBillingDetail")
    monthly_billing_starts_at: datetime | None = Field(
        serialization_alias="monthlyBillingStartsAt"
    )
    setup_intake_status: SetupIntakeStatus = Field(
        serialization_alias="setupIntakeStatus"
    )
    setup_intake_submitted_at: datetime | None = Field(
        serialization_alias="setupIntakeSubmittedAt"
    )
    setup_intake_summary: ClaimSetupIntakeSummary | None = Field(
        serialization_alias="setupIntakeSummary"
    )
    pricing: ClaimPricingSnapshotOut
    template_key: str = Field(serialization_alias="templateKey")
    owner_name: str = Field(serialization_alias="ownerName")
    owner_phone: str = Field(serialization_alias="ownerPhone")
    owner_email: str = Field(serialization_alias="ownerEmail")
    preferred_contact_method: PreferredContactMethod = Field(
        serialization_alias="preferredContactMethod"
    )
    verification_method: str = Field(serialization_alias="verificationMethod")
    verification_status: str = Field(serialization_alias="verificationStatus")
    menu_confirmed: bool = Field(serialization_alias="menuConfirmed")
    hours_contact_confirmed: bool = Field(
        serialization_alias="hoursContactConfirmed"
    )
    launch_terms_accepted_at: datetime | None = Field(
        serialization_alias="launchTermsAcceptedAt"
    )
    submitted_at: datetime = Field(serialization_alias="submittedAt")
    next_step_title: str = Field(serialization_alias="nextStepTitle")
    next_step_detail: str = Field(serialization_alias="nextStepDetail")
    restaurant: ClaimRequestRestaurantOut
    timeline: list[ClaimProgressStepOut]


class ClaimManualReviewIn(ClaimRestaurantContext):
    owner_name: str = Field(
        ...,
        validation_alias=AliasChoices("ownerName", "owner_name"),
        serialization_alias="ownerName",
    )
    owner_phone: str = Field(
        ...,
        validation_alias=AliasChoices("ownerPhone", "owner_phone"),
        serialization_alias="ownerPhone",
    )
    owner_email: str = Field(
        ...,
        validation_alias=AliasChoices("ownerEmail", "owner_email"),
        serialization_alias="ownerEmail",
    )
    preferred_contact_method: PreferredContactMethod = Field(
        default="call",
        validation_alias=AliasChoices(
            "preferredContactMethod", "preferred_contact_method"
        ),
        serialization_alias="preferredContactMethod",
    )
    template_key: ClaimTemplateKey = Field(
        default="local-order",
        validation_alias=AliasChoices("templateKey", "template_key"),
        serialization_alias="templateKey",
    )
    reason: str

    @field_validator("owner_name", "owner_phone", "owner_email", "reason")
    @classmethod
    def trim_manual_review_fields(cls, value: str) -> str:
        return value.strip()


class ClaimManualReviewOut(CamelModel):
    claim_request_id: uuid.UUID = Field(serialization_alias="claimRequestId")
    status: str
    launch_access_token: str = Field(serialization_alias="launchAccessToken")


class ClaimDepositCheckoutIn(CamelModel):
    access_token: str = Field(
        ...,
        validation_alias=AliasChoices("accessToken", "access_token"),
        serialization_alias="accessToken",
    )

    @field_validator("access_token")
    @classmethod
    def trim_access_token(cls, value: str) -> str:
        return value.strip()


class ClaimDepositCheckoutOut(CamelModel):
    checkout_url: str = Field(serialization_alias="checkoutUrl")


class ClaimSetupIntakeIn(ClaimSetupIntakeSummary):
    access_token: str = Field(
        ...,
        validation_alias=AliasChoices("accessToken", "access_token"),
        serialization_alias="accessToken",
    )

    @field_validator("access_token")
    @classmethod
    def trim_setup_access_token(cls, value: str) -> str:
        return value.strip()


class ClaimMockDepositCompleteIn(CamelModel):
    access_token: str = Field(
        ...,
        validation_alias=AliasChoices("accessToken", "access_token"),
        serialization_alias="accessToken",
    )
    outcome: MockDepositOutcome

    @field_validator("access_token")
    @classmethod
    def trim_mock_access_token(cls, value: str) -> str:
        return value.strip()


class ClaimReviewDecisionIn(CamelModel):
    access_token: str = Field(
        ...,
        validation_alias=AliasChoices("accessToken", "access_token"),
        serialization_alias="accessToken",
    )
    decision: ClaimReviewDecision
    issue_areas: list[ClaimReviewIssueArea] = Field(
        default_factory=list,
        validation_alias=AliasChoices("issueAreas", "issue_areas"),
        serialization_alias="issueAreas",
    )
    notes: str | None = None

    @field_validator("access_token")
    @classmethod
    def trim_review_access_token(cls, value: str) -> str:
        return value.strip()

    @field_validator("notes")
    @classmethod
    def trim_review_notes(cls, value: str | None) -> str | None:
        if value is None:
            return None
        trimmed = value.strip()
        return trimmed or None
