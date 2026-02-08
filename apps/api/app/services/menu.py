from sqlalchemy import select, update
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.models import RestaurantLocation, RestaurantSlug
from app.models.menu import (
    Menu,
    MenuCategory,
    MenuItem,
    MenuItemModifierGroup,
    ModifierGroup,
)
from app.schemas.menu import (
    MenuCategoryOut,
    MenuItemOut,
    MenuOut,
    MenuUpsert,
    ModifierGroupOut,
    ModifierOptionOut,
)


def _build_menu_out(menu: Menu) -> MenuOut:
    categories: list[MenuCategoryOut] = []

    for category in menu.categories:
        if not category.is_active:
            continue

        items: list[MenuItemOut] = []
        for item in category.items:
            if not item.is_active:
                continue

            groups: list[ModifierGroupOut] = []
            for link in item.modifier_group_links:
                group = link.modifier_group
                options = [
                    ModifierOptionOut(
                        id=option.id,
                        name=option.name,
                        price_cents=option.price_cents,
                        is_default=option.is_default,
                        sort_order=option.sort_order,
                    )
                    for option in group.options
                ]
                groups.append(
                    ModifierGroupOut(
                        id=group.id,
                        name=group.name,
                        description=group.description,
                        min_select=group.min_select,
                        max_select=group.max_select,
                        is_required=group.is_required,
                        sort_order=group.sort_order,
                        options=options,
                    )
                )

            items.append(
                MenuItemOut(
                    id=item.id,
                    name=item.name,
                    description=item.description,
                    price_cents=item.price_cents,
                    sort_order=item.sort_order,
                    is_active=item.is_active,
                    modifier_groups=groups,
                )
            )

        categories.append(
            MenuCategoryOut(
                id=category.id,
                name=category.name,
                description=category.description,
                sort_order=category.sort_order,
                is_active=category.is_active,
                items=items,
            )
        )

    return MenuOut(
        id=menu.id,
        name=menu.name,
        is_active=menu.is_active,
        categories=categories,
    )


async def get_menu_for_restaurant(
    db: AsyncSession,
    state_slug: str,
    city_slug: str,
    restaurant_slug: str,
) -> MenuOut | None:
    query = (
        select(Menu)
        .join(RestaurantLocation, Menu.restaurant_location_id == RestaurantLocation.id)
        .join(
            RestaurantSlug,
            RestaurantSlug.restaurant_location_id == RestaurantLocation.id,
        )
        .where(
            RestaurantSlug.state_slug == state_slug.lower(),
            RestaurantSlug.city_slug == city_slug.lower(),
            RestaurantSlug.restaurant_slug == restaurant_slug.lower(),
            Menu.is_active.is_(True),
        )
        .order_by(Menu.created_at.desc())
        .options(
            selectinload(Menu.categories)
            .selectinload(MenuCategory.items)
            .selectinload(MenuItem.modifier_group_links)
            .selectinload(MenuItemModifierGroup.modifier_group)
            .selectinload(ModifierGroup.options)
        )
    )

    result = await db.execute(query)
    menu = result.scalars().unique().first()
    if menu is None:
        return None
    return _build_menu_out(menu)


async def upsert_menu_for_restaurant(
    db: AsyncSession,
    state_slug: str,
    city_slug: str,
    restaurant_slug: str,
    payload: MenuUpsert,
) -> MenuOut:
    location_result = await db.execute(
        select(RestaurantLocation.id)
        .join(
            RestaurantSlug,
            RestaurantSlug.restaurant_location_id == RestaurantLocation.id,
        )
        .where(
            RestaurantSlug.state_slug == state_slug.lower(),
            RestaurantSlug.city_slug == city_slug.lower(),
            RestaurantSlug.restaurant_slug == restaurant_slug.lower(),
            RestaurantSlug.is_canonical.is_(True),
        )
    )
    location_id = location_result.scalar_one_or_none()
    if location_id is None:
        raise LookupError("Restaurant not found.")

    async with db.begin():
        await db.execute(
            update(Menu)
            .where(
                Menu.restaurant_location_id == location_id,
                Menu.is_active.is_(True),
            )
            .values(is_active=False)
        )

        menu = Menu(
            restaurant_location_id=location_id,
            name=payload.name,
            is_active=payload.is_active,
        )
        db.add(menu)
        await db.flush()

        for cat_index, category in enumerate(payload.categories):
            cat_order = category.sort_order if category.sort_order is not None else cat_index
            menu_category = MenuCategory(
                menu_id=menu.id,
                name=category.name,
                description=category.description,
                sort_order=cat_order,
                is_active=category.is_active,
            )
            db.add(menu_category)
            await db.flush()

            for item_index, item in enumerate(category.items):
                item_order = item.sort_order if item.sort_order is not None else item_index
                db.add(
                    MenuItem(
                        menu_category_id=menu_category.id,
                        name=item.name,
                        description=item.description,
                        price_cents=item.price_cents,
                        sort_order=item_order,
                        is_active=item.is_active,
                    )
                )

    return _build_menu_out(menu)
