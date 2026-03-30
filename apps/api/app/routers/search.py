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
    name: str = Query(default="", max_length=200),
    phone: str = Query(default="", max_length=40),
    address: str = Query(default="", max_length=200),
    zip: str = Query(default="", max_length=20),
    state: str | None = Query(default=None),
    city: str | None = Query(default=None),
    page: int = Query(default=1, ge=1),
    page_size: int = Query(default=20, ge=1, le=100),
    db: AsyncSession = Depends(get_db),
):
    has_any_filter = any(
        [
            q.strip(),
            name.strip(),
            phone.strip(),
            address.strip(),
            zip.strip(),
            (state or "").strip(),
            (city or "").strip(),
        ]
    )
    if not has_any_filter:
        return PaginatedResponse(
            items=[], total=0, page=page, page_size=page_size, total_pages=0
        )
    pagination = PaginationParams(page=page, page_size=page_size)
    return await search_restaurants(
        db,
        q=q,
        pagination=pagination,
        state=state,
        city=city,
        name=name,
        phone=phone,
        zip_code=zip,
        address=address,
    )
