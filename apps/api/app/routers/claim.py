import uuid

from fastapi import APIRouter, Depends, Header, HTTPException, Query, Request
from sqlalchemy.ext.asyncio import AsyncSession

from app.database import get_db
from app.schemas.claim import (
    ClaimDepositCheckoutIn,
    ClaimDepositCheckoutOut,
    ClaimManualReviewIn,
    ClaimManualReviewOut,
    ClaimMockDepositCompleteIn,
    ClaimReviewDecisionIn,
    ClaimRequestStatusOut,
    ClaimSendCodeIn,
    ClaimSendCodeOut,
    ClaimSetupIntakeIn,
    ClaimSubmitIn,
    ClaimSubmitOut,
    ClaimVerifyCodeIn,
    ClaimVerifyCodeOut,
    OwnerSiteProfilePublishIn,
    OwnerSiteProfileUpdateIn,
    OwnerSiteProfileWorkspaceOut,
    UnlistedOwnerRequestIn,
    UnlistedOwnerRequestOut,
)
from app.services.claim import (
    ClaimServiceError,
    complete_mock_deposit_checkout,
    create_deposit_checkout,
    get_owner_site_profile_workspace,
    get_claim_request_status,
    handle_deposit_webhook,
    publish_owner_site_profile,
    send_claim_code,
    submit_claim_review_decision,
    submit_claim_setup_intake,
    submit_claim_request,
    submit_manual_review_request,
    update_owner_site_profile,
    submit_unlisted_owner_request,
    verify_claim_code,
)

router = APIRouter(prefix="/claim", tags=["claim"])


@router.post("/send-code", response_model=ClaimSendCodeOut)
async def claim_send_code(
    payload: ClaimSendCodeIn,
    request: Request,
    db: AsyncSession = Depends(get_db),
):
    try:
        return await send_claim_code(db, payload, request.client.host if request.client else None)
    except ClaimServiceError as exc:
        raise HTTPException(status_code=exc.status_code, detail=exc.detail) from exc


@router.post("/verify-code", response_model=ClaimVerifyCodeOut)
async def claim_verify_code(
    payload: ClaimVerifyCodeIn,
    db: AsyncSession = Depends(get_db),
):
    try:
        return await verify_claim_code(db, payload)
    except ClaimServiceError as exc:
        raise HTTPException(status_code=exc.status_code, detail=exc.detail) from exc


@router.post("/submit", response_model=ClaimSubmitOut)
async def claim_submit(
    payload: ClaimSubmitIn,
    db: AsyncSession = Depends(get_db),
):
    try:
        return await submit_claim_request(db, payload)
    except ClaimServiceError as exc:
        raise HTTPException(status_code=exc.status_code, detail=exc.detail) from exc


@router.post("/manual-review", response_model=ClaimManualReviewOut)
async def claim_manual_review(
    payload: ClaimManualReviewIn,
    db: AsyncSession = Depends(get_db),
):
    try:
        return await submit_manual_review_request(db, payload)
    except ClaimServiceError as exc:
        raise HTTPException(status_code=exc.status_code, detail=exc.detail) from exc


@router.post("/unlisted-request", response_model=UnlistedOwnerRequestOut)
async def claim_unlisted_request(
    payload: UnlistedOwnerRequestIn,
    db: AsyncSession = Depends(get_db),
):
    try:
        return await submit_unlisted_owner_request(db, payload)
    except ClaimServiceError as exc:
        raise HTTPException(status_code=exc.status_code, detail=exc.detail) from exc


@router.post(
    "/requests/{claim_request_id}/deposit-checkout",
    response_model=ClaimDepositCheckoutOut,
)
async def claim_deposit_checkout(
    claim_request_id: uuid.UUID,
    payload: ClaimDepositCheckoutIn,
    db: AsyncSession = Depends(get_db),
):
    try:
        return await create_deposit_checkout(db, claim_request_id, payload)
    except ClaimServiceError as exc:
        raise HTTPException(status_code=exc.status_code, detail=exc.detail) from exc


