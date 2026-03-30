"""Add claim setup intake fields.

Revision ID: b1c2d3e4f5a6
Revises: a4f7d2c9e8b1
Create Date: 2026-03-20
"""

from typing import Sequence, Union

import sqlalchemy as sa
from alembic import op

revision: str = "b1c2d3e4f5a6"
down_revision: Union[str, None] = "a4f7d2c9e8b1"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.add_column(
        "claim_requests",
        sa.Column("setup_intake", sa.JSON(), nullable=True),
    )
    op.add_column(
        "claim_requests",
        sa.Column("setup_intake_submitted_at", sa.DateTime(timezone=True), nullable=True),
    )


def downgrade() -> None:
    op.drop_column("claim_requests", "setup_intake_submitted_at")
    op.drop_column("claim_requests", "setup_intake")
