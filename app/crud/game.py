# app/crud/game.py
from typing import List, Optional
from sqlmodel import Session, select, desc, delete
from app.models.game import Game, GameStatus
from app.schemas.game import GameCreate, GameUpdateResult

def create_game(game_create: GameCreate, db: Session) -> Game:
    """
    Cria um novo jogo no banco de dados.
    """
    game = Game.model_validate(game_create)
    db.add(game)
    db.commit()
    db.refresh(game)
    return game

def get_game_by_id(game_id: int, db: Session) -> Optional[Game]:
    """
    Busca um jogo pelo seu ID.
    """
    return db.get(Game, game_id)

def get_games_by_round(round_number: int, db: Session) -> List[Game]:
    """
    Busca todos os jogos de uma rodada específica.
    """
    statement = select(Game).where(Game.round_number == round_number).order_by(Game.game_datetime)
    return db.exec(statement).all()

def update_game_result(game_id: int, game_update: GameUpdateResult, db: Session) -> Optional[Game]:
    """
    Atualiza os resultados e o status de um jogo.
    """
    game = db.get(Game, game_id)
    if not game:
        return None
    
    update_data = game_update.model_dump(exclude_unset=True)
    for key, value in update_data.items():
        setattr(game, key, value)
    
    db.add(game)
    db.commit()
    db.refresh(game)
    return game

def get_all_games(db: Session) -> List[Game]:
    """
    Retorna todos os jogos no banco de dados.
    """
    statement = select(Game).order_by(Game.round_number, Game.game_datetime)
    return db.exec(statement).all()

def delete_game_by_id(game_id: int, db: Session) -> bool:
    """
    Deleta um jogo específico pelo seu ID.
    Retorna True se o jogo foi encontrado e deletado, False caso contrário.
    """
    game = db.get(Game, game_id)
    if game:
        db.delete(game)
        db.commit()
        return True
    return False

def delete_games_by_round(round_number: int, db: Session) -> int:
    """
    Deleta todos os jogos de uma rodada específica.
    Retorna o número de jogos deletados.
    """
    statement = delete(Game).where(Game.round_number == round_number)
    
    result = db.exec(statement)
    db.commit()

    return result.rowcount