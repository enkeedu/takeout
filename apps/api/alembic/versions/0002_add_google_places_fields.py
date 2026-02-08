"""Add Google Places fields: rating, price_level, service flags

Revision ID: 0002
Revises: 0001
Create Date: 2026-02-06
"""

from typing import Sequence, Union

import sqlalchemy as sa
from alembic import op

revision: str = "0002"
down_revision: Union[str, None] = "0001"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # restaurants table
    op.add_column("restaurants", sa.Column("google_place_id", sa.String(255), nullable=True))
    op.add_column("restaurants", sa.Column("rating", sa.Float(), nullable=True))
    op.add_column("restaurants", sa.Column("user_rating_count", sa.Integer(), nullable=True))
    op.add_column("restaurants", sa.Column("price_level", sa.String(50), nullable=True))
    op.add_column("restaurants", sa.Column("google_maps_uri", sa.Text(), nullable=True))
    op.create_index("ix_restaurants_google_place_id", "restaurants", ["google_place_id"], unique=True)

    # restaurant_locations table
    op.add_column("restaurant_locations", sa.Column("has_takeout", sa.Boolean(), nullable=True))
    op.add_column("restaurant_locations", sa.Column("has_delivery", sa.Boolean(), nullable=True))
    op.add_column("restaurant_locations", sa.Column("has_dine_in", sa.Boolean(), nullable=True))
    op.add_column("restaurant_locations", sa.Column("business_status", sa.String(50), nullable=True))


def downgrade() -> None:
    op.drop_column("restaurant_locations", "business_status")
    op.drop_column("restaurant_locations", "has_dine_in")
    op.drop_column("restaurant_locations", "has_delivery")
    op.drop_column("restaurant_locations", "has_takeout")

    op.drop_index("ix_restaurants_google_place_id", "restaurants")
    op.drop_column("restaurants", "google_maps_uri")
    op.drop_column("restaurants", "price_level")
    op.drop_column("restaurants", "user_rating_count")
    op.drop_column("restaurants", "rating")
    op.drop_column("restaurants", "google_place_id")
