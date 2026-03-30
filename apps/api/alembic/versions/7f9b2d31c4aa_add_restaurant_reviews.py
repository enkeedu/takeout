"""Add restaurant reviews cache table.

Revision ID: 7f9b2d31c4aa
Revises: e6c4a1f9b2d7
Create Date: 2026-02-20
"""

from typing import Sequence, Union

import sqlalchemy as sa
from alembic import op
from sqlalchemy.dialects import postgresql

revision: str = "7f9b2d31c4aa"
down_revision: Union[str, None] = "e6c4a1f9b2d7"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.create_table(
        "restaurant_reviews",
        sa.Column("id", postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column("restaurant_id", postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column("google_review_id", sa.String(length=255), nullable=True),
        sa.Column("reviewer_name", sa.String(length=255), nullable=False),
        sa.Column("rating", sa.Float(), nullable=True),
        sa.Column("quote", sa.Text(), nullable=False),
        sa.Column(
            "source", sa.String(length=50), nullable=False, server_default="Google"
        ),
        sa.Column("source_url", sa.Text(), nullable=True),
        sa.Column("relative_time", sa.String(length=100), nullable=True),
        sa.Column("published_at", sa.DateTime(timezone=True), nullable=True),
        sa.Column("sort_order", sa.Integer(), nullable=False, server_default="0"),
        sa.Column(
            "fetched_at",
            sa.DateTime(timezone=True),
            nullable=False,
            server_default=sa.func.now(),
        ),
        sa.Column(
            "created_at",
            sa.DateTime(timezone=True),
            nullable=False,
            server_default=sa.func.now(),
        ),
        sa.Column(
            "updated_at",
            sa.DateTime(timezone=True),
            nullable=False,
            server_default=sa.func.now(),
        ),
        sa.ForeignKeyConstraint(
            ["restaurant_id"], ["restaurants.id"], ondelete="CASCADE"
        ),
        sa.PrimaryKeyConstraint("id"),
        sa.UniqueConstraint(
            "restaurant_id",
            "google_review_id",
            name="uq_restaurant_reviews_restaurant_google",
        ),
    )
    op.create_index(
        "ix_restaurant_reviews_restaurant_id",
        "restaurant_reviews",
        ["restaurant_id"],
        unique=False,
    )


def downgrade() -> None:
    op.drop_index("ix_restaurant_reviews_restaurant_id", table_name="restaurant_reviews")
    op.drop_table("restaurant_reviews")
