# app/api/v1/endpoints/users.py
from typing import Annotated, List, Any

from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.security import OAuth2PasswordRequestForm
from sqlalchemy.orm import Session # <<< MUDANÇA: Use Session do SQLAlchemy ORM
from sqlalchemy import select # <<< MUDANÇA: Use select do SQLAlchemy principal
from datetime import datetime, timezone # <<< Adicione timezone

from app.core.security import create_access_token, verify_password, Token # <<< Token e funções de segurança vêm do core.security
from app.core.database import get_session # Importe sua função para obter a sessão do DB
# MUDANÇA: Importe get_current_user e get_current_active_admin do core.security
from app.core.security import get_current_user, get_current_active_admin
# Importe as funções CRUD do seu arquivo app/crud/user.py (que será atualizado)
from app.crud.user import (
    create_user,
    get_user_by_username,
    get_user_by_id,
    update_user_profile,
    update_user_password,
    get_users_ranking
)
from app.models.user import User, UserRole # <<< Mantenha User e UserRole de app.models.user
from app.schemas.user import UserCreate, UserRead, UserUpdate, UserPasswordUpdate # <<< Mantenha schemas

router = APIRouter()

# --------------------------------------------------
# Endpoint de Registro de Usuário
# --------------------------------------------------
@router.post("/register", response_model=UserRead, status_code=status.HTTP_201_CREATED)
def register_user(user_create: UserCreate, db: Session = Depends(get_session)):
    """
    Registra um novo usuário no sistema.
    Retorna os dados do usuário registrado (sem a senha).
    """
    # MUDANÇA: get_user_by_username agora é uma função CRUD para SQLAlchemy Puro
    db_user = get_user_by_username(user_create.username, db)
    if db_user:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Nome de usuário já registrado."
        )

    # MUDANÇA: create_user agora é uma função CRUD para SQLAlchemy Puro
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
    # MUDANÇA: get_user_by_username agora é uma função CRUD para SQLAlchemy Puro
    user = get_user_by_username(form_data.username, db)
    if not user or not verify_password(form_data.password, user.hashed_password):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Credenciais inválidas",
            headers={"WWW-Authenticate": "Bearer"},
        )
    # create_access_token e verify_password vêm do core.security
    access_token = create_access_token(
        data={"sub": user.username, "role": user.role}
    )
    return {"access_token": access_token, "token_type": "bearer"}


# --------------------------------------------------
# Endpoint de Perfil (Obter e Atualizar)
# --------------------------------------------------
@router.get("/me", response_model=UserRead)
async def read_users_me(current_user: Annotated[User, Depends(get_current_user)]): # get_current_user vem do core.security
    """
    Retorna as informações do usuário atualmente logado.
    Esta rota requer um token JWT válido.
    """
    return current_user

@router.put("/me", response_model=UserRead)
async def update_users_me(
    user_update: UserUpdate,
    current_user: Annotated[User, Depends(get_current_user)], # get_current_user vem do core.security
    db: Session = Depends(get_session)
):
    """
    Atualiza as informações do usuário atualmente logado (ex: username).
    Esta rota requer um token JWT válido.
    """
    if user_update.username and user_update.username != current_user.username:
        # MUDANÇA: get_user_by_username agora é uma função CRUD para SQLAlchemy Puro
        existing_user = get_user_by_username(user_update.username, db)
        if existing_user:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Novo nome de usuário já está em uso."
            )

    # MUDANÇA: update_user_profile agora é uma função CRUD para SQLAlchemy Puro
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
    current_user: Annotated[User, Depends(get_current_user)], # get_current_user vem do core.security
    db: Session = Depends(get_session)
):
    """
    Permite que o usuário logado altere sua senha.
    Requer a senha atual para verificação.
    """
    # verify_password vem do app.core.security
    if not verify_password(password_update.current_password, current_user.hashed_password):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Senha atual incorreta."
        )

    # MUDANÇA: update_user_password agora é uma função CRUD para SQLAlchemy Puro
    update_user_password(current_user, password_update.new_password, db)
    # Retornar uma resposta vazia para 204 No Content
    return Response(status_code=status.HTTP_204_NO_CONTENT)


# --------------------------------------------------
# ENDPOINT: Ranking de Usuários
# --------------------------------------------------
@router.get("/ranking", response_model=List[UserRead])
async def read_users_ranking(
    current_user: Annotated[User, Depends(get_current_user)], # get_current_user vem do core.security
    db: Session = Depends(get_session)
):
    """
    Retorna a classificação de todos os usuários, ordenada por pontos.
    Esta rota requer um token JWT válido.
    """
    # MUDANÇA: get_users_ranking agora é uma função CRUD para SQLAlchemy Puro
    ranking_users = get_users_ranking(db)
    return ranking_users

# --------------------------------------------------
# ENDPOINT: ADMINISTRAÇÃO DE USUÁRIOS
# (Exige que o usuário seja um administrador)
# --------------------------------------------------
@router.get("/admin/users", response_model=List[UserRead])
async def read_all_users(
    current_user: Annotated[User, Depends(get_current_active_admin)], # get_current_active_admin vem do core.security
    db: Session = Depends(get_session)
):
    """
    Retorna uma lista de todos os usuários no sistema (apenas para administradores).
    """
    # MUDANÇA: Consulta direta com SQLAlchemy
    users = db.execute(select(User)).scalars().all() # MUDANÇA AQUI
    return users