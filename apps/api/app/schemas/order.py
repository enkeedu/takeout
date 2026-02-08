import uuid
from typing import Literal

from pydantic import BaseModel, Field


class OrderItemModifierCreate(BaseModel):
    modifier_group_id: uuid.UUID
    modifier_option_id: uuid.UUID


class OrderItemCreate(BaseModel):
    menu_item_id: uuid.UUID
    quantity: int = Field(gt=0, le=50)
    modifiers: list[OrderItemModifierCreate] = Field(default_factory=list)


class OrderCreate(BaseModel):
    customer_name: str | None = None
    customer_phone: str | None = None
    fulfillment_type: Literal["pickup", "delivery"] = "pickup"
    notes: str | None = None
    items: list[OrderItemCreate]


class OrderItemModifierOut(BaseModel):
    modifier_group_id: uuid.UUID
    modifier_group_name: str
    modifier_option_id: uuid.UUID
    modifier_option_name: str
    price_cents: int


class OrderItemOut(BaseModel):
    id: uuid.UUID
    menu_item_id: uuid.UUID | None
    name: str
    price_cents: int
    quantity: int
    modifiers: list[OrderItemModifierOut] = Field(default_factory=list)

    model_config = {"from_attributes": True}


class OrderOut(BaseModel):
    id: uuid.UUID
    status: str
    fulfillment_type: str
    customer_name: str | None = None
    customer_phone: str | None = None
    notes: str | None = None
    subtotal_cents: int
    tax_cents: int
    fees_cents: int
    total_cents: int
    items: list[OrderItemOut]

    model_config = {"from_attributes": True}
