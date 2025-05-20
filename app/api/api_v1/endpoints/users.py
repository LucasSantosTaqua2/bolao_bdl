from typing import Annotated

from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.security import OAuth2PasswordRequestForm # Para o formulário de login padrão do OAuth2
from sqlmodel import Session

from app.core.security import create_access_token, verify_password, Token # Importe Token
from app.core.database import get_session # Importe a dependência de sessão do DB
from app.crud.user import create_user, get_user_by_username, get_user_by_id # Importe as funções CRUD
from app.models.user import User # Importe o modelo User
from app.schemas.user import UserCreate, UserRead # Importe os schemas de usuário

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
    # Verifica se o username já existe
    db_user = get_user_by_username(user_create.username, db)
    if db_user:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Nome de usuário já registrado."
        )

    # Cria o usuário usando a função CRUD
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
    # Se as credenciais forem válidas, cria o token
    access_token = create_access_token(
        data={"sub": user.username} # 'sub' (subject) é o padrão para o identificador do usuário no JWT
    )
    return {"access_token": access_token, "token_type": "bearer"}

# --------------------------------------------------
# Dependência para Usuário Atual (Proteção de Rotas)
# --------------------------------------------------
# Isso será usado para proteger rotas que exigem autenticação
from fastapi.security import OAuth2PasswordBearer
from jose import JWTError, jwt
from app.core.config import settings
from app.schemas.user import UserRead # Importe UserRead para a resposta

# Define o esquema de segurança OAuth2 (onde o token será buscado)
oauth2_scheme = OAuth2PasswordBearer(tokenUrl="/api/v1/users/token") # Aponta para o endpoint de login

async def get_current_user(
    token: Annotated[str, Depends(oauth2_scheme)],
    db: Session = Depends(get_session)
) -> User:
    """
    Verifica o token JWT e retorna o objeto do usuário logado.
    Lança HTTPException 401 se o token for inválido ou ausente.
    """
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Não foi possível validar as credenciais",
        headers={"WWW-Authenticate": "Bearer"},
    )
    try:
        # Decodifica o token usando a chave secreta e o algoritmo
        payload = jwt.decode(token, settings.SECRET_KEY, algorithms=[settings.ALGORITHM])
        username: str = payload.get("sub") # Pega o 'sub' (subject) do payload
        if username is None:
            raise credentials_exception
        # token_data = TokenData(username=username) # Se fosse usar o TokenData
    except JWTError:
        raise credentials_exception

    user = get_user_by_username(username, db) # Busca o usuário no BD
    if user is None:
        raise credentials_exception
    return user

# --------------------------------------------------
# Exemplo de Endpoint Protegido (Requer Autenticação)
# --------------------------------------------------
@router.get("/me", response_model=UserRead)
async def read_users_me(current_user: Annotated[User, Depends(get_current_user)]):
    """
    Retorna as informações do usuário atualmente logado.
    Esta rota requer um token JWT válido.
    """
    return current_user