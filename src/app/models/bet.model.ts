// src/app/models/bet.model.ts
// Interfaces TypeScript para os schemas de aposta do backend

export interface BetCreate {
  game_id: number;
  home_score_bet: number;
  away_score_bet: number;
}

export interface BetRead {
  id: number;
  user_id: number;
  game_id: number;
  home_score_bet: number;
  away_score_bet: number;
  is_correct?: boolean; // Optional no frontend, pode vir como null
  points_awarded?: number; // Optional no frontend, pode vir como null
  created_at: string; // Vem como string ISO do backend, Angular formata
  updated_at: string; // Vem como string ISO do backend, Angular formata
}

export interface BetsSubmissionRequest {
  bets: BetCreate[];
}