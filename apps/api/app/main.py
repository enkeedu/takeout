from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.config import settings
from app.routers import browse, health, restaurants, search, sitemap


@asynccontextmanager
async def lifespan(app: FastAPI):
    yield


app = FastAPI(title="Chinese Takeout API", version="0.1.0", lifespan=lifespan)

app.add_middleware(
    CORSMiddleware,
    allow_origins=[o.strip() for o in settings.cors_origins.split(",")],
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(health.router)
app.include_router(browse.router)
app.include_router(restaurants.router)
app.include_router(search.router)
app.include_router(sitemap.router)
