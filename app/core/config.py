#app/core/config.py

from pydantic_settings import BaseSettings, SettingsConfigDict

class Settings(BaseSettings):
    # Por padrão, usa SQLite. Se você mudar DATABASE_URL no .env, ele usará a do .env
    DATABASE_URL: str = "mysql://root:xpbaZlHluHDMUEsPydohTcwgUGnpkIlk@maglev.proxy.rlwy.net:49618/railway"
    SECRET_KEY: str # Virá do .env
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 1440

    # Configurações para carregar variáveis de ambiente do arquivo .env
    model_config = SettingsConfigDict(env_file=".env", extra="ignore")

settings = Settings()