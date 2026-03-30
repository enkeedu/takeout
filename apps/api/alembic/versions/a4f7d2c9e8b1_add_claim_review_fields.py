"""Add claim review decision fields.

Revision ID: a4f7d2c9e8b1
Revises: f0a6b1c2d3e4
Create Date: 2026-03-20
"""

from typing import Sequence, Union

import sqlalchemy as sa
from alembic import op

revision: str = "a4f7d2c9e8b1"
down_revision: Union[str, None] = "f0a6b1c2d3e4"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.add_column(
        "claim_requests",
        sa.Column("review_state", sa.String(length=30), nullable=True),
    )
    op.add_column(
        "claim_requests",
        sa.Column("review_responded_at", sa.DateTime(timezone=True), nullable=True),
    )
    op.add_column(
        "claim_requests",
        sa.Column("review_issue_areas", sa.JSON(), nullable=True),
    )
    op.add_column(
        "claim_requests",
        sa.Column("review_notes", sa.Text(), nullable=True),
    )


def downgrade() -> None:
    op.drop_column("claim_requests", "review_notes")
    op.drop_column("claim_requests", "review_issue_areas")
    op.drop_column("claim_requests", "review_responded_at")
    op.drop_column("claim_requests", "review_state")
