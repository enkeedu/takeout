"""Initial schema: restaurants, locations, slugs with full-text search

Revision ID: 0001
Revises:
Create Date: 2026-02-05
"""

from typing import Sequence, Union

import sqlalchemy as sa
from alembic import op
from sqlalchemy.dialects import postgresql

revision: str = "0001"
down_revision: Union[str, None] = None
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.execute("CREATE EXTENSION IF NOT EXISTS pgcrypto")

    # 1. restaurants
    op.create_table(
        "restaurants",
        sa.Column("id", postgresql.UUID(as_uuid=True), primary_key=True, server_default=sa.text("gen_random_uuid()")),
        sa.Column("name", sa.Text(), nullable=False),
        sa.Column("phone", sa.String(20), nullable=True),
        sa.Column("website_url", sa.Text(), nullable=True),
        sa.Column("has_online_ordering", sa.Boolean(), server_default="false"),
        sa.Column("has_ai_phone", sa.Boolean(), server_default="false"),
        sa.Column("is_claimed", sa.Boolean(), server_default="false"),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.func.now()),
        sa.Column("updated_at", sa.DateTime(timezone=True), server_default=sa.func.now()),
    )

    # 2. restaurant_locations
    op.create_table(
        "restaurant_locations",
        sa.Column("id", postgresql.UUID(as_uuid=True), primary_key=True, server_default=sa.text("gen_random_uuid()")),
        sa.Column("restaurant_id", postgresql.UUID(as_uuid=True), sa.ForeignKey("restaurants.id", ondelete="CASCADE"), nullable=False),
        sa.Column("address1", sa.Text(), nullable=False),
        sa.Column("address2", sa.Text(), nullable=True),
        sa.Column("city", sa.String(100), nullable=False),
        sa.Column("state", sa.String(2), nullable=False),
        sa.Column("zip", sa.String(10), nullable=False),
        sa.Column("lat", sa.Float(), nullable=True),
        sa.Column("lng", sa.Float(), nullable=True),
        sa.Column("timezone", sa.String(50), server_default="America/New_York"),
        sa.Column("hours_json", postgresql.JSONB(), nullable=True),
        sa.Column("search_vector", postgresql.TSVECTOR(), nullable=True),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.func.now()),
        sa.Column("updated_at", sa.DateTime(timezone=True), server_default=sa.func.now()),
    )
    op.create_index("ix_location_state_city", "restaurant_locations", ["state", "city"])
    op.create_index("ix_location_search_vector", "restaurant_locations", ["search_vector"], postgresql_using="gin")

    # 3. restaurant_slugs
    op.create_table(
        "restaurant_slugs",
        sa.Column("id", postgresql.UUID(as_uuid=True), primary_key=True, server_default=sa.text("gen_random_uuid()")),
        sa.Column("restaurant_location_id", postgresql.UUID(as_uuid=True), sa.ForeignKey("restaurant_locations.id", ondelete="CASCADE"), nullable=False),
        sa.Column("state_slug", sa.String(2), nullable=False),
        sa.Column("city_slug", sa.String(200), nullable=False),
        sa.Column("restaurant_slug", sa.String(255), nullable=False),
        sa.Column("is_canonical", sa.Boolean(), server_default="true"),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.func.now()),
    )
    op.create_unique_constraint("uq_state_city_slug", "restaurant_slugs", ["state_slug", "city_slug", "restaurant_slug"])
    op.create_index("ix_slug_state_city", "restaurant_slugs", ["state_slug", "city_slug"])

    # 4. Full-text search trigger function
    op.execute("""
        CREATE OR REPLACE FUNCTION update_location_search_vector()
        RETURNS TRIGGER AS $$
        BEGIN
            NEW.search_vector := to_tsvector('english',
                coalesce((SELECT name FROM restaurants WHERE id = NEW.restaurant_id), '') || ' ' ||
                coalesce(NEW.city, '') || ' ' ||
                coalesce(NEW.state, '')
            );
            RETURN NEW;
        END;
        $$ LANGUAGE plpgsql;
    """)

    op.execute("""
        CREATE TRIGGER trg_update_search_vector
        BEFORE INSERT OR UPDATE ON restaurant_locations
        FOR EACH ROW EXECUTE FUNCTION update_location_search_vector();
    """)


def downgrade() -> None:
    op.execute("DROP TRIGGER IF EXISTS trg_update_search_vector ON restaurant_locations")
    op.execute("DROP FUNCTION IF EXISTS update_location_search_vector()")
    op.drop_table("restaurant_slugs")
    op.drop_table("restaurant_locations")
    op.drop_table("restaurants")
