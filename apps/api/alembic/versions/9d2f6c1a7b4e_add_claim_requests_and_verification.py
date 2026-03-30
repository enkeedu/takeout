"""Add claim requests and verification sessions.

Revision ID: 9d2f6c1a7b4e
Revises: 7f9b2d31c4aa
Create Date: 2026-03-05
"""

from typing import Sequence, Union

import sqlalchemy as sa
from alembic import op
from sqlalchemy.dialects import postgresql

revision: str = "9d2f6c1a7b4e"
down_revision: Union[str, None] = "7f9b2d31c4aa"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.create_table(
        "claim_verification_sessions",
        sa.Column("id", postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column("restaurant_id", postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column("destination_phone", sa.String(length=32), nullable=False),
        sa.Column("requested_ip", sa.String(length=64), nullable=True),
        sa.Column("provider", sa.String(length=20), nullable=False),
        sa.Column("provider_sid", sa.String(length=255), nullable=True),
        sa.Column("status", sa.String(length=40), nullable=False, server_default="sent"),
        sa.Column("attempt_count", sa.Integer(), nullable=False, server_default="0"),
        sa.Column("code_hash", sa.String(length=64), nullable=True),
        sa.Column("expires_at", sa.DateTime(timezone=True), nullable=True),
        sa.Column("verified_at", sa.DateTime(timezone=True), nullable=True),
        sa.Column("verification_token_hash", sa.String(length=64), nullable=True),
        sa.Column(
            "verification_token_expires_at", sa.DateTime(timezone=True), nullable=True
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
    )
    op.create_index(
        "ix_claim_verification_sessions_restaurant_id",
        "claim_verification_sessions",
        ["restaurant_id"],
        unique=False,
    )
    op.create_index(
        "ix_claim_verification_sessions_created_at",
        "claim_verification_sessions",
        ["created_at"],
        unique=False,
    )
    op.create_index(
        "ix_claim_verification_sessions_verification_token_hash",
        "claim_verification_sessions",
        ["verification_token_hash"],
        unique=True,
    )

    op.create_table(
        "claim_requests",
        sa.Column("id", postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column("restaurant_id", postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column("verification_session_id", postgresql.UUID(as_uuid=True), nullable=True),
        sa.Column("owner_name", sa.String(length=255), nullable=False),
        sa.Column("owner_phone", sa.String(length=32), nullable=False),
        sa.Column("owner_email", sa.String(length=255), nullable=False),
        sa.Column("preferred_contact_method", sa.String(length=20), nullable=False),
        sa.Column("template_key", sa.String(length=40), nullable=False),
        sa.Column("menu_confirmed", sa.Boolean(), nullable=False, server_default="false"),
        sa.Column(
            "hours_contact_confirmed",
            sa.Boolean(),
            nullable=False,
            server_default="false",
        ),
        sa.Column("verification_method", sa.String(length=20), nullable=False),
        sa.Column("verification_status", sa.String(length=40), nullable=False),
        sa.Column("manual_review_reason", sa.Text(), nullable=True),
        sa.Column("status", sa.String(length=40), nullable=False, server_default="new"),
        sa.Column(
            "created_at",
            sa.DateTime(timezone=True),
            nullable=False,
            server_default=sa.func.now(),
        ),
        sa.Column(
            "submitted_at",
            sa.DateTime(timezone=True),
            nullable=False,
            server_default=sa.func.now(),
        ),
        sa.ForeignKeyConstraint(
            ["restaurant_id"], ["restaurants.id"], ondelete="CASCADE"
        ),
        sa.ForeignKeyConstraint(
            ["verification_session_id"],
            ["claim_verification_sessions.id"],
            ondelete="SET NULL",
        ),
        sa.PrimaryKeyConstraint("id"),
        sa.UniqueConstraint(
            "verification_session_id",
            name="uq_claim_requests_verification_session_id",
        ),
    )
    op.create_index(
        "ix_claim_requests_restaurant_id",
        "claim_requests",
        ["restaurant_id"],
        unique=False,
    )
    op.create_index(
        "ix_claim_requests_status",
        "claim_requests",
        ["status"],
        unique=False,
    )


def downgrade() -> None:
    op.drop_index("ix_claim_requests_status", table_name="claim_requests")
    op.drop_index("ix_claim_requests_restaurant_id", table_name="claim_requests")
    op.drop_table("claim_requests")

    op.drop_index(
        "ix_claim_verification_sessions_verification_token_hash",
        table_name="claim_verification_sessions",
    )
    op.drop_index(
        "ix_claim_verification_sessions_created_at",
        table_name="claim_verification_sessions",
    )
    op.drop_index(
        "ix_claim_verification_sessions_restaurant_id",
        table_name="claim_verification_sessions",
    )
    op.drop_table("claim_verification_sessions")
