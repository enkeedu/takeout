"""Add fetch_metros table for metro area management and fetch state tracking

Revision ID: 0003
Revises: 0002
Create Date: 2026-02-06
"""

from typing import Sequence, Union

import sqlalchemy as sa
from alembic import op
from sqlalchemy.dialects import postgresql

revision: str = "0003"
down_revision: Union[str, None] = "0002"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None

# All 70 metro areas: (name, state, lat, lng, radius_km)
SEED_METROS = [
    # Northeast
    ("New York", "NY", 40.7128, -74.0060, 25),
    ("Philadelphia", "PA", 39.9526, -75.1652, 20),
    ("Boston", "MA", 42.3601, -71.0589, 15),
    ("Newark", "NJ", 40.7357, -74.1724, 10),
    ("Jersey City", "NJ", 40.7178, -74.0431, 8),
    ("Pittsburgh", "PA", 40.4406, -79.9959, 12),
    ("Hartford", "CT", 41.7658, -72.6734, 10),
    ("Providence", "RI", 41.8240, -71.4128, 10),
    ("New Haven", "CT", 41.3083, -72.9279, 8),
    ("Albany", "NY", 42.6526, -73.7562, 10),
    ("Buffalo", "NY", 42.8864, -78.8784, 10),
    ("Rochester", "NY", 43.1566, -77.6088, 10),
    ("Syracuse", "NY", 43.0481, -76.1474, 8),
    ("Stamford", "CT", 41.0534, -73.5387, 8),
    # Southeast
    ("Washington", "DC", 38.9072, -77.0369, 20),
    ("Atlanta", "GA", 33.7490, -84.3880, 20),
    ("Miami", "FL", 25.7617, -80.1918, 18),
    ("Orlando", "FL", 28.5383, -81.3792, 15),
    ("Tampa", "FL", 27.9506, -82.4572, 15),
    ("Charlotte", "NC", 35.2271, -80.8431, 15),
    ("Raleigh", "NC", 35.7796, -78.6382, 12),
    ("Nashville", "TN", 36.1627, -86.7816, 15),
    ("Jacksonville", "FL", 30.3322, -81.6557, 15),
    ("Richmond", "VA", 37.5407, -77.4360, 12),
    ("Virginia Beach", "VA", 36.8529, -75.9780, 10),
    ("Baltimore", "MD", 39.2904, -76.6122, 15),
    # Midwest
    ("Chicago", "IL", 41.8781, -87.6298, 25),
    ("Detroit", "MI", 42.3314, -83.0458, 18),
    ("Minneapolis", "MN", 44.9778, -93.2650, 15),
    ("Columbus", "OH", 39.9612, -82.9988, 15),
    ("Cleveland", "OH", 41.4993, -81.6944, 12),
    ("Cincinnati", "OH", 39.1031, -84.5120, 12),
    ("Indianapolis", "IN", 39.7684, -86.1581, 15),
    ("Milwaukee", "WI", 43.0389, -87.9065, 12),
    ("Kansas City", "MO", 39.0997, -94.5786, 15),
    ("St. Louis", "MO", 38.6270, -90.1994, 15),
    ("Madison", "WI", 43.0731, -89.4012, 10),
    ("Ann Arbor", "MI", 42.2808, -83.7430, 8),
    # Southwest
    ("Houston", "TX", 29.7604, -95.3698, 25),
    ("Dallas", "TX", 32.7767, -96.7970, 22),
    ("San Antonio", "TX", 29.4241, -98.4936, 18),
    ("Austin", "TX", 30.2672, -97.7431, 15),
    ("Phoenix", "AZ", 33.4484, -112.0740, 22),
    ("Las Vegas", "NV", 36.1699, -115.1398, 18),
    ("Denver", "CO", 39.7392, -104.9903, 18),
    ("Fort Worth", "TX", 32.7555, -97.3308, 15),
    ("El Paso", "TX", 31.7619, -106.4850, 12),
    ("Tucson", "AZ", 32.2226, -110.9747, 12),
    ("Albuquerque", "NM", 35.0844, -106.6504, 12),
    ("Colorado Springs", "CO", 38.8339, -104.8214, 10),
    # West Coast
    ("Los Angeles", "CA", 34.0522, -118.2437, 30),
    ("San Francisco", "CA", 37.7749, -122.4194, 12),
    ("San Jose", "CA", 37.3382, -121.8863, 15),
    ("San Diego", "CA", 32.7157, -117.1611, 18),
    ("Seattle", "WA", 47.6062, -122.3321, 15),
    ("Portland", "OR", 45.5152, -122.6784, 15),
    ("Sacramento", "CA", 38.5816, -121.4944, 15),
    ("Oakland", "CA", 37.8044, -122.2712, 10),
    ("Fremont", "CA", 37.5485, -121.9886, 10),
    ("Irvine", "CA", 33.6846, -117.8265, 10),
    ("Bellevue", "WA", 47.6101, -122.2015, 8),
    # Additional metros
    ("Salt Lake City", "UT", 40.7608, -111.8910, 15),
    ("Honolulu", "HI", 21.3069, -157.8583, 12),
    ("Anchorage", "AK", 61.2181, -149.9003, 10),
    ("Oklahoma City", "OK", 35.4676, -97.5164, 15),
    ("Memphis", "TN", 35.1495, -90.0490, 12),
    ("Louisville", "KY", 38.2527, -85.7585, 12),
    ("New Orleans", "LA", 29.9511, -90.0715, 12),
    ("Omaha", "NE", 41.2565, -95.9345, 10),
    ("Boise", "ID", 43.6150, -116.2023, 10),
]


