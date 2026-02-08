"""
Seed sample menus for restaurants.

Usage:
    python -m scripts.seed_menus --all
    python -m scripts.seed_menus --state nj --city clinton --slug hunan-wok
    python -m scripts.seed_menus --state nj --force
"""

import argparse
import asyncio

from sqlalchemy import select

from app.database import async_session_maker
from app.models import RestaurantLocation, RestaurantSlug
from app.models.menu import (
    Menu,
    MenuCategory,
    MenuItem,
    MenuItemModifierGroup,
    ModifierGroup,
    ModifierOption,
)

BASE_MENU = [
    {
        "name": "Appetizers",
        "description": "Shareable starters and small bites.",
        "items": [
            {
                "name": "Crispy Spring Rolls",
                "description": "Cabbage, carrot, and glass noodle with sweet chili.",
                "price_cents": 650,
                "modifiers": [
                    {
                        "name": "Dipping Sauce",
                        "description": "Choose your sauce.",
                        "min_select": 1,
                        "max_select": 1,
                        "is_required": True,
                        "options": [
                            {"name": "Sweet Chili", "price_cents": 0, "is_default": True},
                            {"name": "Duck Sauce", "price_cents": 0, "is_default": False},
                            {"name": "Spicy Mustard", "price_cents": 0, "is_default": False},
                        ],
                    }
                ],
            },
            {
                "name": "Pan-Seared Potstickers",
                "description": "Pork and chive dumplings with black vinegar dip.",
                "price_cents": 800,
            },
            {
                "name": "Scallion Pancake",
                "description": "Flaky layers, sesame, served with soy ginger.",
                "price_cents": 700,
            },
        ],
    },
    {
        "name": "Noodles & Rice",
        "description": "Wok-fired classics.",
        "items": [
            {
                "name": "House Fried Rice",
                "description": "BBQ pork, egg, peas, scallion, and soy.",
                "price_cents": 1250,
                "modifiers": [
                    {
                        "name": "Protein Choice",
                        "description": "Pick your protein.",
                        "min_select": 1,
                        "max_select": 1,
                        "is_required": True,
                        "options": [
                            {"name": "Vegetable", "price_cents": 0, "is_default": True},
                            {"name": "Chicken", "price_cents": 150, "is_default": False},
                            {"name": "Beef", "price_cents": 250, "is_default": False},
                            {"name": "Shrimp", "price_cents": 300, "is_default": False},
                        ],
                    }
                ],
            },
            {
                "name": "Beef Chow Fun",
                "description": "Wide rice noodles, bean sprouts, scallion.",
                "price_cents": 1400,
            },
            {
                "name": "Vegetable Lo Mein",
                "description": "Cabbage, carrot, mushroom, garlic sauce.",
                "price_cents": 1150,
            },
        ],
    },
    {
        "name": "Chef's Specials",
        "description": "Signature dishes finished to order.",
        "items": [
            {
                "name": "Crispy Orange Chicken",
                "description": "Citrus glaze, toasted sesame, orange peel.",
                "price_cents": 1500,
            },
            {
                "name": "Kung Pao Chicken",
                "description": "Peanuts, bell pepper, Sichuan chili.",
                "price_cents": 1550,
                "modifiers": [
                    {
                        "name": "Spice Level",
                        "description": "Adjust heat level.",
                        "min_select": 1,
                        "max_select": 1,
                        "is_required": True,
                        "options": [
                            {"name": "Mild", "price_cents": 0, "is_default": True},
                            {"name": "Medium", "price_cents": 0, "is_default": False},
                            {"name": "Hot", "price_cents": 0, "is_default": False},
                        ],
                    }
                ],
            },
            {
                "name": "Beef & Broccoli",
                "description": "Oyster sauce, garlic, tender flank steak.",
                "price_cents": 1600,
            },
        ],
    },
]


async def fetch_locations(
    state: str | None,
    city: str | None,
    slug: str | None,
):
    query = (
        select(RestaurantLocation)
        .join(RestaurantSlug, RestaurantSlug.restaurant_location_id == RestaurantLocation.id)
        .where(RestaurantSlug.is_canonical.is_(True))
    )

    if state:
        query = query.where(RestaurantSlug.state_slug == state.lower())
    if city:
        query = query.where(RestaurantSlug.city_slug == city.lower())
    if slug:
        query = query.where(RestaurantSlug.restaurant_slug == slug.lower())

    async with async_session_maker() as session:
        result = await session.execute(query)
        return result.scalars().all()


async def seed_menu_for_location(location: RestaurantLocation, force: bool) -> bool:
    async with async_session_maker() as session:
        async with session.begin():
            existing = await session.execute(
                select(Menu).where(Menu.restaurant_location_id == location.id)
            )
            menu = existing.scalars().first()
            if menu and not force:
                return False
            if menu and force:
                await session.delete(menu)
                await session.flush()

            menu = Menu(
                restaurant_location_id=location.id,
                name="Main Menu",
                is_active=True,
            )
            session.add(menu)
            await session.flush()

            for cat_index, category in enumerate(BASE_MENU):
                menu_category = MenuCategory(
                    menu_id=menu.id,
                    name=category["name"],
                    description=category.get("description"),
                    sort_order=cat_index,
                    is_active=True,
                )
                session.add(menu_category)
                await session.flush()

                for item_index, item in enumerate(category["items"]):
                    menu_item = MenuItem(
                        menu_category_id=menu_category.id,
                        name=item["name"],
                        description=item.get("description"),
                        price_cents=item["price_cents"],
                        sort_order=item_index,
                        is_active=True,
                    )
                    session.add(menu_item)
                    await session.flush()

                    for group_index, group in enumerate(item.get("modifiers", [])):
                        modifier_group = ModifierGroup(
                            name=group["name"],
                            description=group.get("description"),
                            min_select=group.get("min_select", 0),
                            max_select=group.get("max_select", 0),
                            is_required=group.get("is_required", False),
                            sort_order=group_index,
                        )
                        session.add(modifier_group)
                        await session.flush()

                        session.add(
                            MenuItemModifierGroup(
                                menu_item_id=menu_item.id,
                                modifier_group_id=modifier_group.id,
                                sort_order=group_index,
                            )
                        )

                        for option_index, option in enumerate(group.get("options", [])):
                            session.add(
                                ModifierOption(
                                    modifier_group_id=modifier_group.id,
                                    name=option["name"],
                                    price_cents=option.get("price_cents", 0),
                                    is_default=option.get("is_default", False),
                                    sort_order=option_index,
                                )
                            )

        return True


async def main() -> None:
    parser = argparse.ArgumentParser(description="Seed sample menus")
    parser.add_argument("--all", action="store_true", help="Seed all restaurants")
    parser.add_argument("--state", type=str, help="State slug (e.g. nj)")
    parser.add_argument("--city", type=str, help="City slug (e.g. clinton)")
    parser.add_argument("--slug", type=str, help="Restaurant slug")
    parser.add_argument("--force", action="store_true", help="Replace existing menus")
    args = parser.parse_args()

    if not args.all and not (args.state and args.city and args.slug):
        raise SystemExit("Provide --all or --state/--city/--slug")

    locations = await fetch_locations(args.state, args.city, args.slug)
    if not locations:
        print("No matching restaurants found.")
        return

    created = 0
    skipped = 0
    for location in locations:
        seeded = await seed_menu_for_location(location, args.force)
        if seeded:
            created += 1
        else:
            skipped += 1

    print(f"Seeded menus: {created}. Skipped: {skipped}.")


if __name__ == "__main__":
    asyncio.run(main())
