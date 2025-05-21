# app/models/game.py
from typing import Optional
from datetime import datetime
from sqlmodel import Field, SQLModel

class Game(SQLModel, table=True):
    id: Optional[int] = Field(default=None, primary_key=True)
    round_number: int = Field(nullable=False, index=True) # Rodada do jogo (ex: 1 a 38)
    home_team: str = Field(nullable=False, max_length=100) # Nome do time mandante
    away_team: str = Field(nullable=False, max_length=100) # Nome do time visitante
    game_datetime: datetime = Field(nullable=False) # Data e hora do jogo (em UTC)

    # Campos para o placar final (serão preenchidos após o jogo)
    home_score: Optional[int] = Field(default=None, ge=0) # Gols do mandante
    away_score: Optional[int] = Field(default=None, ge=0) # Gols do visitante

    # Status do jogo (opcional, para controle interno)
    status: str = Field(default="scheduled", max_length=20) # "scheduled", "finished", "postponed", etc.

    # Metadados de criação e atualização
    created_at: datetime = Field(default_factory=datetime.utcnow, nullable=False)
    updated_at: datetime = Field(default_factory=datetime.utcnow, nullable=False)

    # Opcional: Adicionar relações com apostas se for o caso
    # bets: List["Bet"] = Relationship(back_populates="game")