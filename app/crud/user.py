from typing import Optional
from sqlmodel import Session, select
from app.models.user import User # <--- Mantenha apenas o User do models
from app.schemas.user import UserCreate # <--- Importe UserCreate do schemas (CORREÇÃO AQUI!)
from app.core.security import get_password_hash

def create_user(user_create: UserCreate, db: Session) -> User:
    """
    Cria um novo usuário no banco de dados.
    Recebe um UserCreate schema e retorna o objeto User salvo no BD.
    """
    # Cria o hash da senha antes de armazenar
    hashed_password = get_password_hash(user_create.password)

    # Cria uma instância do modelo User usando os dados do schema e a senha com hash
    user = User(
        username=user_create.username,
        hashed_password=hashed_password,
        role=user_create.role
    )

    db.add(user)
    db.commit()
    db.refresh(user)
    return user

def get_user_by_id(user_id: int, db: Session) -> Optional[User]:
    """
    Busca um usuário no banco de dados pelo seu ID.
    """
    user = db.get(User, user_id)
    return user

def get_user_by_username(username: str, db: Session) -> Optional[User]:
    """
    Busca um usuário no banco de dados pelo seu username.
    """
    statement = select(User).where(User.username == username)
    user = db.exec(statement).first()
    return user