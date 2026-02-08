"""Add template key and order item modifiers

Revision ID: 0004
Revises: 0003
Create Date: 2026-02-07
"""

from typing import Sequence, Union

import sqlalchemy as sa
from alembic import op
from sqlalchemy.dialects import postgresql

revision: str = "0004"
down_revision: Union[str, None] = "0003"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.add_column(
        "restaurant_locations",
        sa.Column("template_key", sa.String(length=40), nullable=True),
    )
    op.add_column(
        "order_items",
        sa.Column(
            "modifiers_json",
            postgresql.JSONB(astext_type=sa.Text()),
            nullable=False,
            server_default=sa.text("'[]'::jsonb"),
        ),
    )


def downgrade() -> None:
    op.drop_column("order_items", "modifiers_json")
    op.drop_column("restaurant_locations", "template_key")