def upgrade() -> None:
    fetch_metros = op.create_table(
        "fetch_metros",
        sa.Column(
            "id",
            postgresql.UUID(as_uuid=True),
            primary_key=True,
            server_default=sa.text("gen_random_uuid()"),
        ),
        sa.Column("name", sa.String(100), nullable=False),
        sa.Column("state", sa.String(2), nullable=False),
        sa.Column("lat", sa.Float(), nullable=False),
        sa.Column("lng", sa.Float(), nullable=False),
        sa.Column("radius_km", sa.Float(), nullable=False),
        sa.Column(
            "is_active", sa.Boolean(), nullable=False, server_default="true"
        ),
        sa.Column(
            "completed_cells",
            postgresql.JSONB(),
            nullable=False,
            server_default=sa.text("'[]'::jsonb"),
        ),
        sa.Column(
            "total_api_calls", sa.Integer(), nullable=False, server_default="0"
        ),
        sa.Column(
            "total_restaurants",
            sa.Integer(),
            nullable=False,
            server_default="0",
        ),
        sa.Column(
            "fetch_started_at", sa.DateTime(timezone=True), nullable=True
        ),
        sa.Column(
            "fetch_completed_at", sa.DateTime(timezone=True), nullable=True
        ),
        sa.Column(
            "created_at",
            sa.DateTime(timezone=True),
            server_default=sa.func.now(),
        ),
        sa.Column(
            "updated_at",
            sa.DateTime(timezone=True),
            server_default=sa.func.now(),
        ),
    )

    op.create_unique_constraint(
        "uq_fetch_metro_name_state", "fetch_metros", ["name", "state"]
    )
    op.create_index("ix_fetch_metros_state", "fetch_metros", ["state"])

    # Seed the 70 metro areas
    op.bulk_insert(
        fetch_metros,
        [
            {
                "name": name,
                "state": state,
                "lat": lat,
                "lng": lng,
                "radius_km": radius_km,
            }
            for name, state, lat, lng, radius_km in SEED_METROS
        ],
    )


def downgrade() -> None:
    op.drop_index("ix_fetch_metros_state", table_name="fetch_metros")
    op.drop_constraint(
        "uq_fetch_metro_name_state", "fetch_metros", type_="unique"
    )
    op.drop_table("fetch_metros")
