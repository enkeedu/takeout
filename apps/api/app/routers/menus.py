from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession

from app.database import get_db
from app.schemas.menu import MenuOut
from app.services.menu import get_menu_for_restaurant

router = APIRouter(prefix="/menus", tags=["menus"])


@router.get("/{state}/{city}/{restaurant_slug}", response_model=MenuOut)
async def get_menu(
    state: str,
    city: str,
    restaurant_slug: str,
    db: AsyncSession = Depends(get_db),
):
    menu = await get_menu_for_restaurant(db, state, city, restaurant_slug)
    if menu is None:
        raise HTTPException(status_code=404, detail="Menu not found")
    return menu
