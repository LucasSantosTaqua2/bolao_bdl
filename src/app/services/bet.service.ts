// src/app/services/bet.service.ts
import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable } from 'rxjs';

// <<< MUDANÇA AQUI: Importar BetRead do novo arquivo bet.model.ts
import { BetRead } from '../models/bet.model'; // << AGORA IMPORTA DE '../models/bet.model'


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
  private apiUrl = 'https://back-bolao-bdl-production.up.railway.app/api/v1/bets/'; // <<< MUDE PARA A PORTA 8001

  constructor(private http: HttpClient) { }

  private getAuthHeaders(token: string): HttpHeaders {
    return new HttpHeaders().set('Authorization', `Bearer ${token}`);
  }

  submitUserBets(bets: UserBet[], token: string): Observable<BetRead[]> {
    if (!token) {
      return new Observable(observer => observer.error('Token de autenticação ausente.'));
    }
    const headers = this.getAuthHeaders(token);
    return this.http.post<BetRead[]>(`${this.apiUrl}/`, { bets },
  }

  getUserBetsByRound(roundNumber: number, token: string): Observable<BetRead[]> {
    if (!token) {
      return new Observable(observer => observer.error('Token de autenticação ausente.'));
    }
    const headers = this.getAuthHeaders(token);
      return this.http.get<BetRead[]>(`<span class="math-inline">\{this\.apiUrl\}/my\-bets\-by\-round/</span>{roundNumber}`, { headers });
  }
}
