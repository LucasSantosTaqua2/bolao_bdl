# app/models/game.py
from typing import Optional
from datetime import datetime
from sqlmodel import Field, SQLModel
import enum

# Enum para o status do jogo
class GameStatus(str, enum.Enum):
    SCHEDULED = "scheduled"  # Agendado
    FINISHED = "finished"    # Finalizado
    POSTPONED = "postponed"  # Adiado
    CANCELED = "canceled"    # Cancelado

class Game(SQLModel, table=True):
    id: Optional[int] = Field(default=None, primary_key=True)
    round_number: int = Field(nullable=False, index=True)
    home_team: str = Field(nullable=False, max_length=100)
    away_team: str = Field(nullable=False, max_length=100)
    game_datetime: datetime = Field(nullable=False)

    home_score: Optional[int] = Field(default=None, ge=0)
    away_score: Optional[int] = Field(default=None, ge=0)
    status: GameStatus = Field(default=GameStatus.SCHEDULED, nullable=False)

    created_at: datetime = Field(default_factory=datetime.utcnow, nullable=False)
    updated_at: datetime = Field(default_factory=datetime.utcnow, nullable=False)

    # Opcional: Adicionar relações com apostas se for o caso
    # bets: List["Bet"] = Relationship(back_populates="game")