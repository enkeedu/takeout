import uuid
from typing import Any
from datetime import datetime

from sqlalchemy import Boolean, DateTime, ForeignKey, Index, Integer, JSON, String, Text, UniqueConstraint, func
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.models.base import Base


class ClaimVerificationSession(Base):
    __tablename__ = "claim_verification_sessions"

    id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), primary_key=True, default=uuid.uuid4
    )
    restaurant_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("restaurants.id", ondelete="CASCADE"),
        nullable=False,
    )
    destination_phone: Mapped[str] = mapped_column(String(32), nullable=False)
    requested_ip: Mapped[str | None] = mapped_column(String(64), nullable=True)
    provider: Mapped[str] = mapped_column(String(20), nullable=False)
    provider_sid: Mapped[str | None] = mapped_column(String(255), nullable=True)
    status: Mapped[str] = mapped_column(
        String(40), nullable=False, server_default="sent"
    )
    attempt_count: Mapped[int] = mapped_column(
        Integer, nullable=False, server_default="0"
    )
    code_hash: Mapped[str | None] = mapped_column(String(64), nullable=True)
    expires_at: Mapped[datetime | None] = mapped_column(
        DateTime(timezone=True), nullable=True
    )
    verified_at: Mapped[datetime | None] = mapped_column(
        DateTime(timezone=True), nullable=True
    )
    verification_token_hash: Mapped[str | None] = mapped_column(
        String(64), nullable=True
    )
    verification_token_expires_at: Mapped[datetime | None] = mapped_column(
        DateTime(timezone=True), nullable=True
    )
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), nullable=False, server_default=func.now()
    )
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), nullable=False, server_default=func.now(), onupdate=func.now()
    )

    restaurant: Mapped["Restaurant"] = relationship(
        back_populates="claim_verification_sessions"
    )
    claim_requests: Mapped[list["ClaimRequest"]] = relationship(
        back_populates="verification_session"
    )

    __table_args__ = (
        Index(
            "ix_claim_verification_sessions_restaurant_id",
            "restaurant_id",
        ),
        Index(
            "ix_claim_verification_sessions_created_at",
            "created_at",
        ),
        Index(
            "ix_claim_verification_sessions_verification_token_hash",
            "verification_token_hash",
            unique=True,
        ),
    )


