from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware  # Importe o CORSMiddleware

from app.core.database import create_db_and_tables
from app.api.main import api_router  # Descomente e importe o router principal da API

app = FastAPI(
    title="Bolão Balde de Lixo API",
    description="API para o sistema de bolão de futebol do Brasileirão.",
    version="1.0.0",
)

# --- Configuração CORS ---
# Lista de origens que terão permissão para acessar sua API
# Em desenvolvimento, localhost:4200 é o frontend Angular.
# Em produção, você colocaria o domínio real do seu frontend (ex: https://bolao.com)
origins = [
    "http://localhost",
    "http://localhost:4200",
    "http://127.0.0.1:4200",
    # Adicione outras origens se necessário
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],  # Permite todos os métodos HTTP
    allow_headers=["*"],  # Permite todos os cabeçalhos
)
# --- Fim da Configuração CORS ---


@app.on_event("startup")
def on_startup():
    """Evento que é executado quando a aplicação inicia. Cria as tabelas do BD."""
    create_db_and_tables()


# Rota de teste inicial para verificar se a API está funcionando
@app.get("/")
def read_root():
    return {"message": "Bem-vindo à API do Bolão Balde de Lixo! (FastAPI + SQLite)"}


app.include_router(api_router, prefix="/api")  # Descomente esta linha
