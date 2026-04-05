"""Add owner site profiles.

Revision ID: 9a1d4c7e2b11
Revises: f4d9c2b1a7e3
Create Date: 2026-03-30
"""

from typing import Sequence, Union

import sqlalchemy as sa
from alembic import op
from sqlalchemy.dialects import postgresql

revision: str = "9a1d4c7e2b11"
down_revision: Union[str, None] = "f4d9c2b1a7e3"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.create_table(
        "owner_site_profiles",
        sa.Column("id", postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column("restaurant_id", postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column("claim_request_id", postgresql.UUID(as_uuid=True), nullable=True),
        sa.Column("business_name", sa.Text(), nullable=True),
        sa.Column("phone", sa.String(length=32), nullable=True),
        sa.Column("address1", sa.Text(), nullable=True),
        sa.Column("address2", sa.Text(), nullable=True),
        sa.Column("city", sa.String(length=120), nullable=True),
        sa.Column("state", sa.String(length=64), nullable=True),
        sa.Column("zip", sa.String(length=20), nullable=True),
        sa.Column("short_description", sa.Text(), nullable=True),
        sa.Column("logo_url", sa.Text(), nullable=True),
        sa.Column("photo_urls", sa.JSON(), nullable=True),
        sa.Column("menu_image_urls", sa.JSON(), nullable=True),
        sa.Column("template_key", sa.String(length=40), nullable=True),
        sa.Column("hours_json", sa.JSON(), nullable=True),
        sa.Column("is_published", sa.Boolean(), server_default="false", nullable=False),
        sa.Column("published_at", sa.DateTime(timezone=True), nullable=True),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
        sa.Column("updated_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
        sa.ForeignKeyConstraint(["claim_request_id"], ["claim_requests.id"], ondelete="SET NULL"),
        sa.ForeignKeyConstraint(["restaurant_id"], ["restaurants.id"], ondelete="CASCADE"),
        sa.PrimaryKeyConstraint("id"),
        sa.UniqueConstraint("restaurant_id"),
    )
    op.create_index("ix_owner_site_profiles_restaurant_id", "owner_site_profiles", ["restaurant_id"], unique=False)
    op.create_index("ix_owner_site_profiles_claim_request_id", "owner_site_profiles", ["claim_request_id"], unique=False)
    op.create_index("ix_owner_site_profiles_is_published", "owner_site_profiles", ["is_published"], unique=False)


def downgrade() -> None:
    op.drop_index("ix_owner_site_profiles_is_published", table_name="owner_site_profiles")
    op.drop_index("ix_owner_site_profiles_claim_request_id", table_name="owner_site_profiles")
    op.drop_index("ix_owner_site_profiles_restaurant_id", table_name="owner_site_profiles")
    op.drop_table("owner_site_profiles")