class ClaimRequest(Base):
    __tablename__ = "claim_requests"

    id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), primary_key=True, default=uuid.uuid4
    )
    restaurant_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("restaurants.id", ondelete="CASCADE"),
        nullable=False,
    )
    verification_session_id: Mapped[uuid.UUID | None] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("claim_verification_sessions.id", ondelete="SET NULL"),
        nullable=True,
    )
    owner_name: Mapped[str] = mapped_column(String(255), nullable=False)
    owner_phone: Mapped[str] = mapped_column(String(32), nullable=False)
    owner_email: Mapped[str] = mapped_column(String(255), nullable=False)
    preferred_contact_method: Mapped[str] = mapped_column(String(20), nullable=False)
    template_key: Mapped[str] = mapped_column(String(40), nullable=False)
    menu_confirmed: Mapped[bool] = mapped_column(
        Boolean, nullable=False, server_default="false"
    )
    hours_contact_confirmed: Mapped[bool] = mapped_column(
        Boolean, nullable=False, server_default="false"
    )
    verification_method: Mapped[str] = mapped_column(String(20), nullable=False)
    verification_status: Mapped[str] = mapped_column(String(40), nullable=False)
    manual_review_reason: Mapped[str | None] = mapped_column(Text, nullable=True)
    access_token_hash: Mapped[str | None] = mapped_column(String(64), nullable=True)
    launch_terms_accepted_at: Mapped[datetime | None] = mapped_column(
        DateTime(timezone=True), nullable=True
    )
    setup_deposit_cents: Mapped[int | None] = mapped_column(Integer, nullable=True)
    monthly_plan_cents: Mapped[int | None] = mapped_column(Integer, nullable=True)
    currency: Mapped[str | None] = mapped_column(String(8), nullable=True)
    setup_deposit_state: Mapped[str] = mapped_column(
        String(20), nullable=False, server_default="pending"
    )
    setup_deposit_paid_at: Mapped[datetime | None] = mapped_column(
        DateTime(timezone=True), nullable=True
    )
    stripe_checkout_session_id: Mapped[str | None] = mapped_column(
        String(255), nullable=True
    )
    stripe_payment_intent_id: Mapped[str | None] = mapped_column(
        String(255), nullable=True
    )
    stripe_customer_id: Mapped[str | None] = mapped_column(
        String(255), nullable=True
    )
    kickoff_state: Mapped[str] = mapped_column(
        String(20), nullable=False, server_default="pending"
    )
    kickoff_scheduled_for: Mapped[datetime | None] = mapped_column(
        DateTime(timezone=True), nullable=True
    )
    review_state: Mapped[str | None] = mapped_column(String(30), nullable=True)
    review_responded_at: Mapped[datetime | None] = mapped_column(
        DateTime(timezone=True), nullable=True
    )
    review_issue_areas: Mapped[list[str] | None] = mapped_column(JSON, nullable=True)
    review_notes: Mapped[str | None] = mapped_column(Text, nullable=True)
    monthly_billing_starts_at: Mapped[datetime | None] = mapped_column(
        DateTime(timezone=True), nullable=True
    )
    setup_intake: Mapped[dict[str, Any] | None] = mapped_column(JSON, nullable=True)
    setup_intake_submitted_at: Mapped[datetime | None] = mapped_column(
        DateTime(timezone=True), nullable=True
    )
    status: Mapped[str] = mapped_column(
        String(40), nullable=False, server_default="new"
    )
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), nullable=False, server_default=func.now()
    )
    submitted_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), nullable=False, server_default=func.now()
    )

    restaurant: Mapped["Restaurant"] = relationship(back_populates="claim_requests")
    verification_session: Mapped["ClaimVerificationSession | None"] = relationship(
        back_populates="claim_requests"
    )
    notifications: Mapped[list["ClaimRequestNotification"]] = relationship(
        back_populates="claim_request",
        cascade="all, delete-orphan",
    )

    __table_args__ = (
        UniqueConstraint(
            "verification_session_id",
            name="uq_claim_requests_verification_session_id",
        ),
        Index("ix_claim_requests_restaurant_id", "restaurant_id"),
        Index("ix_claim_requests_status", "status"),
        Index("ix_claim_requests_access_token_hash", "access_token_hash"),
        Index(
            "ix_claim_requests_stripe_checkout_session_id",
            "stripe_checkout_session_id",
            unique=True,
        ),
    )


class ClaimRequestNotification(Base):
    __tablename__ = "claim_request_notifications"

    id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), primary_key=True, default=uuid.uuid4
    )
    claim_request_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("claim_requests.id", ondelete="CASCADE"),
        nullable=False,
    )
    event_key: Mapped[str] = mapped_column(String(64), nullable=False)
    channel: Mapped[str] = mapped_column(
        String(20), nullable=False, server_default="email"
    )
    recipient: Mapped[str] = mapped_column(String(255), nullable=False)
    status: Mapped[str] = mapped_column(String(20), nullable=False)
    launch_access_token: Mapped[str | None] = mapped_column(
        String(255), nullable=True
    )
    sent_at: Mapped[datetime | None] = mapped_column(
        DateTime(timezone=True), nullable=True
    )
    last_error: Mapped[str | None] = mapped_column(Text, nullable=True)
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), nullable=False, server_default=func.now()
    )
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        nullable=False,
        server_default=func.now(),
        onupdate=func.now(),
    )

    claim_request: Mapped["ClaimRequest"] = relationship(
        back_populates="notifications"
    )

    __table_args__ = (
        UniqueConstraint(
            "claim_request_id",
            "event_key",
            "channel",
            name="uq_claim_request_notifications_event_channel",
        ),
        Index(
            "ix_claim_request_notifications_claim_request_id",
            "claim_request_id",
        ),
        Index(
            "ix_claim_request_notifications_event_key",
            "event_key",
        ),
    )
