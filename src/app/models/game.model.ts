// src/app/models/game.model.ts
export enum GameStatus {
  SCHEDULED = "scheduled",
  COMPLETED = "completed",
  CANCELED = "canceled",
  FINISHED = "finished"
}

export interface GameCreate {
  home_team: string;
  away_team: string;
  game_datetime: string; // A API geralmente espera string ISO para criação
  round_number: number;
}

// <<< MUDANÇA: Atualizar GameRead para incluir dados da aposta do usuário e flags de UI
export interface GameRead {
  id: number;
  home_team: string;
  away_team: string;
  home_score: number | null; // Placar real do jogo
  away_score: number | null; // Placar real do jogo
  game_datetime: Date;
  round_number: number;
  status: GameStatus;

  // Propriedades para a aposta do usuário (se já existir para este jogo)
  user_bet_home_score?: number | null; // Placar que o usuário apostou (mandante)
  user_bet_away_score?: number | null; // Placar que o usuário apostou (visitante)
  user_bet_id?: number;
  user_bet_is_correct?: boolean;
  user_bet_points_awarded?: number | null; // Pode ser number, null ou undefined

  // Flags para controle da UI no frontend
  can_bet?: boolean; // Se o usuário pode apostar neste jogo
  has_user_bet?: boolean; // Se o usuário já fez uma aposta para este jogo
}

export interface GameUpdateResult {
  home_score: number | null;
  away_score: number | null;
  status: GameStatus;
}