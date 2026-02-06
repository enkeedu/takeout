from fastapi import APIRouter, Depends, Query
from sqlalchemy.ext.asyncio import AsyncSession

from app.database import get_db
from app.schemas.browse import CityOut, StateOut
from app.schemas.common import PaginatedResponse, PaginationParams
from app.schemas.restaurant import RestaurantListItem
from app.services.browse import list_cities, list_restaurants_in_city, list_states

router = APIRouter(prefix="/browse", tags=["browse"])


@router.get("/states", response_model=list[StateOut])
async def get_states(db: AsyncSession = Depends(get_db)):
    return await list_states(db)


@router.get("/{state}/cities", response_model=PaginatedResponse[CityOut])
async def get_cities(
    state: str,
    page: int = Query(default=1, ge=1),
    page_size: int = Query(default=20, ge=1, le=100),
    db: AsyncSession = Depends(get_db),
):
    pagination = PaginationParams(page=page, page_size=page_size)
    return await list_cities(db, state, pagination)


@router.get(
    "/{state}/{city}/restaurants",
    response_model=PaginatedResponse[RestaurantListItem],
)
async def get_restaurants(
    state: str,
    city: str,
    page: int = Query(default=1, ge=1),
    page_size: int = Query(default=20, ge=1, le=100),
    db: AsyncSession = Depends(get_db),
):
    pagination = PaginationParams(page=page, page_size=page_size)
    return await list_restaurants_in_city(db, state, city, pagination)
