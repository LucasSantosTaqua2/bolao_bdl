from typing import Optional, List
from sqlmodel import Session, select, desc
from datetime import datetime, timezone # <--- Importe datetime e timezone para updated_at

from app.models.user import User # Mantenha apenas o User do models
from app.schemas.user import UserCreate, UserUpdate, UserPasswordUpdate # <--- Importe os novos schemas
from app.core.security import get_password_hash, verify_password # <--- Importe verify_password

def create_user(user_create: UserCreate, db: Session) -> User:
    """
    Cria um novo usuário no banco de dados.
    Recebe um UserCreate schema e retorna o objeto User salvo no BD.
    """
    hashed_password = get_password_hash(user_create.password)

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

# ----------------------------------------------------
# NOVAS FUNÇÕES CRUD PARA ATUALIZAÇÃO
# ----------------------------------------------------

def update_user_profile(user_id: int, user_update: UserUpdate, db: Session) -> Optional[User]:
    """
    Atualiza os dados de perfil de um usuário (ex: username).
    """
    user = db.get(User, user_id)
    if not user:
        return None

    # Transforma o schema UserUpdate em um dicionário, excluindo campos não definidos
    update_data = user_update.model_dump(exclude_unset=True)
    for key, value in update_data.items():
        setattr(user, key, value) # Atualiza o atributo do objeto User

    user.updated_at = datetime.now(timezone.utc) # Atualiza a data de última alteração
    db.add(user) # Adiciona o objeto atualizado de volta à sessão
    db.commit() # Salva as mudanças no banco de dados
    db.refresh(user) # Atualiza o objeto 'user' com os dados do BD
    return user

def update_user_password(user: User, new_password: str, db: Session) -> User:
    """
    Atualiza a senha de um usuário.
    """
    user.hashed_password = get_password_hash(new_password) # Gera hash da nova senha
    user.updated_at = datetime.now(timezone.utc) # Atualiza a data de última alteração
    db.add(user)
    db.commit()
    db.refresh(user)
    return user

def get_users_ranking(db: Session, limit: Optional[int] = None) -> List[User]:
    """
    Busca todos os usuários, ordenados por pontos em ordem decrescente.
    """
    statement = select(User).order_by(desc(User.points)) # Ordena por pontos em ordem decrescente
    if limit:
        statement = statement.limit(limit) # Limita o número de resultados, se especificado
    users = db.exec(statement).all()
    return users