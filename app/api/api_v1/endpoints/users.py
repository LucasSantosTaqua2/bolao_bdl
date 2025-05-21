from typing import Annotated, List

from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.security import OAuth2PasswordRequestForm
from sqlmodel import Session
from datetime import datetime, timezone

from app.core.security import create_access_token, verify_password, Token
from app.core.database import get_session
# Importe as funções CRUD, incluindo a nova get_users_ranking
from app.crud.user import (
    create_user,
    get_user_by_username,
    get_user_by_id,
    update_user_profile,
    update_user_password,
    get_users_ranking
)
from app.models.user import User, UserRole
from app.schemas.user import UserCreate, UserRead, UserUpdate, UserPasswordUpdate

from fastapi.security import OAuth2PasswordBearer
from jose import JWTError, jwt
from app.core.config import settings


router = APIRouter()

# --------------------------------------------------
# Dependência para Usuário Atual (Proteção de Rotas)
# --------------------------------------------------
oauth2_scheme = OAuth2PasswordBearer(tokenUrl="/api/v1/users/token")

async def get_current_user(
    token: Annotated[str, Depends(oauth2_scheme)],
    db: Session = Depends(get_session)
) -> User:
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Não foi possível validar as credenciais",
        headers={"WWW-Authenticate": "Bearer"},
    )
    try:
        payload = jwt.decode(token, settings.SECRET_KEY, algorithms=[settings.ALGORITHM])
        username: str = payload.get("sub")
        if username is None:
            raise credentials_exception
    except JWTError:
        raise credentials_exception

    user = get_user_by_username(username, db)
    if user is None:
        raise credentials_exception
    return user

# --------------------------------------------------
# NOVA DEPENDÊNCIA: Para Superusuários (Admin)
# --------------------------------------------------
async def get_current_active_admin(
    current_user: Annotated[User, Depends(get_current_user)]
) -> User:
    if current_user.role != UserRole.ADMIN:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Acesso não autorizado. Apenas administradores podem acessar este recurso."
        )
    return current_user

# --------------------------------------------------
# Endpoint de Registro de Usuário
# --------------------------------------------------
@router.post("/register", response_model=UserRead, status_code=status.HTTP_201_CREATED)
def register_user(user_create: UserCreate, db: Session = Depends(get_session)):
    """
    Registra um novo usuário no sistema.
    Retorna os dados do usuário registrado (sem a senha).
    """
    db_user = get_user_by_username(user_create.username, db)
    if db_user:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Nome de usuário já registrado."
        )

    user = create_user(user_create, db)
    return user

# --------------------------------------------------
# Endpoint de Login (Obtenção de Token JWT)
# --------------------------------------------------
@router.post("/token", response_model=Token)
async def login_for_access_token(
    form_data: Annotated[OAuth2PasswordRequestForm, Depends()],
    db: Session = Depends(get_session)
):
    """
    Realiza o login de um usuário e retorna um token de acesso JWT.
    Requer 'username' e 'password' no corpo da requisição (x-www-form-urlencoded).
    """
    user = get_user_by_username(form_data.username, db)
    if not user or not verify_password(form_data.password, user.hashed_password):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Credenciais inválidas",
            headers={"WWW-Authenticate": "Bearer"},
        )
    access_token = create_access_token(
        data={"sub": user.username, "role": user.role}
    )
    return {"access_token": access_token, "token_type": "bearer"}


# --------------------------------------------------
# Endpoint de Perfil (Obter e Atualizar)
# --------------------------------------------------
@router.get("/me", response_model=UserRead)
async def read_users_me(current_user: Annotated[User, Depends(get_current_user)]):
    """
    Retorna as informações do usuário atualmente logado.
    Esta rota requer um token JWT válido.
    """
    return current_user

@router.put("/me", response_model=UserRead)
async def update_users_me(
    user_update: UserUpdate,
    current_user: Annotated[User, Depends(get_current_user)],
    db: Session = Depends(get_session)
):
    """
    Atualiza as informações do usuário atualmente logado (ex: username).
    Esta rota requer um token JWT válido.
    """
    if user_update.username and user_update.username != current_user.username:
        existing_user = get_user_by_username(user_update.username, db)
        if existing_user:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Novo nome de usuário já está em uso."
            )

    updated_user = update_user_profile(current_user.id, user_update, db)
    if not updated_user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Usuário não encontrado (erro interno)."
        )
    return updated_user

# --------------------------------------------------
# Endpoint para Alterar Senha
# --------------------------------------------------
@router.put("/me/password", status_code=status.HTTP_204_NO_CONTENT)
async def change_my_password(
    password_update: UserPasswordUpdate,
    current_user: Annotated[User, Depends(get_current_user)],
    db: Session = Depends(get_session)
):
    """
    Permite que o usuário logado altere sua senha.
    Requer a senha atual para verificação.
    """
    if not verify_password(password_update.current_password, current_user.hashed_password):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Senha atual incorreta."
        )

    update_user_password(current_user, password_update.new_password, db)
    return {"message": "Senha alterada com sucesso."}

# --------------------------------------------------
# ENDPOINT: Ranking de Usuários
# --------------------------------------------------
@router.get("/ranking", response_model=List[UserRead])
async def read_users_ranking(
    current_user: Annotated[User, Depends(get_current_user)],
    db: Session = Depends(get_session)
):
    """
    Retorna a classificação de todos os usuários, ordenada por pontos.
    Esta rota requer um token JWT válido.
    """
    ranking_users = get_users_ranking(db)
    return ranking_users

# --------------------------------------------------
# ENDPOINT: ADMINISTRAÇÃO DE USUÁRIOS
# (Exige que o usuário seja um administrador)
# --------------------------------------------------
@router.get("/admin/users", response_model=List[UserRead])
async def read_all_users(
    current_user: Annotated[User, Depends(get_current_active_admin)], # <--- ESTE VEM PRIMEIRO
    db: Session = Depends(get_session) # <--- ESTE VEM DEPOIS
):
    """
    Retorna uma lista de todos os usuários no sistema (apenas para administradores).
    """
    from sqlmodel import select # Reafirma a importação localmente

    users = db.exec(select(User)).all()
    return users