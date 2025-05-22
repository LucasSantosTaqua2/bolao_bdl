# app/models/user.py
from __future__ import annotations
from typing import Optional, List, TYPE_CHECKING
from app.core.database import Base
from sqlmodel import Field # Remova Field se não estiver usando-o para Column
from sqlalchemy.orm import Mapped, relationship
from datetime import datetime, timezone # <<< Mantenha timezone importado
import enum
from enum import Enum
from sqlalchemy import Enum as SQLAlchemyEnum
from sqlalchemy import Column, Integer, String, DateTime, Boolean # <<< MUDANÇA: Certifique-se de que DateTime é importado

if TYPE_CHECKING:
    from app.models.bet import Bet


class UserRole(str, Enum):
    USER = "user"
    ADMIN = "admin"

class User(Base): # Herda de Base
    __tablename__ = "user"

    id: Mapped[int] = Column(Integer, primary_key=True, index=True)
    username: Mapped[str] = Column(String(50), unique=True, index=True, nullable=False)
    hashed_password: Mapped[str] = Column(String(255), nullable=False)
    role: Mapped[UserRole] = Column(
        SQLAlchemyEnum(UserRole, name="user_roles"), default=UserRole.USER, nullable=False
    )
    points: Mapped[int] = Column(Integer, default=0, nullable=False)
    is_active: Mapped[bool] = Column(Boolean, default=True, nullable=False)
    # <<< MUDANÇA: Adicionar timezone=True para created_at e updated_at
    created_at: Mapped[datetime] = Column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc), nullable=False)
    updated_at: Mapped[datetime] = Column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc), nullable=False)

    bets: Mapped[List["Bet"]] = relationship("Bet", back_populates="user")