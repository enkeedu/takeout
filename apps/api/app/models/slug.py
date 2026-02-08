import uuid
from datetime import datetime

from sqlalchemy import Boolean, DateTime, ForeignKey, Index, String, UniqueConstraint, func
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.models.base import Base


class RestaurantSlug(Base):
    __tablename__ = "restaurant_slugs"

    id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), primary_key=True, default=uuid.uuid4
    )
    restaurant_location_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("restaurant_locations.id", ondelete="CASCADE"),
        nullable=False,
    )
    state_slug: Mapped[str] = mapped_column(String(2), nullable=False)
    city_slug: Mapped[str] = mapped_column(String(200), nullable=False)
    restaurant_slug: Mapped[str] = mapped_column(String(255), nullable=False)
    is_canonical: Mapped[bool] = mapped_column(Boolean, server_default="true")
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now()
    )

    location: Mapped["RestaurantLocation"] = relationship(back_populates="slugs")

    __table_args__ = (
        UniqueConstraint(
            "state_slug", "city_slug", "restaurant_slug", name="uq_state_city_slug"
        ),
        Index("ix_slug_state_city", "state_slug", "city_slug"),
    )
