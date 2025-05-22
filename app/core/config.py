from pydantic_settings import BaseSettings, SettingsConfigDict

class Settings(BaseSettings):
    # Por padrão, usa SQLite. Se você mudar DATABASE_URL no .env, ele usará a do .env
    DATABASE_URL: str = "mysql+pymysql://root:@localhost:3306/prj_bolao_bdl"
    SECRET_KEY: str # Virá do .env
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 1440

    # Configurações para carregar variáveis de ambiente do arquivo .env
    model_config = SettingsConfigDict(env_file=".env", extra="ignore")

settings = Settings()