import uuid

from pydantic import BaseModel


class RestaurantListItem(BaseModel):
    name: str
    phone: str | None = None
    has_online_ordering: bool = False
    has_ai_phone: bool = False
    is_claimed: bool = False
    address1: str
    city: str
    state: str
    zip: str
    state_slug: str
    city_slug: str
    restaurant_slug: str
    rating: float | None = None
    user_rating_count: int | None = None
    price_level: str | None = None

    model_config = {"from_attributes": True}


class RestaurantDetail(BaseModel):
    id: uuid.UUID
    name: str
    phone: str | None = None
    website_url: str | None = None
    has_online_ordering: bool = False
    has_ai_phone: bool = False
    is_claimed: bool = False
    rating: float | None = None
    user_rating_count: int | None = None
    price_level: str | None = None
    google_place_id: str | None = None
    google_maps_uri: str | None = None
    address1: str
    address2: str | None = None
    city: str
    state: str
    zip: str
    lat: float | None = None
    lng: float | None = None
    timezone: str
    hours_json: dict | None = None
    has_takeout: bool | None = None
    has_delivery: bool | None = None
    has_dine_in: bool | None = None
    business_status: str | None = None
    state_slug: str
    city_slug: str
    restaurant_slug: str
    is_canonical: bool = True
    template_key: str | None = None

    model_config = {"from_attributes": True}


class RestaurantTemplateUpdate(BaseModel):
    template_key: str


class SearchResultItem(BaseModel):
    name: str
    phone: str | None = None
    address1: str
    city: str
    state: str
    state_slug: str
    city_slug: str
    restaurant_slug: str
    rank: float

    model_config = {"from_attributes": True}
