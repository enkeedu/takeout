"""add_website_audits

Revision ID: bc60a95d9f2a
Revises: 0003
Create Date: 2026-02-08 02:18:03.396559

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = 'bc60a95d9f2a'
down_revision: Union[str, None] = '0003'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.create_table('website_audits',
    sa.Column('id', sa.UUID(), nullable=False),
    sa.Column('restaurant_id', sa.UUID(), nullable=False),
    sa.Column('url_checked', sa.Text(), nullable=False),
    sa.Column('http_status', sa.Integer(), nullable=True),
    sa.Column('redirect_url', sa.Text(), nullable=True),
    sa.Column('ssl_valid', sa.Boolean(), nullable=True),
    sa.Column('platform', sa.String(length=100), nullable=True),
    sa.Column('has_online_ordering', sa.Boolean(), nullable=True),
    sa.Column('error', sa.Text(), nullable=True),
    sa.Column('checked_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=False),
    sa.ForeignKeyConstraint(['restaurant_id'], ['restaurants.id'], ondelete='CASCADE'),
    sa.PrimaryKeyConstraint('id')
    )
    op.create_index(op.f('ix_website_audits_restaurant_id'), 'website_audits', ['restaurant_id'], unique=False)


def downgrade() -> None:
    op.drop_index(op.f('ix_website_audits_restaurant_id'), table_name='website_audits')
    op.drop_table('website_audits')
