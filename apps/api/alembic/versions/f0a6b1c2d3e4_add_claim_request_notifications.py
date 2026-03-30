"""Add claim request notification tracking.

Revision ID: f0a6b1c2d3e4
Revises: c1f6a9d2b7e4
Create Date: 2026-03-20
"""

from typing import Sequence, Union

import sqlalchemy as sa
from alembic import op
from sqlalchemy.dialects import postgresql

revision: str = "f0a6b1c2d3e4"
down_revision: Union[str, None] = "c1f6a9d2b7e4"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.create_table(
        "claim_request_notifications",
        sa.Column(
            "id",
            postgresql.UUID(as_uuid=True),
            nullable=False,
        ),
        sa.Column(
            "claim_request_id",
            postgresql.UUID(as_uuid=True),
            nullable=False,
        ),
        sa.Column("event_key", sa.String(length=64), nullable=False),
        sa.Column(
            "channel",
            sa.String(length=20),
            nullable=False,
            server_default="email",
        ),
        sa.Column("recipient", sa.String(length=255), nullable=False),
        sa.Column("status", sa.String(length=20), nullable=False),
        sa.Column("launch_access_token", sa.String(length=255), nullable=True),
        sa.Column("sent_at", sa.DateTime(timezone=True), nullable=True),
        sa.Column("last_error", sa.Text(), nullable=True),
        sa.Column(
            "created_at",
            sa.DateTime(timezone=True),
            nullable=False,
            server_default=sa.text("now()"),
        ),
        sa.Column(
            "updated_at",
            sa.DateTime(timezone=True),
            nullable=False,
            server_default=sa.text("now()"),
        ),
        sa.ForeignKeyConstraint(
            ["claim_request_id"],
            ["claim_requests.id"],
            ondelete="CASCADE",
        ),
        sa.PrimaryKeyConstraint("id"),
        sa.UniqueConstraint(
            "claim_request_id",
            "event_key",
            "channel",
            name="uq_claim_request_notifications_event_channel",
        ),
    )
    op.create_index(
        "ix_claim_request_notifications_claim_request_id",
        "claim_request_notifications",
        ["claim_request_id"],
        unique=False,
    )
    op.create_index(
        "ix_claim_request_notifications_event_key",
        "claim_request_notifications",
        ["event_key"],
        unique=False,
    )


def downgrade() -> None:
    op.drop_index(
        "ix_claim_request_notifications_event_key",
        table_name="claim_request_notifications",
    )
    op.drop_index(
        "ix_claim_request_notifications_claim_request_id",
        table_name="claim_request_notifications",
    )
    op.drop_table("claim_request_notifications")
