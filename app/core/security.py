from datetime import datetime, timedelta, timezone
from typing import Optional

from passlib.context import CryptContext # Para hashing de senhas
from jose import JWTError, jwt # Para JWT

from app.core.config import settings # <--- Importa as configurações do seu arquivo config.py

# Configuração para hashing de senhas
# Usamos bcrypt como algoritmo padrão.
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

def verify_password(plain_password: str, hashed_password: str) -> bool:
    """Verifica se uma senha em texto puro corresponde a uma senha hash."""
    return pwd_context.verify(plain_password, hashed_password)

def get_password_hash(password: str) -> str:
    """Gera o hash de uma senha em texto puro."""
    return pwd_context.hash(password)

def create_access_token(data: dict, expires_delta: Optional[timedelta] = None) -> str:
    """Cria um token de acesso JWT."""
    to_encode = data.copy()
    if expires_delta:
        expire = datetime.now(timezone.utc) + expires_delta
    else:
        # Pega o tempo de expiração do .env via settings
        expire = datetime.now(timezone.utc) + timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES)
    to_encode.update({"exp": expire})
    encoded_jwt = jwt.encode(to_encode, settings.SECRET_KEY, algorithm=settings.ALGORITHM)
    return encoded_jwt

# Classe auxiliar para as credenciais do token que será retornado no login
from sqlmodel import SQLModel # Usamos SQLModel aqui para ser consistente, mas BaseModel do pydantic também funcionaria

class Token(SQLModel):
    access_token: str
    token_type: str = "bearer" # Tipo do token (padrão para JWT)

# Classe para os dados que esperamos encontrar DENTRO do token (o payload)
class TokenData(SQLModel):
    username: Optional[str] = None # O username é o identificador principal no token