"""Merge website audit and menu/order/template heads.

Revision ID: e6c4a1f9b2d7
Revises: bc60a95d9f2a, 4d7f2a0b8c31
Create Date: 2026-02-08
"""

from typing import Sequence, Union

# revision identifiers, used by Alembic.
revision: str = "e6c4a1f9b2d7"
down_revision: Union[str, Sequence[str], None] = ("bc60a95d9f2a", "4d7f2a0b8c31")
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # Merge revision, no schema changes.
    pass


def downgrade() -> None:
    # Merge revision, no schema changes.
    pass
