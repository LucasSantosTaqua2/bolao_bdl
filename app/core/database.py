from sqlmodel import create_engine, Session, SQLModel
from app.core.config import settings

# A URL do banco de dados vem das suas configurações
sqlite_file_name = settings.DATABASE_URL.replace("sqlite:///./", "") # Extrai o nome do arquivo, ex: "sql_app.db"
sqlite_url = f"sqlite:///{sqlite_file_name}"

# Cria o engine (conexão) do SQLAlchemy. connect_args é para SQLite
engine = create_engine(sqlite_url, echo=True, connect_args={"check_same_thread": False})

def create_db_and_tables():
    """Cria todas as tabelas definidas nos seus modelos no banco de dados."""
    SQLModel.metadata.create_all(engine)

def get_session():
    """Fornece uma sessão de banco de dados para cada requisição da API."""
    with Session(engine) as session:
        yield session