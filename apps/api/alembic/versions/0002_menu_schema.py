"""Add menu schema

Revision ID: 0002
Revises: 0001
Create Date: 2026-02-06
"""

from typing import Sequence, Union

import sqlalchemy as sa
from alembic import op
from sqlalchemy.dialects import postgresql

revision: str = "0002"
down_revision: Union[str, None] = "0001"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.execute("CREATE EXTENSION IF NOT EXISTS pgcrypto")

    op.create_table(
        "menus",
        sa.Column(
            "id",
            postgresql.UUID(as_uuid=True),
            primary_key=True,
            server_default=sa.text("gen_random_uuid()"),
        ),
        sa.Column(
            "restaurant_location_id",
            postgresql.UUID(as_uuid=True),
            sa.ForeignKey("restaurant_locations.id", ondelete="CASCADE"),
            nullable=False,
        ),
        sa.Column("name", sa.String(200), nullable=False),
        sa.Column("is_active", sa.Boolean(), server_default="true"),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.func.now()),
        sa.Column("updated_at", sa.DateTime(timezone=True), server_default=sa.func.now()),
    )
    op.create_index("ix_menus_location", "menus", ["restaurant_location_id"])

    op.create_table(
        "menu_categories",
        sa.Column(
            "id",
            postgresql.UUID(as_uuid=True),
            primary_key=True,
            server_default=sa.text("gen_random_uuid()"),
        ),
        sa.Column(
            "menu_id",
            postgresql.UUID(as_uuid=True),
            sa.ForeignKey("menus.id", ondelete="CASCADE"),
            nullable=False,
        ),
        sa.Column("name", sa.String(200), nullable=False),
        sa.Column("description", sa.Text(), nullable=True),
        sa.Column("sort_order", sa.Integer(), server_default="0"),
        sa.Column("is_active", sa.Boolean(), server_default="true"),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.func.now()),
        sa.Column("updated_at", sa.DateTime(timezone=True), server_default=sa.func.now()),
    )
    op.create_index("ix_menu_categories_menu", "menu_categories", ["menu_id"])

    op.create_table(
        "menu_items",
        sa.Column(
            "id",
            postgresql.UUID(as_uuid=True),
            primary_key=True,
            server_default=sa.text("gen_random_uuid()"),
        ),
        sa.Column(
            "menu_category_id",
            postgresql.UUID(as_uuid=True),
            sa.ForeignKey("menu_categories.id", ondelete="CASCADE"),
            nullable=False,
        ),
        sa.Column("name", sa.String(200), nullable=False),
        sa.Column("description", sa.Text(), nullable=True),
        sa.Column("price_cents", sa.Integer(), nullable=False),
        sa.Column("sort_order", sa.Integer(), server_default="0"),
        sa.Column("is_active", sa.Boolean(), server_default="true"),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.func.now()),
        sa.Column("updated_at", sa.DateTime(timezone=True), server_default=sa.func.now()),
    )
    op.create_index("ix_menu_items_category", "menu_items", ["menu_category_id"])

    op.create_table(
        "modifier_groups",
        sa.Column(
            "id",
            postgresql.UUID(as_uuid=True),
            primary_key=True,
            server_default=sa.text("gen_random_uuid()"),
        ),
        sa.Column("name", sa.String(200), nullable=False),
        sa.Column("description", sa.Text(), nullable=True),
        sa.Column("min_select", sa.Integer(), server_default="0"),
        sa.Column("max_select", sa.Integer(), server_default="0"),
        sa.Column("is_required", sa.Boolean(), server_default="false"),
        sa.Column("sort_order", sa.Integer(), server_default="0"),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.func.now()),
        sa.Column("updated_at", sa.DateTime(timezone=True), server_default=sa.func.now()),
    )

    op.create_table(
        "modifier_options",
        sa.Column(
            "id",
            postgresql.UUID(as_uuid=True),
            primary_key=True,
            server_default=sa.text("gen_random_uuid()"),
        ),
        sa.Column(
            "modifier_group_id",
            postgresql.UUID(as_uuid=True),
            sa.ForeignKey("modifier_groups.id", ondelete="CASCADE"),
            nullable=False,
        ),
        sa.Column("name", sa.String(200), nullable=False),
        sa.Column("price_cents", sa.Integer(), server_default="0"),
        sa.Column("is_default", sa.Boolean(), server_default="false"),
        sa.Column("sort_order", sa.Integer(), server_default="0"),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.func.now()),
        sa.Column("updated_at", sa.DateTime(timezone=True), server_default=sa.func.now()),
    )
    op.create_index("ix_modifier_options_group", "modifier_options", ["modifier_group_id"])

    op.create_table(
        "menu_item_modifier_groups",
        sa.Column(
            "menu_item_id",
            postgresql.UUID(as_uuid=True),
            sa.ForeignKey("menu_items.id", ondelete="CASCADE"),
            primary_key=True,
        ),
        sa.Column(
            "modifier_group_id",
            postgresql.UUID(as_uuid=True),
            sa.ForeignKey("modifier_groups.id", ondelete="CASCADE"),
            primary_key=True,
        ),
        sa.Column("sort_order", sa.Integer(), server_default="0"),
    )
    op.create_index(
        "ix_menu_item_modifier_groups_item",
        "menu_item_modifier_groups",
        ["menu_item_id"],
    )
    op.create_index(
        "ix_menu_item_modifier_groups_group",
        "menu_item_modifier_groups",
        ["modifier_group_id"],
    )


def downgrade() -> None:
    op.drop_index("ix_menu_item_modifier_groups_group", table_name="menu_item_modifier_groups")
    op.drop_index("ix_menu_item_modifier_groups_item", table_name="menu_item_modifier_groups")
    op.drop_table("menu_item_modifier_groups")
    op.drop_index("ix_modifier_options_group", table_name="modifier_options")
    op.drop_table("modifier_options")
    op.drop_table("modifier_groups")
    op.drop_index("ix_menu_items_category", table_name="menu_items")
    op.drop_table("menu_items")
    op.drop_index("ix_menu_categories_menu", table_name="menu_categories")
    op.drop_table("menu_categories")
    op.drop_index("ix_menus_location", table_name="menus")
    op.drop_table("menus")
