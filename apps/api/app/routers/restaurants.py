from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession

from app.database import get_db
from app.schemas.restaurant import RestaurantDetail, RestaurantReviewsResponse
from app.services.restaurant import get_restaurant_detail
from app.services.reviews import get_restaurant_reviews

router = APIRouter(prefix="/restaurants", tags=["restaurants"])


@router.get(
    "/{state}/{city}/{restaurant_slug}",
    response_model=RestaurantDetail,
)
async def get_restaurant(
    state: str,
    city: str,
    restaurant_slug: str,
    db: AsyncSession = Depends(get_db),
):
    detail = await get_restaurant_detail(db, state, city, restaurant_slug)
    if detail is None:
        raise HTTPException(status_code=404, detail="Restaurant not found")
    return detail


@router.get(
    "/{state}/{city}/{restaurant_slug}/reviews",
    response_model=RestaurantReviewsResponse,
)
async def get_reviews(
    state: str,
    city: str,
    restaurant_slug: str,
    db: AsyncSession = Depends(get_db),
):
    reviews = await get_restaurant_reviews(db, state, city, restaurant_slug)
    if reviews is None:
        raise HTTPException(status_code=404, detail="Restaurant not found")
    return reviews
