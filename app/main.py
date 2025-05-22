# app/main.py
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware # <<< Certifique-se que está importado

from app.core.database import create_db_and_tables, get_session
from app.crud.user import create_user
from app.models.user import User, UserRole
from app.models.game import Game
from app.models.bet import Bet

from app.schemas.user import UserCreate

from sqlalchemy import select

app = FastAPI(
    title="Bolão Balde de Lixo API",
    description="API para o sistema de bolão de futebol do Brasileirão.",
    version="1.0.0",
)

# --- Configuração CORS (EXTREMAMENTE PERMISSIVA PARA DEBUG) ---
# ISSO É APENAS PARA TESTES. NÃO USE EM PRODUÇÃO POR RAZÕES DE SEGURANÇA.
origins = [
    "http://localhost:4200", # Seu frontend Angular
    "http://127.0.0.1:4200", # Outra forma de localhost para seu frontend
    # Você também pode tentar usar "*" aqui na lista para permitir todas as origens,
    # mas o app.add_middleware(allow_origins=["*"]) é mais direto.
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"], # <<< NOVO/MUDANÇA: Permite *QUALQUER* origem. EXTREMAMENTE PERMISSIVO.
    allow_credentials=True, # Permite cookies, cabeçalhos de autorização, etc.
    allow_methods=["*"], # Permite todos os métodos (GET, POST, OPTIONS, PUT, DELETE, etc.)
    allow_headers=["*"], # Permite todos os cabeçalhos (Authorization, Content-Type, etc.)
    max_age=3600 # Cacheia a resposta do preflight por 1 hora (3600 segundos)
)


@app.on_event("startup")
def on_startup():
    """Evento que é executado quando a aplicação inicia. Cria as tabelas do BD."""
    create_db_and_tables()

    with next(get_session()) as session:
        existing_user = session.execute(select(User)).scalars().first()

        if not existing_user:
            print("Nenhum usuário encontrado. Criando usuário administrador padrão...")
            admin_user_data = UserCreate(username="ADMIN", password="L1u1c1a1s1!@", role=UserRole.ADMIN)
            create_user(admin_user_data, session)
            print("Usuário administrador padrão 'admin' criado com sucesso.")
        else:
            print("Usuário(s) já existente(s). Não criando admin padrão.")


@app.get("/")
def read_root():
    return {"message": "Bem-vindo à API do Bolão Balde de Lixo! (FastAPI + SQLite)"}


from app.api.api_v1.api import api_router as main_api_router
app.include_router(main_api_router, prefix="/api/v1") # Inclua o router principal da API