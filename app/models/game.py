# app/models/game.py
from __future__ import annotations
from typing import Optional, List, TYPE_CHECKING
from datetime import datetime, timezone
from app.core.database import Base # Importar a Base declarativa
# REMOVA ESTA LINHA: from sqlmodel import Field # Remova Field se não estiver usando-o para Column
from sqlalchemy.orm import Mapped, relationship
import enum
from enum import Enum
from sqlalchemy import Enum as SQLAlchemyEnum
from sqlalchemy import Column, Integer, String, DateTime

if TYPE_CHECKING:
    from app.models.bet import Bet


class GameStatus(str, Enum):
    SCHEDULED = "scheduled"
    FINISHED = "finished"
    POSTPONED = "postponed"
    CANCELED = "canceled"

class Game(Base): # Herda de Base
    __tablename__ = "game"

    id: Mapped[int] = Column(Integer, primary_key=True, index=True)
    round_number: Mapped[int] = Column(Integer, nullable=False, index=True)
    home_team: Mapped[str] = Column(String(100), nullable=False)
    away_team: Mapped[str] = Column(String(100), nullable=False)
    game_datetime: Mapped[datetime] = Column(DateTime(timezone=True), nullable=False)

    home_score: Mapped[Optional[int]] = Column(Integer)
    away_score: Mapped[Optional[int]] = Column(Integer)
    status: Mapped[GameStatus] = Column(SQLAlchemyEnum(GameStatus, name="game_statuses"), default=GameStatus.SCHEDULED, nullable=False)

    created_at: Mapped[datetime] = Column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc), nullable=False)
    updated_at: Mapped[datetime] = Column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc), nullable=False)

    bets: Mapped[List["Bet"]] = relationship("Bet", back_populates="game")