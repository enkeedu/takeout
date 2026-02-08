from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession

from app.database import get_db
from app.schemas.order import OrderCreate, OrderOut
from app.services.order import create_order, get_order

router = APIRouter(prefix="/orders", tags=["orders"])


@router.post("/{state}/{city}/{restaurant_slug}", response_model=OrderOut)
async def create_restaurant_order(
    state: str,
    city: str,
    restaurant_slug: str,
    payload: OrderCreate,
    db: AsyncSession = Depends(get_db),
):
    try:
        return await create_order(db, state, city, restaurant_slug, payload)
    except LookupError as exc:
        raise HTTPException(status_code=404, detail=str(exc)) from exc
    except ValueError as exc:
        raise HTTPException(status_code=400, detail=str(exc)) from exc


@router.get("/{order_id}", response_model=OrderOut)
async def get_order_detail(order_id: UUID, db: AsyncSession = Depends(get_db)):
    order = await get_order(db, order_id)
    if order is None:
        raise HTTPException(status_code=404, detail="Order not found")
    return order
