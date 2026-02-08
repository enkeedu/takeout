import uuid
from datetime import datetime

from sqlalchemy import DateTime, ForeignKey, Integer, String, Text, func
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.models.base import Base


class WebsiteAudit(Base):
    __tablename__ = "website_audits"

    id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), primary_key=True, default=uuid.uuid4
    )
    restaurant_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("restaurants.id", ondelete="CASCADE"),
        nullable=False, index=True,
    )
    url_checked: Mapped[str] = mapped_column(Text, nullable=False)
    http_status: Mapped[int | None] = mapped_column(Integer, nullable=True)
    redirect_url: Mapped[str | None] = mapped_column(Text, nullable=True)
    ssl_valid: Mapped[bool | None] = mapped_column(nullable=True)
    platform: Mapped[str | None] = mapped_column(String(100), nullable=True)
    has_online_ordering: Mapped[bool | None] = mapped_column(nullable=True)
    error: Mapped[str | None] = mapped_column(Text, nullable=True)
    checked_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now()
    )

    restaurant: Mapped["Restaurant"] = relationship()
