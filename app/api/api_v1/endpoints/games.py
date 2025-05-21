# app/api/api_v1/endpoints/games.py
from typing import Annotated, List
from datetime import datetime
from fastapi import APIRouter, Depends, HTTPException, status, UploadFile, File, Query
from sqlmodel import Session
import openpyxl

from app.core.database import get_session
from app.api.api_v1.endpoints.users import get_current_active_admin, get_current_user
from app.models.game import Game, GameStatus
# CORREÇÃO AQUI: Importe delete_game_by_id e delete_games_by_round
from app.crud.game import (
    create_game,
    get_games_by_round,
    update_game_result,
    get_all_games,
    delete_game_by_id,      # <--- ADICIONE ESTA LINHA
    delete_games_by_round  # <--- ADICIONE ESTA LINHA
)
from app.schemas.game import GameCreate, GameRead, GameUpdateResult

router = APIRouter()

# --------------------------------------------------
# ENDPOINT: Upload de Planilha Excel para Jogos (Rodada agora é parâmetro de query)
# --------------------------------------------------
@router.post("/admin/games/upload-excel", response_model=List[GameRead])
async def upload_games_excel(
    current_admin: Annotated[any, Depends(get_current_active_admin)],
    round_number: Annotated[int, Query(..., ge=1, le=38, description="Número da rodada para os jogos da planilha.")],
    file: UploadFile = File(...),
    db: Session = Depends(get_session)
):
    """
    Faz upload de uma planilha Excel (.xlsx) com jogos para uma rodada específica e os insere no banco de dados.
    A planilha deve ter as colunas: 'mandante', 'visitante', 'data_hora'.
    """
    if not file.filename.endswith('.xlsx'):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Formato de arquivo inválido. Por favor, envie um arquivo .xlsx"
        )

    try:
        workbook = openpyxl.load_workbook(file.file)
        sheet = workbook.active
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Erro ao ler a planilha Excel: {e}. Verifique o formato."
        )

    games_to_create = []
    for row_index, row in enumerate(sheet.iter_rows(min_row=2, values_only=True)):
        if not row or all(cell is None for cell in row):
            continue

        try:
            home_team = str(row[0])
            away_team = str(row[1])
            
            game_datetime_excel = row[2]

            game_datetime: datetime

            if isinstance(game_datetime_excel, datetime):
                game_datetime = game_datetime_excel.replace(tzinfo=None)
            elif isinstance(game_datetime_excel, (int, float)):
                from openpyxl.utils.datetime import from_excel
                game_datetime = from_excel(game_datetime_excel).replace(tzinfo=None)
            else:
                dt_str = str(game_datetime_excel).strip()
                try:
                    game_datetime = datetime.fromisoformat(dt_str)
                except ValueError:
                    try:
                        game_datetime = datetime.strptime(dt_str, '%Y-%m-%d %H:%M:%S')
                    except ValueError:
                        raise ValueError(f"Formato de data/hora desconhecido: '{dt_str}'")

            game_create_data = GameCreate(
                round_number=round_number,
                home_team=home_team,
                away_team=away_team,
                game_datetime=game_datetime
            )
            games_to_create.append(game_create_data)
        except ValueError as ve:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Erro de formato de dado na linha {row_index + 2}: {ve}. Verifique 'data_hora' (formato AAAA-MM-DD HH:MM:SS ou ISO)."
            )
        except Exception as e:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Erro inesperado na linha {row_index + 2}: {e}."
            )

    created_games = []
    for game_data in games_to_create:
        created_games.append(create_game(game_data, db))
    
    return created_games

# --------------------------------------------------
# ENDPOINT: Listar Jogos por Rodada
# --------------------------------------------------
@router.get("/games/{round_number}", response_model=List[GameRead])
async def read_games_by_round(
    round_number: int,
    current_user: Annotated[any, Depends(get_current_user)],
    db: Session = Depends(get_session)
):
    """
    Retorna todos os jogos de uma rodada específica.
    """
    games = get_games_by_round(round_number, db)
    if not games:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Nenhum jogo encontrado para a rodada {round_number}."
        )
    return games

# --------------------------------------------------
# ENDPOINT: Atualizar Resultado de Jogo (Admin)
# --------------------------------------------------
@router.put("/admin/games/{game_id}/result", response_model=GameRead)
async def update_game_scores(
    game_id: int,
    game_update: GameUpdateResult,
    current_admin: Annotated[any, Depends(get_current_active_admin)],
    db: Session = Depends(get_session)
):
    """
    Atualiza o placar e status de um jogo específico (apenas para administradores).
    """
    updated_game = update_game_result(game_id, game_update, db)
    if not updated_game:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Jogo não encontrado.")
    return updated_game

# --------------------------------------------------
# ENDPOINT: Listar Todos os Jogos (Admin)
# --------------------------------------------------
@router.get("/admin/games", response_model=List[GameRead])
async def read_all_games_admin(
    current_admin: Annotated[any, Depends(get_current_active_admin)],
    db: Session = Depends(get_session)
):
    """
    Retorna a lista de todos os jogos cadastrados (apenas para administradores).
    """
    from sqlmodel import select
    from app.models.game import Game

    games = get_all_games(db)
    return games

# --------------------------------------------------
# NOVOS ENDPOINTS: EXCLUSÃO DE JOGOS (ADMIN)
# (Exigem que o usuário seja um administrador)
# --------------------------------------------------

@router.delete("/admin/games/{game_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_single_game(
    game_id: int,
    current_admin: Annotated[any, Depends(get_current_active_admin)], # <--- Parâmetro sem default
    db: Session = Depends(get_session) # <--- Parâmetro com default
):
    """
    Deleta um único jogo pelo seu ID (apenas para administradores).
    """
    deleted = delete_game_by_id(game_id, db)
    if not deleted:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Jogo não encontrado.")
    return {}

@router.delete("/admin/rounds/{round_number}", status_code=status.HTTP_200_OK)
async def delete_round_games(
    round_number: int,
    current_admin: Annotated[any, Depends(get_current_active_admin)], # <--- Parâmetro sem default
    db: Session = Depends(get_session) # <--- Parâmetro com default
):
    """
    Deleta todos os jogos de uma rodada específica (apenas para administradores).
    Retorna o número de jogos deletados.
    """
    deleted_count = delete_games_by_round(round_number, db)
    if deleted_count == 0:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Nenhum jogo encontrado ou deletado para a rodada {round_number}."
        )
    return {"message": f"{deleted_count} jogo(s) da rodada {round_number} foram deletado(s) com sucesso."}