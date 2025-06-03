from pydantic_settings import BaseSettings
from pydantic import Field


class Settings(BaseSettings):
    # Alpaca Settings
    ALPACA_API_KEY: str = Field(..., env="ALPACA_API_KEY")
    ALPACA_API_SECRET: str = Field(..., env="ALPACA_API_SECRET")
    ALPACA_BASE_URL: str = Field(..., env="ALPACA_BASE_URL")

    # OpenAI Settings
    OPENAI_API_KEY: str = Field(..., env="OPENAI_API_KEY")
    OPENAI_MODEL: str = Field("gpt-4", env="MODEL")

    class Config:
        env_file = ".env"
        env_file_encoding = "utf-8"


settings = Settings()
