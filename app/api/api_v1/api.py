# app/api/api_v1/api.py
from fastapi import APIRouter

# Importe os routers diretamente dos arquivos .py
from app.api.api_v1.endpoints.users import router as users_router # <--- Importamos como users_router
from app.api.api_v1.endpoints.games import router as games_router


api_router = APIRouter()

# CORREÇÃO AQUI: Use users_router, não users.router
api_router.include_router(users_router, prefix="/users", tags=["users"])
api_router.include_router(games_router, prefix="/games", tags=["games"])