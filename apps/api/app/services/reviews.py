import asyncio
import logging
from dataclasses import dataclass
from datetime import datetime, timedelta, timezone
from typing import Any

import requests
from sqlalchemy import delete, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.config import settings
from app.models import Restaurant, RestaurantLocation, RestaurantReview, RestaurantSlug
from app.schemas.restaurant import RestaurantReviewItem, RestaurantReviewsResponse

logger = logging.getLogger(__name__)

GOOGLE_PLACE_DETAILS_URL = "https://places.googleapis.com/v1/places/{place_id}"
GOOGLE_REVIEW_FIELD_MASK_CANDIDATES = ("id,reviews", "reviews")


@dataclass
class _RestaurantRef:
    id: Any
    google_place_id: str | None


@dataclass
class _ParsedReview:
    google_review_id: str | None
    reviewer_name: str
    rating: float
    quote: str
    source: str
    source_url: str | None
    relative_time: str | None
    published_at: datetime | None
    sort_order: int


def _parse_publish_time(raw: Any) -> datetime | None:
    if not isinstance(raw, str) or not raw:
        return None
    normalized = raw.strip()
    if normalized.endswith("Z"):
        normalized = normalized[:-1] + "+00:00"
    try:
        return datetime.fromisoformat(normalized)
    except ValueError:
        return None


def _extract_quote(review: dict[str, Any]) -> str:
    text_value = review.get("text")
    if isinstance(text_value, dict):
        candidate = text_value.get("text")
        if isinstance(candidate, str) and candidate.strip():
            return candidate.strip()

    original_text = review.get("originalText")
    if isinstance(original_text, dict):
        candidate = original_text.get("text")
        if isinstance(candidate, str) and candidate.strip():
            return candidate.strip()

    if isinstance(text_value, str) and text_value.strip():
        return text_value.strip()
    return ""


def _parse_google_reviews(data: dict[str, Any]) -> list[_ParsedReview]:
    raw_reviews = data.get("reviews")
    if not isinstance(raw_reviews, list):
        return []

    max_items = max(1, settings.google_reviews_max_items)
    parsed: list[_ParsedReview] = []

    for index, raw in enumerate(raw_reviews):
        if not isinstance(raw, dict):
            continue
        rating = raw.get("rating")
        if not isinstance(rating, (int, float)):
            continue

        quote = _extract_quote(raw)
        if not quote:
            continue

        author_attribution = raw.get("authorAttribution")
        reviewer_name = "Google User"
        source_url: str | None = None
        if isinstance(author_attribution, dict):
            display_name = author_attribution.get("displayName")
            if isinstance(display_name, str) and display_name.strip():
                reviewer_name = display_name.strip()
            author_url = author_attribution.get("uri")
            if isinstance(author_url, str) and author_url.strip():
                source_url = author_url.strip()

        relative_time = raw.get("relativePublishTimeDescription")
        parsed.append(
            _ParsedReview(
                google_review_id=raw.get("name")
                if isinstance(raw.get("name"), str)
                else None,
                reviewer_name=reviewer_name,
                rating=float(rating),
                quote=quote,
                source="Google",
                source_url=source_url,
                relative_time=relative_time
                if isinstance(relative_time, str) and relative_time.strip()
                else None,
                published_at=_parse_publish_time(raw.get("publishTime")),
                sort_order=index,
            )
        )
        if len(parsed) >= max_items:
            break
    return parsed


def _is_stale(rows: list[RestaurantReview]) -> bool:
    if not rows:
        return True
    latest = max((row.fetched_at for row in rows if row.fetched_at), default=None)
    if latest is None:
        return True
    if latest.tzinfo is None:
        latest = latest.replace(tzinfo=timezone.utc)
    return datetime.now(timezone.utc) - latest >= timedelta(
        hours=max(1, settings.google_reviews_ttl_hours)
    )


def _serialize_rows(rows: list[RestaurantReview]) -> RestaurantReviewsResponse:
    items = [
        RestaurantReviewItem(
            id=str(row.id),
            name=row.reviewer_name,
            rating=float(row.rating) if row.rating is not None else 0.0,
            quote=row.quote,
            source=row.source,
            source_url=row.source_url,
            relative_time=row.relative_time,
            published_at=row.published_at,
        )
        for row in rows
        if row.rating is not None and row.quote
    ]
    refreshed_at = max((row.fetched_at for row in rows if row.fetched_at), default=None)
    return RestaurantReviewsResponse(items=items, refreshed_at=refreshed_at)


