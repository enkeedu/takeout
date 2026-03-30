from pathlib import Path

from pydantic import field_validator
from pydantic_settings import BaseSettings


ROOT_ENV_PATH = Path(__file__).resolve().parents[3] / ".env"


class Settings(BaseSettings):
    database_url: str = "postgresql+asyncpg://takeout:takeout_dev@localhost:5432/takeout"
    cors_origins: str = "http://localhost:3001"
    web_base_url: str = "http://localhost:3001"
    debug: bool = True
    admin_token: str | None = None
    google_places_api_key: str | None = None
    google_reviews_ttl_hours: int = 168
    google_reviews_max_items: int = 5
    claim_sms_provider: str = "mock"
    claim_sms_mock_code: str = "111111"
    claim_verification_code_ttl_minutes: int = 10
    claim_verification_attempt_limit: int = 5
    claim_verification_send_limit: int = 3
    claim_verification_send_window_minutes: int = 30
    claim_verified_token_ttl_minutes: int = 30
    claim_payment_provider: str = "mock"
    claim_setup_deposit_cents: int = 29900
    claim_monthly_plan_cents: int = 9900
    claim_currency: str = "usd"
    stripe_secret_key: str | None = None
    stripe_webhook_secret: str | None = None
    twilio_account_sid: str | None = None
    twilio_auth_token: str | None = None
    twilio_verify_service_sid: str | None = None
    claim_alert_email_to: str | None = None
    claim_alert_email_from: str | None = None
    smtp_host: str | None = None
    smtp_port: int = 587
    smtp_username: str | None = None
    smtp_password: str | None = None
    smtp_use_tls: bool = True

    @field_validator("debug", mode="before")
    @classmethod
    def normalize_debug_value(cls, value: object) -> object:
        if isinstance(value, str):
            normalized = value.strip().lower()
            if normalized in {"release", "prod", "production"}:
                return False
            if normalized in {"debug", "dev", "development"}:
                return True
        return value

    @field_validator(
        "admin_token",
        "google_places_api_key",
        "claim_alert_email_to",
        "claim_alert_email_from",
        "smtp_host",
        "smtp_username",
        mode="before",
    )
    @classmethod
    def strip_optional_strings(cls, value: object) -> object:
        if isinstance(value, str):
            stripped = value.strip()
            return stripped or None
        return value

    @field_validator("smtp_password", mode="before")
    @classmethod
    def normalize_smtp_password(cls, value: object) -> object:
        if isinstance(value, str):
            normalized = value.strip().replace(" ", "")
            return normalized or None
        return value

    model_config = {"env_file": str(ROOT_ENV_PATH), "extra": "ignore"}


settings = Settings()
