from pydantic import Field
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    ENV: str = Field(default="development")
    DATABASE_URL: str = Field(default="postgresql://postgres:carefin_secure_password_dev@localhost:5432/carefin")
    JWT_SECRET: str = Field(default="dev_jwt_secret_must_be_changed_in_production_key_32_chars_long")
    JWT_ALGORITHM: str = Field(default="HS256")
    ACCESS_TOKEN_EXPIRE_MINUTES: int = Field(default=1440)

    # Use settings model to load config variables from local .env if active
    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        extra="ignore"
    )

settings = Settings()
