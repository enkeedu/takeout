from pydantic import BaseModel


class StateOut(BaseModel):
    state: str
    restaurant_count: int

    model_config = {"from_attributes": True}


class CityOut(BaseModel):
    city: str
    city_slug: str
    state: str
    restaurant_count: int
    online_ordering_count: int = 0
    no_online_ordering_count: int = 0
    claimed_count: int = 0
    unclaimed_count: int = 0
    ai_phone_count: int = 0
    website_count: int = 0
    opportunity_score: int = 0

    model_config = {"from_attributes": True}
