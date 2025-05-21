from typing import Optional
from sqlmodel import Field, SQLModel
from datetime import datetime, timezone
import enum  # Importe o módulo enum


# Defina um Enum para os papéis do usuário
class UserRole(str, enum.Enum):  # Herda de str para serializar como string no DB e de enum.Enum
    USER = "user"
    ADMIN = "admin"


class User(SQLModel, table=True):
    id: Optional[int] = Field(default=None, primary_key=True)
    username: str = Field(unique=True, index=True, max_length=50)  # Nome de usuário único
    hashed_password: str  # Senha com hash
    role: UserRole = Field(
        default=UserRole.USER, nullable=False
    )  # <--- Adicionado o campo role com valor padrão
    # --- NOVO CAMPO AQUI ---
    points: int = Field(default=0, nullable=False)  # Adicionado o campo 'points' com valor padrão 0
    # -----------------------
    created_at: datetime = Field(
        default_factory=lambda: datetime.now(timezone.utc), nullable=False
    )  # Data de criação (UTC)
    updated_at: datetime = Field(
        default_factory=lambda: datetime.now(timezone.utc), nullable=False
    )  # Data da última atualização (UTC)