def _request_google_place_details(place_id: str) -> dict[str, Any] | None:
    if not settings.google_places_api_key:
        return None

    url = GOOGLE_PLACE_DETAILS_URL.format(place_id=place_id)
    for field_mask in GOOGLE_REVIEW_FIELD_MASK_CANDIDATES:
        headers = {
            "X-Goog-Api-Key": settings.google_places_api_key,
            "X-Goog-FieldMask": field_mask,
        }
        try:
            response = requests.get(url, headers=headers, timeout=12)
        except requests.RequestException as exc:
            logger.warning("Google reviews request failed for place %s: %s", place_id, exc)
            return None

        if response.status_code != 200:
            continue

        try:
            payload = response.json()
        except ValueError:
            logger.warning(
                "Google reviews response was not valid JSON for place %s",
                place_id,
            )
            return None
        if isinstance(payload, dict):
            return payload
        return None

    logger.warning("Google reviews request returned non-200 for place %s", place_id)
    return None


async def _fetch_google_reviews(place_id: str) -> list[_ParsedReview] | None:
    payload = await asyncio.to_thread(_request_google_place_details, place_id)
    if payload is None:
        return None
    return _parse_google_reviews(payload)


async def _get_restaurant_ref(
    db: AsyncSession, state_slug: str, city_slug: str, restaurant_slug: str
) -> _RestaurantRef | None:
    result = await db.execute(
        select(Restaurant.id, Restaurant.google_place_id)
        .join(RestaurantLocation, Restaurant.id == RestaurantLocation.restaurant_id)
        .join(RestaurantSlug, RestaurantLocation.id == RestaurantSlug.restaurant_location_id)
        .where(
            RestaurantSlug.state_slug == state_slug.lower(),
            RestaurantSlug.city_slug == city_slug.lower(),
            RestaurantSlug.restaurant_slug == restaurant_slug.lower(),
            RestaurantSlug.is_canonical.is_(True),
        )
    )
    row = result.one_or_none()
    if row is None:
        return None
    return _RestaurantRef(id=row.id, google_place_id=row.google_place_id)


async def _load_cached_reviews(
    db: AsyncSession, restaurant_id: Any
) -> list[RestaurantReview]:
    result = await db.execute(
        select(RestaurantReview)
        .where(RestaurantReview.restaurant_id == restaurant_id)
        .order_by(RestaurantReview.sort_order.asc(), RestaurantReview.published_at.desc().nullslast())
    )
    return list(result.scalars().all())


async def _replace_reviews(
    db: AsyncSession, restaurant_id: Any, reviews: list[_ParsedReview]
) -> None:
    now = datetime.now(timezone.utc)
    await db.execute(
        delete(RestaurantReview).where(RestaurantReview.restaurant_id == restaurant_id)
    )
    if reviews:
        db.add_all(
            [
                RestaurantReview(
                    restaurant_id=restaurant_id,
                    google_review_id=review.google_review_id,
                    reviewer_name=review.reviewer_name,
                    rating=review.rating,
                    quote=review.quote,
                    source=review.source,
                    source_url=review.source_url,
                    relative_time=review.relative_time,
                    published_at=review.published_at,
                    sort_order=review.sort_order,
                    fetched_at=now,
                )
                for review in reviews
            ]
        )
    await db.commit()


async def get_restaurant_reviews(
    db: AsyncSession, state_slug: str, city_slug: str, restaurant_slug: str
) -> RestaurantReviewsResponse | None:
    ref = await _get_restaurant_ref(db, state_slug, city_slug, restaurant_slug)
    if ref is None:
        return None

    rows = await _load_cached_reviews(db, ref.id)
    should_refresh = bool(ref.google_place_id) and bool(settings.google_places_api_key) and _is_stale(rows)

    if should_refresh and ref.google_place_id:
        fetched_reviews = await _fetch_google_reviews(ref.google_place_id)
        if fetched_reviews is not None:
            await _replace_reviews(db, ref.id, fetched_reviews)
            rows = await _load_cached_reviews(db, ref.id)

    return _serialize_rows(rows)
