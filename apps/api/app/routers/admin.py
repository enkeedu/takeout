import csv
import io
from typing import Literal

from fastapi import APIRouter, Depends, Query
from fastapi.responses import StreamingResponse
from sqlalchemy.ext.asyncio import AsyncSession

from app.database import get_db
from app.schemas.admin import LeadsResponse
from app.schemas.common import PaginationParams
from app.services.admin import get_leads, get_leads_for_csv

router = APIRouter(prefix="/admin", tags=["admin"])


@router.get("/leads", response_model=LeadsResponse)
async def list_leads(
    state: str | None = Query(default=None, description="Filter by state (2-letter code)"),
    sort_by: Literal["lead_score", "name", "state", "estimated_monthly_spend", "rating"] = Query(default="lead_score"),
    sort_dir: Literal["asc", "desc"] = Query(default="desc"),
    page: int = Query(default=1, ge=1),
    page_size: int = Query(default=50, ge=1, le=100),
    db: AsyncSession = Depends(get_db),
):
    pagination = PaginationParams(page=page, page_size=page_size)
    return await get_leads(db, pagination, state_filter=state, sort_by=sort_by, sort_dir=sort_dir)


@router.get("/leads/csv")
async def export_leads_csv(
    state: str | None = Query(default=None),
    sort_by: Literal["lead_score", "name", "state", "estimated_monthly_spend", "rating"] = Query(default="lead_score"),
    sort_dir: Literal["asc", "desc"] = Query(default="desc"),
    db: AsyncSession = Depends(get_db),
):
    leads = await get_leads_for_csv(db, state_filter=state, sort_by=sort_by, sort_dir=sort_dir)

    output = io.StringIO()
    # UTF-8 BOM for Excel compatibility
    output.write("\ufeff")
    writer = csv.writer(output)
    writer.writerow([
        "Name", "City", "State", "Phone", "Website", "Platform",
        "Online Ordering", "Rating", "Reviews", "Lead Score", "Est. Monthly Spend",
    ])
    for lead in leads:
        writer.writerow([
            lead.name,
            lead.city,
            lead.state,
            lead.phone or "",
            lead.website_url or "",
            lead.platform or "",
            "Yes" if lead.has_online_ordering else "No",
            lead.rating or "",
            lead.user_rating_count or "",
            lead.lead_score,
            f"${lead.estimated_monthly_spend}",
        ])

    output.seek(0)
    return StreamingResponse(
        iter([output.getvalue()]),
        media_type="text/csv",
        headers={"Content-Disposition": "attachment; filename=leads.csv"},
    )
