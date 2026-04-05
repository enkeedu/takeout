"""Add unlisted owner requests.

Revision ID: f4d9c2b1a7e3
Revises: b1c2d3e4f5a6
Create Date: 2026-03-30
"""

from typing import Sequence, Union

import sqlalchemy as sa
from alembic import op
from sqlalchemy.dialects import postgresql

revision: str = "f4d9c2b1a7e3"
down_revision: Union[str, None] = "b1c2d3e4f5a6"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.create_table(
        "unlisted_owner_requests",
        sa.Column("id", postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column("restaurant_name", sa.String(length=255), nullable=False),
        sa.Column("city", sa.String(length=120), nullable=False),
        sa.Column("state", sa.String(length=64), nullable=False),
        sa.Column("restaurant_phone", sa.String(length=32), nullable=True),
        sa.Column("owner_name", sa.String(length=255), nullable=False),
        sa.Column("owner_phone", sa.String(length=32), nullable=False),
        sa.Column("owner_email", sa.String(length=255), nullable=False),
        sa.Column("preferred_contact_method", sa.String(length=20), nullable=False),
        sa.Column("website_url", sa.String(length=500), nullable=True),
        sa.Column("google_maps_url", sa.String(length=500), nullable=True),
        sa.Column("yelp_url", sa.String(length=500), nullable=True),
        sa.Column("notes", sa.Text(), nullable=True),
        sa.Column("source_path", sa.String(length=255), nullable=True),
        sa.Column("status", sa.String(length=32), server_default="new", nullable=False),
        sa.Column(
            "created_at",
            sa.DateTime(timezone=True),
            server_default=sa.func.now(),
            nullable=False,
        ),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index(
        "ix_unlisted_owner_requests_created_at",
        "unlisted_owner_requests",
        ["created_at"],
        unique=False,
    )
    op.create_index(
        "ix_unlisted_owner_requests_state",
        "unlisted_owner_requests",
        ["state"],
        unique=False,
    )
    op.create_index(
        "ix_unlisted_owner_requests_status",
        "unlisted_owner_requests",
        ["status"],
        unique=False,
    )


def downgrade() -> None:
    op.drop_index("ix_unlisted_owner_requests_status", table_name="unlisted_owner_requests")
    op.drop_index("ix_unlisted_owner_requests_state", table_name="unlisted_owner_requests")
    op.drop_index("ix_unlisted_owner_requests_created_at", table_name="unlisted_owner_requests")
    op.drop_table("unlisted_owner_requests")
