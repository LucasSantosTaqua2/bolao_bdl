// src/app/models/game.model.ts

// Enum para o status do jogo (espelha o GameStatus do Python)
export enum GameStatus {
    SCHEDULED = 'scheduled',
    FINISHED = 'finished',
    POSTPONED = 'postponed',
    CANCELED = 'canceled',
  }
  
  // Interface para GameBase (campos comuns)
  export interface GameBase {
    round_number: number;
    home_team: string;
    away_team: string;
    game_datetime: string; // String ISO 8601 do backend
  }
  
  // Interface para GameCreate (o que o admin envia para criar um jogo)
  export interface GameCreate extends GameBase {}
  
  // Interface para GameUpdateResult (o que o admin envia para atualizar placar)
  export interface GameUpdateResult {
    home_score?: number;
    away_score?: number;
    status?: GameStatus;
  }
  
  // Interface para GameRead (o que a API retorna ao ler um jogo)
  export interface GameRead extends GameBase {
    id: number;
    home_score: number | null;
    away_score: number | null;
    status: GameStatus;
    created_at: string; // String ISO 8601 do backend
    updated_at: string; // String ISO 8601 do backend
  }