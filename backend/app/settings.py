from functools import lru_cache

from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    database_host: str = "127.0.0.1"
    database_port: int = 5432
    database_name: str = "postgres"
    database_user: str = ""
    database_password: str = ""
    database_url: str = ""

    minio_endpoint: str = "http://127.0.0.1:9000"
    minio_access_key: str = ""
    minio_secret_key: str = ""
    minio_bucket: str = "portfolio-projects"
    minio_region: str = "us-east-1"
    minio_public_url: str = ""

    admin_token: str = ""
    cors_origins: str = "*"

    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        extra="ignore",
    )

    @property
    def database_dsn(self) -> str:
        if self.database_url:
            return self.database_url
        return (
            f"host={self.database_host} port={self.database_port} "
            f"dbname={self.database_name} user={self.database_user} "
            f"password={self.database_password}"
        )

    @property
    def allowed_origins(self) -> list[str]:
        origins = self.cors_origins.strip()
        return ["*"] if origins == "*" else [origin.strip() for origin in origins.split(",") if origin.strip()]


@lru_cache
def get_settings() -> Settings:
    return Settings()
