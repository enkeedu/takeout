import uuid
from datetime import datetime
from typing import Any

from sqlalchemy import Boolean, DateTime, ForeignKey, Index, JSON, String, Text, func
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.models.base import Base


class OwnerSiteProfile(Base):
    __tablename__ = "owner_site_profiles"

    id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), primary_key=True, default=uuid.uuid4
    )
    restaurant_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("restaurants.id", ondelete="CASCADE"),
        nullable=False,
        unique=True,
    )
    claim_request_id: Mapped[uuid.UUID | None] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("claim_requests.id", ondelete="SET NULL"),
        nullable=True,
    )
    business_name: Mapped[str | None] = mapped_column(Text, nullable=True)
    phone: Mapped[str | None] = mapped_column(String(32), nullable=True)
    address1: Mapped[str | None] = mapped_column(Text, nullable=True)
    address2: Mapped[str | None] = mapped_column(Text, nullable=True)
    city: Mapped[str | None] = mapped_column(String(120), nullable=True)
    state: Mapped[str | None] = mapped_column(String(64), nullable=True)
    zip: Mapped[str | None] = mapped_column(String(20), nullable=True)
    short_description: Mapped[str | None] = mapped_column(Text, nullable=True)
    logo_url: Mapped[str | None] = mapped_column(Text, nullable=True)
    photo_urls: Mapped[list[str] | None] = mapped_column(JSON, nullable=True)
    menu_image_urls: Mapped[list[str] | None] = mapped_column(JSON, nullable=True)
    template_key: Mapped[str | None] = mapped_column(String(40), nullable=True)
    hours_json: Mapped[dict[str, Any] | None] = mapped_column(JSON, nullable=True)
    is_published: Mapped[bool] = mapped_column(
        Boolean, nullable=False, server_default="false"
    )
    published_at: Mapped[datetime | None] = mapped_column(
        DateTime(timezone=True), nullable=True
    )
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), nullable=False, server_default=func.now()
    )
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        nullable=False,
        server_default=func.now(),
        onupdate=func.now(),
    )

    restaurant: Mapped["Restaurant"] = relationship(back_populates="owner_site_profile")
    claim_request: Mapped["ClaimRequest | None"] = relationship()

    __table_args__ = (
        Index("ix_owner_site_profiles_restaurant_id", "restaurant_id"),
        Index("ix_owner_site_profiles_claim_request_id", "claim_request_id"),
        Index("ix_owner_site_profiles_is_published", "is_published"),
    )
