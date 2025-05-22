#config.py
from pydantic_settings import BaseSettings

class Settings(BaseSettings):
    openweather_api_key: str
    database_url: str = "sqlite:///./sql_app.db"
    
    class Config:
        env_file = ".env"
        env_file_encoding = 'utf-8'

settings = Settings()