@router.post(
    "/requests/{claim_request_id}/mock-deposit-complete",
    response_model=ClaimRequestStatusOut,
)
async def claim_mock_deposit_complete(
    claim_request_id: uuid.UUID,
    payload: ClaimMockDepositCompleteIn,
    db: AsyncSession = Depends(get_db),
):
    try:
        return await complete_mock_deposit_checkout(db, claim_request_id, payload)
    except ClaimServiceError as exc:
        raise HTTPException(status_code=exc.status_code, detail=exc.detail) from exc


@router.get("/requests/{claim_request_id}", response_model=ClaimRequestStatusOut)
async def claim_request_status(
    claim_request_id: uuid.UUID,
    access_token: str | None = Header(default=None, alias="X-Launch-Access-Token"),
    access_token_query: str | None = Query(default=None, alias="accessToken"),
    db: AsyncSession = Depends(get_db),
):
    try:
        return await get_claim_request_status(
            db, claim_request_id, (access_token or access_token_query or "").strip()
        )
    except ClaimServiceError as exc:
        raise HTTPException(status_code=exc.status_code, detail=exc.detail) from exc


@router.get(
    "/requests/{claim_request_id}/site-profile",
    response_model=OwnerSiteProfileWorkspaceOut,
)
async def claim_site_profile(
    claim_request_id: uuid.UUID,
    access_token: str | None = Header(default=None, alias="X-Launch-Access-Token"),
    access_token_query: str | None = Query(default=None, alias="accessToken"),
    db: AsyncSession = Depends(get_db),
):
    try:
        return await get_owner_site_profile_workspace(
            db,
            claim_request_id,
            (access_token or access_token_query or "").strip(),
        )
    except ClaimServiceError as exc:
        raise HTTPException(status_code=exc.status_code, detail=exc.detail) from exc


@router.post(
    "/requests/{claim_request_id}/site-profile",
    response_model=OwnerSiteProfileWorkspaceOut,
)
async def claim_site_profile_update(
    claim_request_id: uuid.UUID,
    payload: OwnerSiteProfileUpdateIn,
    db: AsyncSession = Depends(get_db),
):
    try:
        return await update_owner_site_profile(db, claim_request_id, payload)
    except ClaimServiceError as exc:
        raise HTTPException(status_code=exc.status_code, detail=exc.detail) from exc


@router.post(
    "/requests/{claim_request_id}/site-profile/publish",
    response_model=OwnerSiteProfileWorkspaceOut,
)
async def claim_site_profile_publish(
    claim_request_id: uuid.UUID,
    payload: OwnerSiteProfilePublishIn,
    db: AsyncSession = Depends(get_db),
):
    try:
        return await publish_owner_site_profile(db, claim_request_id, payload)
    except ClaimServiceError as exc:
        raise HTTPException(status_code=exc.status_code, detail=exc.detail) from exc


@router.post(
    "/requests/{claim_request_id}/setup-intake",
    response_model=ClaimRequestStatusOut,
)
async def claim_setup_intake(
    claim_request_id: uuid.UUID,
    payload: ClaimSetupIntakeIn,
    db: AsyncSession = Depends(get_db),
):
    try:
        return await submit_claim_setup_intake(db, claim_request_id, payload)
    except ClaimServiceError as exc:
        raise HTTPException(status_code=exc.status_code, detail=exc.detail) from exc


@router.post(
    "/requests/{claim_request_id}/review-decision",
    response_model=ClaimRequestStatusOut,
)
async def claim_review_decision(
    claim_request_id: uuid.UUID,
    payload: ClaimReviewDecisionIn,
    db: AsyncSession = Depends(get_db),
):
    try:
        return await submit_claim_review_decision(db, claim_request_id, payload)
    except ClaimServiceError as exc:
        raise HTTPException(status_code=exc.status_code, detail=exc.detail) from exc


@router.post("/stripe-webhook")
async def claim_stripe_webhook(
    request: Request,
    stripe_signature: str | None = Header(default=None, alias="Stripe-Signature"),
    db: AsyncSession = Depends(get_db),
):
    try:
        payload = await request.body()
        return await handle_deposit_webhook(db, payload, stripe_signature)
    except ClaimServiceError as exc:
        raise HTTPException(status_code=exc.status_code, detail=exc.detail) from exc
