# app/models/bet.py
from typing import Optional
from datetime import datetime, timezone # <<< MUDANÇA: ADICIONE timezone AQUI

from sqlalchemy import Column, Integer, DateTime, ForeignKey, Boolean
from sqlalchemy.orm import relationship, Mapped

from app.core.database import Base # Importar a Base declarativa

# Para as relações, ainda precisamos que User e Game sejam definidos
# Não importamos diretamente para evitar circularidade, mas eles serão resolvidos
# pela relação ou importados em main.py
# from app.models.user import User # Não importar aqui
# from app.models.game import Game # Não importar aqui

class Bet(Base): # Herda de Base
    __tablename__ = "bet"

    id: Mapped[int] = Column(Integer, primary_key=True, index=True)
    user_id: Mapped[int] = Column(Integer, ForeignKey("user.id"), index=True, nullable=False)
    game_id: Mapped[int] = Column(Integer, ForeignKey("game.id"), index=True, nullable=False)

    home_score_bet: Mapped[int] = Column(Integer, nullable=False)
    away_score_bet: Mapped[int] = Column(Integer, nullable=False)

    is_correct: Mapped[Optional[bool]] = Column(Boolean)
    points_awarded: Mapped[Optional[int]] = Column(Integer, default=0)

    # <<< MUDANÇA: Adicionar timezone=True para created_at e updated_at
    created_at: Mapped[datetime] = Column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc), nullable=False)
    updated_at: Mapped[datetime] = Column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc), nullable=False)

    user: Mapped["User"] = relationship("User", back_populates="bets")
    game: Mapped["Game"] = relationship("Game", back_populates="bets")

    def __repr__(self):
        return f"Bet(id={self.id}, user_id={self.user_id}, game_id={self.game_id})"