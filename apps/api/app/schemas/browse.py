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

    model_config = {"from_attributes": True}
