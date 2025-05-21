# app/schemas/game.py
from typing import Optional
from datetime import datetime
from pydantic import BaseModel, Field # Importe Field do pydantic para validação

# Schema Base: Campos comuns para criação e leitura (sem ID)
class GameBase(BaseModel):
    round_number: int = Field(..., ge=1, le=38) # Rodada: obrigatória, entre 1 e 38
    home_team: str
    away_team: str
    game_datetime: datetime # Data e hora do jogo
    # Os campos de placar e status não estão na base, pois são opcionais na criação inicial
    # ou para leitura.

# Schema para Criação de Jogo:
# O que o admin vai enviar para criar um novo jogo
class GameCreate(GameBase):
    pass # Herda todos os campos de GameBase

# Schema para Atualização de Resultado de Jogo:
# O que o admin vai enviar para atualizar os placares e o status
class GameUpdateResult(BaseModel):
    home_score: Optional[int] = Field(default=None, ge=0)
    away_score: Optional[int] = Field(default=None, ge=0)
    status: Optional[str] = "finished" # Por padrão, ao enviar resultado, o status é "finished"

# Schema para Leitura de Jogo:
# O que a API vai retornar (inclui ID, placares e status)
class GameRead(GameBase):
    id: int
    home_score: Optional[int] = None
    away_score: Optional[int] = None
    status: str
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True # Permite que o Pydantic leia dados de um ORM (SQLModel)