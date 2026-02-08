from pydantic_settings import BaseSettings


class Settings(BaseSettings):
    database_url: str = "postgresql+asyncpg://takeout:takeout_dev@localhost:5432/takeout"
    cors_origins: str = "http://localhost:3001"
    debug: bool = True
    admin_token: str | None = None

    model_config = {"env_file": ".env", "extra": "ignore"}


settings = Settings()
