from fastapi import APIRouter, Depends, Query
from sqlalchemy.ext.asyncio import AsyncSession

from app.database import get_db
from app.schemas.common import PaginatedResponse, PaginationParams
from app.schemas.restaurant import SearchResultItem
from app.services.search import search_restaurants

router = APIRouter(tags=["search"])


@router.get("/search", response_model=PaginatedResponse[SearchResultItem])
async def search(
    q: str = Query(default="", max_length=200),
    state: str | None = Query(default=None),
    city: str | None = Query(default=None),
    page: int = Query(default=1, ge=1),
    page_size: int = Query(default=20, ge=1, le=100),
    db: AsyncSession = Depends(get_db),
):
    if not q.strip():
        return PaginatedResponse(
            items=[], total=0, page=page, page_size=page_size, total_pages=0
        )
    pagination = PaginationParams(page=page, page_size=page_size)
    return await search_restaurants(db, q, pagination, state=state, city=city)
