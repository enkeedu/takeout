import csv
import io
from typing import Literal

from fastapi import APIRouter, Depends, Header, HTTPException, Query
from fastapi.responses import StreamingResponse
from sqlalchemy.ext.asyncio import AsyncSession

from app.config import settings
from app.database import get_db
from app.schemas.admin import (
    AdminClaimQueueItem,
    AdminClaimQueueResponse,
    AdminClaimQueueUpdateIn,
    AdminDiagnosticsOut,
    AdminTestEmailIn,
    AdminTestEmailOut,
    AdminUnlistedOwnerRequestResponse,
    LeadsResponse,
)
from app.schemas.common import PaginationParams
from app.services.admin import (
    get_admin_diagnostics,
    get_claim_queue,
    get_leads,
    get_leads_for_csv,
    get_unlisted_owner_requests,
    send_admin_test_email,
    update_claim_queue_item,
)
from app.services.claim import ClaimServiceError

router = APIRouter(prefix="/admin", tags=["admin"])


def require_admin(x_admin_token: str | None = Header(default=None)) -> None:
    if not settings.admin_token:
        raise HTTPException(status_code=503, detail="Admin token is not configured")
    if x_admin_token != settings.admin_token:
        raise HTTPException(status_code=403, detail="Invalid admin token")


@router.get("/leads", response_model=LeadsResponse)
async def list_leads(
    state: str | None = Query(default=None, description="Filter by state (2-letter code)"),
    sort_by: Literal["lead_score", "name", "state", "estimated_monthly_spend", "rating"] = Query(default="lead_score"),
    sort_dir: Literal["asc", "desc"] = Query(default="desc"),
    page: int = Query(default=1, ge=1),
    page_size: int = Query(default=50, ge=1, le=100),
    db: AsyncSession = Depends(get_db),
    _: None = Depends(require_admin),
):
    pagination = PaginationParams(page=page, page_size=page_size)
    return await get_leads(db, pagination, state_filter=state, sort_by=sort_by, sort_dir=sort_dir)


@router.get("/leads/csv")
async def export_leads_csv(
    state: str | None = Query(default=None),
    sort_by: Literal["lead_score", "name", "state", "estimated_monthly_spend", "rating"] = Query(default="lead_score"),
    sort_dir: Literal["asc", "desc"] = Query(default="desc"),
    db: AsyncSession = Depends(get_db),
    _: None = Depends(require_admin),
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


@router.get("/claim-requests", response_model=AdminClaimQueueResponse)
async def list_claim_requests(
    db: AsyncSession = Depends(get_db),
    _: None = Depends(require_admin),
):
    return await get_claim_queue(db)


@router.get("/unlisted-owner-requests", response_model=AdminUnlistedOwnerRequestResponse)
async def list_unlisted_owner_requests(
    db: AsyncSession = Depends(get_db),
    _: None = Depends(require_admin),
):
    return await get_unlisted_owner_requests(db)


@router.get("/diagnostics", response_model=AdminDiagnosticsOut)
async def admin_diagnostics(_: None = Depends(require_admin)):
    return await get_admin_diagnostics()


@router.post("/notifications/test-email", response_model=AdminTestEmailOut)
async def admin_test_email(
    payload: AdminTestEmailIn,
    _: None = Depends(require_admin),
):
    try:
        recipient = await send_admin_test_email(payload.recipient)
    except ClaimServiceError as exc:
        raise HTTPException(status_code=exc.status_code, detail=exc.detail) from exc

    return AdminTestEmailOut(
        recipient=recipient,
        detail=f"SMTP test email sent to {recipient}.",
    )


@router.patch("/claim-requests/{claim_request_id}", response_model=AdminClaimQueueItem)
async def update_claim_request(
    claim_request_id: str,
    payload: AdminClaimQueueUpdateIn,
    db: AsyncSession = Depends(get_db),
    _: None = Depends(require_admin),
):
    try:
        return await update_claim_queue_item(db, claim_request_id, payload)
    except ClaimServiceError as exc:
        raise HTTPException(status_code=exc.status_code, detail=exc.detail) from exc
