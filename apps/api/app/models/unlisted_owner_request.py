import uuid
from datetime import datetime

from sqlalchemy import DateTime, Index, String, Text, func
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import Mapped, mapped_column

from app.models.base import Base


class UnlistedOwnerRequest(Base):
    __tablename__ = "unlisted_owner_requests"

    id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), primary_key=True, default=uuid.uuid4
    )
    restaurant_name: Mapped[str] = mapped_column(String(255), nullable=False)
    city: Mapped[str] = mapped_column(String(120), nullable=False)
    state: Mapped[str] = mapped_column(String(64), nullable=False)
    restaurant_phone: Mapped[str | None] = mapped_column(String(32), nullable=True)
    owner_name: Mapped[str] = mapped_column(String(255), nullable=False)
    owner_phone: Mapped[str] = mapped_column(String(32), nullable=False)
    owner_email: Mapped[str] = mapped_column(String(255), nullable=False)
    preferred_contact_method: Mapped[str] = mapped_column(String(20), nullable=False)
    website_url: Mapped[str | None] = mapped_column(String(500), nullable=True)
    google_maps_url: Mapped[str | None] = mapped_column(String(500), nullable=True)
    yelp_url: Mapped[str | None] = mapped_column(String(500), nullable=True)
    notes: Mapped[str | None] = mapped_column(Text, nullable=True)
    source_path: Mapped[str | None] = mapped_column(String(255), nullable=True)
    status: Mapped[str] = mapped_column(
        String(32), nullable=False, server_default="new"
    )
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), nullable=False, server_default=func.now()
    )

    __table_args__ = (
        Index("ix_unlisted_owner_requests_created_at", "created_at"),
        Index("ix_unlisted_owner_requests_status", "status"),
        Index("ix_unlisted_owner_requests_state", "state"),
    )
