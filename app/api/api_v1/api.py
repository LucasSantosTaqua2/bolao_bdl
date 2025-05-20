from fastapi import APIRouter

from app.api.api_v1.endpoints import users # <--- Importe o router de usuários

api_router = APIRouter()

api_router.include_router(users.router, prefix="/users", tags=["users"])
# Adicione outros routers aqui conforme você os criar (ex: games, bets)
# api_router.include_router(games.router, prefix="/games", tags=["games"])
# api_router.include_router(bets.router, prefix="/bets", tags=["bets"])