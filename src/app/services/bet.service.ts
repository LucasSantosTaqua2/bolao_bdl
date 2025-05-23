// src/app/services/bet.service.ts
import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable } from 'rxjs';

import { BetRead } from '../models/bet.model'; // Assegure-se que o caminho para bet.model.ts está correto

// Interface para a aposta individual que será enviada à API
export interface UserBet {
  game_id: number;
  home_score_bet: number;
  away_score_bet: number;
}

@Injectable({
  providedIn: 'root'
})
export class BetService {
  // apiUrl termina com / para consistência com o endpoint POST que usa a URL base diretamente.
  private apiUrl = 'https://back-bolao-bdl-production.up.railway.app/api/v1/bets/';

  constructor(private http: HttpClient) { }

  private getAuthHeaders(token: string): HttpHeaders {
    return new HttpHeaders().set('Authorization', `Bearer ${token}`);
  }

  submitUserBets(bets: UserBet[], token: string): Observable<BetRead[]> {
    if (!token) {
      return new Observable(observer => observer.error('Token de autenticação ausente.'));
    }
    const headers = this.getAuthHeaders(token);
    // A chamada POST usa this.apiUrl diretamente, que já tem a barra final.
    // O backend espera POST em /api/v1/bets/
    return this.http.post<BetRead[]>(this.apiUrl, { bets }, { headers });
  }

  getUserBetsByRound(roundNumber: number, token: string): Observable<BetRead[]> {
    if (!token) {
      return new Observable(observer => observer.error('Token de autenticação ausente.'));
    }
    const headers = this.getAuthHeaders(token);
    // CORRIGIDO: Removida a barra extra aqui.
    // this.apiUrl já termina com '/', então o caminho construído será .../api/v1/bets/my-bets-by-round/{roundNumber}
    return this.http.get<BetRead[]>(`${this.apiUrl}my-bets-by-round/${roundNumber}`, { headers });
  }
}
