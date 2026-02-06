from app.models.base import Base
from app.models.location import RestaurantLocation
from app.models.restaurant import Restaurant
from app.models.slug import RestaurantSlug

__all__ = ["Base", "Restaurant", "RestaurantLocation", "RestaurantSlug"]
