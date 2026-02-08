import uuid

from pydantic import BaseModel


class ModifierOptionOut(BaseModel):
    id: uuid.UUID
    name: str
    price_cents: int
    is_default: bool
    sort_order: int

    model_config = {"from_attributes": True}


class ModifierGroupOut(BaseModel):
    id: uuid.UUID
    name: str
    description: str | None = None
    min_select: int
    max_select: int
    is_required: bool
    sort_order: int
    options: list[ModifierOptionOut]

    model_config = {"from_attributes": True}


class MenuItemOut(BaseModel):
    id: uuid.UUID
    name: str
    description: str | None = None
    price_cents: int
    sort_order: int
    is_active: bool
    modifier_groups: list[ModifierGroupOut]

    model_config = {"from_attributes": True}


class MenuCategoryOut(BaseModel):
    id: uuid.UUID
    name: str
    description: str | None = None
    sort_order: int
    is_active: bool
    items: list[MenuItemOut]

    model_config = {"from_attributes": True}


class MenuOut(BaseModel):
    id: uuid.UUID
    name: str
    is_active: bool
    categories: list[MenuCategoryOut]

    model_config = {"from_attributes": True}


class MenuItemIn(BaseModel):
    name: str
    description: str | None = None
    price_cents: int
    sort_order: int | None = None
    is_active: bool = True


class MenuCategoryIn(BaseModel):
    name: str
    description: str | None = None
    sort_order: int | None = None
    is_active: bool = True
    items: list[MenuItemIn]


class MenuUpsert(BaseModel):
    name: str
    is_active: bool = True
    categories: list[MenuCategoryIn]
