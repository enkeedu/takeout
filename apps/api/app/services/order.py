from collections import defaultdict
from uuid import UUID

from sqlalchemy import select
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
from app.models.order import Order, OrderItem
from app.schemas.order import (
    OrderCreate,
    OrderItemModifierCreate,
    OrderItemModifierOut,
    OrderItemOut,
    OrderOut,
)


async def _resolve_location_id(
    db: AsyncSession, state_slug: str, city_slug: str, restaurant_slug: str
) -> UUID | None:
    result = await db.execute(
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
    return result.scalar_one_or_none()


async def create_order(
    db: AsyncSession,
    state_slug: str,
    city_slug: str,
    restaurant_slug: str,
    payload: OrderCreate,
) -> OrderOut:
    if not payload.items:
        raise ValueError("Order must contain at least one item.")

    location_id = await _resolve_location_id(db, state_slug, city_slug, restaurant_slug)
    if location_id is None:
        raise LookupError("Restaurant not found.")

    unique_ids = {item.menu_item_id for item in payload.items}

    menu_items_result = await db.execute(
        select(MenuItem)
        .join(MenuCategory, MenuItem.menu_category_id == MenuCategory.id)
        .join(Menu, MenuCategory.menu_id == Menu.id)
        .where(
            Menu.restaurant_location_id == location_id,
            Menu.is_active.is_(True),
            MenuCategory.is_active.is_(True),
            MenuItem.is_active.is_(True),
            MenuItem.id.in_(unique_ids),
        )
        .options(
            selectinload(MenuItem.modifier_group_links)
            .selectinload(MenuItemModifierGroup.modifier_group)
            .selectinload(ModifierGroup.options)
        )
    )
    menu_items = menu_items_result.scalars().all()
    menu_map = {item.id: item for item in menu_items}

    missing = [item_id for item_id in unique_ids if item_id not in menu_map]
    if missing:
        raise ValueError("One or more menu items are invalid.")

    subtotal_cents = 0
    order_items: list[OrderItem] = []
    for item in payload.items:
        menu_item = menu_map[item.menu_item_id]
        serialized_modifiers, modifier_delta = _resolve_modifiers(
            menu_item, item.modifiers
        )
        unit_price_cents = menu_item.price_cents + modifier_delta
        line_total = unit_price_cents * item.quantity
        subtotal_cents += line_total
        order_items.append(
            OrderItem(
                menu_item_id=menu_item.id,
                name=menu_item.name,
                price_cents=unit_price_cents,
                quantity=item.quantity,
                modifiers_json=serialized_modifiers,
            )
        )

    tax_cents = 0
    fees_cents = 0
    total_cents = subtotal_cents + tax_cents + fees_cents

    order = Order(
        restaurant_location_id=location_id,
        status="pending",
        fulfillment_type=payload.fulfillment_type,
        customer_name=payload.customer_name,
        customer_phone=payload.customer_phone,
        notes=payload.notes,
        subtotal_cents=subtotal_cents,
        tax_cents=tax_cents,
        fees_cents=fees_cents,
        total_cents=total_cents,
        items=order_items,
    )

    db.add(order)
    await db.commit()

    return OrderOut(
        id=order.id,
        status=order.status,
        fulfillment_type=order.fulfillment_type,
        customer_name=order.customer_name,
        customer_phone=order.customer_phone,
        notes=order.notes,
        subtotal_cents=order.subtotal_cents,
        tax_cents=order.tax_cents,
        fees_cents=order.fees_cents,
        total_cents=order.total_cents,
        items=[_to_order_item_out(item) for item in order.items],
    )


async def get_order(db: AsyncSession, order_id: UUID) -> OrderOut | None:
    result = await db.execute(
        select(Order)
        .where(Order.id == order_id)
        .options(selectinload(Order.items))
    )
    order = result.scalars().unique().first()
    if order is None:
        return None

    return OrderOut(
        id=order.id,
        status=order.status,
        fulfillment_type=order.fulfillment_type,
        customer_name=order.customer_name,
        customer_phone=order.customer_phone,
        notes=order.notes,
        subtotal_cents=order.subtotal_cents,
        tax_cents=order.tax_cents,
        fees_cents=order.fees_cents,
        total_cents=order.total_cents,
        items=[_to_order_item_out(item) for item in order.items],
    )


def _resolve_modifiers(
    menu_item: MenuItem,
    selections: list[OrderItemModifierCreate],
) -> tuple[list[dict], int]:
    linked_groups = [
        link.modifier_group
        for link in menu_item.modifier_group_links
        if link.modifier_group is not None
    ]
    if not linked_groups:
        if selections:
            raise ValueError("Selected modifiers are invalid for this item.")
        return [], 0

    groups_by_id = {group.id: group for group in linked_groups}
    selected_option_ids: dict[UUID, set[UUID]] = defaultdict(set)

    for selection in selections:
        group = groups_by_id.get(selection.modifier_group_id)
        if group is None:
            raise ValueError("Selected modifiers are invalid for this item.")

        allowed_option_ids = {option.id for option in group.options}
        if selection.modifier_option_id not in allowed_option_ids:
            raise ValueError("Selected modifiers are invalid for this item.")

        selected_option_ids[group.id].add(selection.modifier_option_id)

    serialized: list[dict] = []
    option_total = 0
    for group in linked_groups:
        chosen_ids = selected_option_ids.get(group.id, set())
        if not chosen_ids:
            default_ids = {option.id for option in group.options if option.is_default}
            chosen_ids = default_ids

        max_select = group.max_select if group.max_select and group.max_select > 0 else None
        if group.is_required and not chosen_ids:
            raise ValueError(f"{group.name} is required.")
        if len(chosen_ids) < group.min_select:
            raise ValueError(f"{group.name} requires at least {group.min_select} selections.")
        if max_select is not None and len(chosen_ids) > max_select:
            raise ValueError(f"{group.name} allows up to {max_select} selections.")

        for option in group.options:
            if option.id not in chosen_ids:
                continue
            option_total += option.price_cents
            serialized.append(
                {
                    "modifier_group_id": str(group.id),
                    "modifier_group_name": group.name,
                    "modifier_option_id": str(option.id),
                    "modifier_option_name": option.name,
                    "price_cents": option.price_cents,
                }
            )

    return serialized, option_total


def _to_order_item_out(item: OrderItem) -> OrderItemOut:
    raw_modifiers = item.modifiers_json or []
    modifiers = [
        OrderItemModifierOut(
            modifier_group_id=modifier["modifier_group_id"],
            modifier_group_name=modifier["modifier_group_name"],
            modifier_option_id=modifier["modifier_option_id"],
            modifier_option_name=modifier["modifier_option_name"],
            price_cents=modifier["price_cents"],
        )
        for modifier in raw_modifiers
    ]
    return OrderItemOut(
        id=item.id,
        menu_item_id=item.menu_item_id,
        name=item.name,
        price_cents=item.price_cents,
        quantity=item.quantity,
        modifiers=modifiers,
    )
