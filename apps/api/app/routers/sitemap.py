from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession

from app.database import get_db
from app.services.restaurant import get_all_slugs

router = APIRouter(tags=["sitemap"])


@router.get("/sitemap/slugs")
async def sitemap_slugs(db: AsyncSession = Depends(get_db)):
    return await get_all_slugs(db)
