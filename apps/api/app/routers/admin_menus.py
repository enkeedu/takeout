from fastapi import APIRouter, Depends, Header, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession

from app.config import settings
from app.database import get_db
from app.schemas.menu import MenuOut, MenuUpsert
from app.schemas.restaurant import RestaurantDetail, RestaurantTemplateUpdate
from app.services.menu import get_menu_for_restaurant, upsert_menu_for_restaurant
from app.services.restaurant import set_restaurant_template

router = APIRouter(prefix="/admin/menus", tags=["admin"])


def require_admin(x_admin_token: str | None = Header(default=None)) -> None:
    if settings.admin_token and x_admin_token != settings.admin_token:
        raise HTTPException(status_code=403, detail="Invalid admin token")


@router.get("/{state}/{city}/{restaurant_slug}", response_model=MenuOut)
async def get_menu_admin(
    state: str,
    city: str,
    restaurant_slug: str,
    db: AsyncSession = Depends(get_db),
    _: None = Depends(require_admin),
):
    menu = await get_menu_for_restaurant(db, state, city, restaurant_slug)
    if menu is None:
        raise HTTPException(status_code=404, detail="Menu not found")
    return menu


@router.put("/{state}/{city}/{restaurant_slug}", response_model=MenuOut)
async def upsert_menu_admin(
    state: str,
    city: str,
    restaurant_slug: str,
    payload: MenuUpsert,
    db: AsyncSession = Depends(get_db),
    _: None = Depends(require_admin),
):
    try:
        return await upsert_menu_for_restaurant(db, state, city, restaurant_slug, payload)
    except LookupError as exc:
        raise HTTPException(status_code=404, detail=str(exc)) from exc


@router.put("/{state}/{city}/{restaurant_slug}/template", response_model=RestaurantDetail)
async def set_template_admin(
    state: str,
    city: str,
    restaurant_slug: str,
    payload: RestaurantTemplateUpdate,
    db: AsyncSession = Depends(get_db),
    _: None = Depends(require_admin),
):
    try:
        return await set_restaurant_template(
            db,
            state,
            city,
            restaurant_slug,
            payload.template_key,
        )
    except LookupError as exc:
        raise HTTPException(status_code=404, detail=str(exc)) from exc
    except ValueError as exc:
        raise HTTPException(status_code=400, detail=str(exc)) from exc
