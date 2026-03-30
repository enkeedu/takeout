"""Add claim deposit, access token, and kickoff fields.

Revision ID: c1f6a9d2b7e4
Revises: 9d2f6c1a7b4e
Create Date: 2026-03-19
"""

from typing import Sequence, Union

import sqlalchemy as sa
from alembic import op

revision: str = "c1f6a9d2b7e4"
down_revision: Union[str, None] = "9d2f6c1a7b4e"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.add_column(
        "claim_requests",
        sa.Column("access_token_hash", sa.String(length=64), nullable=True),
    )
    op.add_column(
        "claim_requests",
        sa.Column("launch_terms_accepted_at", sa.DateTime(timezone=True), nullable=True),
    )
    op.add_column(
        "claim_requests",
        sa.Column("setup_deposit_cents", sa.Integer(), nullable=True),
    )
    op.add_column(
        "claim_requests",
        sa.Column("monthly_plan_cents", sa.Integer(), nullable=True),
    )
    op.add_column(
        "claim_requests",
        sa.Column("currency", sa.String(length=8), nullable=True),
    )
    op.add_column(
        "claim_requests",
        sa.Column(
            "setup_deposit_state",
            sa.String(length=20),
            nullable=False,
            server_default="pending",
        ),
    )
    op.add_column(
        "claim_requests",
        sa.Column("setup_deposit_paid_at", sa.DateTime(timezone=True), nullable=True),
    )
    op.add_column(
        "claim_requests",
        sa.Column("stripe_checkout_session_id", sa.String(length=255), nullable=True),
    )
    op.add_column(
        "claim_requests",
        sa.Column("stripe_payment_intent_id", sa.String(length=255), nullable=True),
    )
    op.add_column(
        "claim_requests",
        sa.Column("stripe_customer_id", sa.String(length=255), nullable=True),
    )
    op.add_column(
        "claim_requests",
        sa.Column(
            "kickoff_state",
            sa.String(length=20),
            nullable=False,
            server_default="pending",
        ),
    )
    op.add_column(
        "claim_requests",
        sa.Column("kickoff_scheduled_for", sa.DateTime(timezone=True), nullable=True),
    )
    op.add_column(
        "claim_requests",
        sa.Column("monthly_billing_starts_at", sa.DateTime(timezone=True), nullable=True),
    )
    op.create_index(
        "ix_claim_requests_access_token_hash",
        "claim_requests",
        ["access_token_hash"],
        unique=False,
    )
    op.create_index(
        "ix_claim_requests_stripe_checkout_session_id",
        "claim_requests",
        ["stripe_checkout_session_id"],
        unique=True,
    )


def downgrade() -> None:
    op.drop_index(
        "ix_claim_requests_stripe_checkout_session_id",
        table_name="claim_requests",
    )
    op.drop_index("ix_claim_requests_access_token_hash", table_name="claim_requests")
    op.drop_column("claim_requests", "monthly_billing_starts_at")
    op.drop_column("claim_requests", "kickoff_scheduled_for")
    op.drop_column("claim_requests", "kickoff_state")
    op.drop_column("claim_requests", "stripe_customer_id")
    op.drop_column("claim_requests", "stripe_payment_intent_id")
    op.drop_column("claim_requests", "stripe_checkout_session_id")
    op.drop_column("claim_requests", "setup_deposit_paid_at")
    op.drop_column("claim_requests", "setup_deposit_state")
    op.drop_column("claim_requests", "currency")
    op.drop_column("claim_requests", "monthly_plan_cents")
    op.drop_column("claim_requests", "setup_deposit_cents")
    op.drop_column("claim_requests", "launch_terms_accepted_at")
    op.drop_column("claim_requests", "access_token_hash")
