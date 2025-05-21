# app/main.py
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.core.database import create_db_and_tables, get_session
# Importe as funções CRUD para criar o admin
from app.crud.user import create_user
# CORREÇÃO AQUI: User e UserRole vêm de models, UserCreate vem de schemas
from app.models.user import User, UserRole
from app.models.game import Game
from app.schemas.user import UserCreate # <--- UserCreate vem APENAS de schemas


from sqlmodel import select

from app.api.main import api_router

app = FastAPI(
    title="Bolão Balde de Lixo API",
    description="API para o sistema de bolão de futebol do Brasileirão.",
    version="1.0.0",
)

# --- Configuração CORS ---
origins = [
    "http://localhost",
    "http://localhost:4200",
    "http://127.0.0.0:4200", # Corrigido: 127.0.0.0, não 127.0.0.1
    # Adicione outras origens se necessário
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)
# --- Fim da Configuração CORS ---


@app.on_event("startup")
def on_startup():
    """Evento que é executado quando a aplicação inicia. Cria as tabelas do BD."""
    create_db_and_tables()

    # Lógica para criar o primeiro usuário admin se não existir nenhum usuário
    with next(get_session()) as session:
        existing_user = session.exec(select(User)).first()

        if not existing_user:
            print("Nenhum usuário encontrado. Criando usuário administrador padrão...")
            # Defina a senha do admin aqui
            admin_user_data = UserCreate(username="ADMIN", password="L1u1c1a1s1!@", role=UserRole.ADMIN)
            create_user(admin_user_data, session)
            print("Usuário administrador padrão 'admin' criado com sucesso.")
        else:
            print("Usuário(s) já existente(s). Não criando admin padrão.")


# Rota de teste inicial para verificar se a API está funcionando
@app.get("/")
def read_root():
    return {"message": "Bem-vindo à API do Bolão Balde de Lixo! (FastAPI + SQLite)"}


app.include_router(api_router, prefix="/api")