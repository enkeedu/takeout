from pydantic import BaseModel


class LeadItem(BaseModel):
    restaurant_id: str
    name: str
    city: str
    state: str
    phone: str | None = None
    website_url: str | None = None
    platform: str | None = None
    has_online_ordering: bool = False
    http_status: int | None = None
    ssl_valid: bool | None = None
    audit_error: str | None = None
    rating: float | None = None
    user_rating_count: int | None = None
    lead_score: int
    estimated_monthly_spend: int
    state_slug: str
    city_slug: str
    restaurant_slug: str


class ChartEntry(BaseModel):
    label: str
    value: int


class LeadStats(BaseModel):
    total_restaurants: int
    no_website_count: int
    broken_website_count: int
    avg_lead_score: float
    platform_counts: list[ChartEntry]
    score_distribution: list[ChartEntry]
    website_status: list[ChartEntry]
    ordering_counts: list[ChartEntry]


class LeadsResponse(BaseModel):
    stats: LeadStats
    items: list[LeadItem]
    total: int
    page: int
    page_size: int
    total_pages: int
