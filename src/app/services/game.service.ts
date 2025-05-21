// src/app/services/game.service.ts
import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { GameRead, GameStatus, GameCreate, GameUpdateResult } from '../models/game.model';


@Injectable({
  providedIn: 'root'
})
export class GameService {
  private apiUrl = 'http://localhost:8000/api/v1/games';

  constructor(private http: HttpClient) { }

  /**
   * Envia uma planilha Excel com jogos para o backend.
   * @param file O arquivo Excel (File) a ser enviado.
   * @param roundNumber O número da rodada para os jogos na planilha.
   * @param accessToken O token JWT do admin.
   * @returns Um Observable com a lista de jogos criados.
   */
  uploadGamesExcel(file: File, roundNumber: number, accessToken: string): Observable<GameRead[]> {
    if (!accessToken) {
      return new Observable(observer => observer.error('Token de autenticação ausente.'));
    }

    const headers = new HttpHeaders({
      'Authorization': `Bearer ${accessToken}`
    });

    const formData = new FormData();
    formData.append('file', file);

    let params = new HttpParams().set('round_number', roundNumber.toString());

    return this.http.post<GameRead[]>(`${this.apiUrl}/admin/games/upload-excel`, formData, { headers, params });
  }

  /**
   * Obtém os jogos de uma rodada específica.
   * @param roundNumber O número da rodada.
   * @param accessToken O token JWT do usuário.
   * @returns Um Observable com a lista de jogos da rodada.
   */
  getGamesByRound(roundNumber: number, accessToken: string): Observable<GameRead[]> {
    if (!accessToken) {
      return new Observable(observer => observer.error('Token de autenticação ausente.'));
    }

    const headers = new HttpHeaders({
      'Authorization': `Bearer ${accessToken}`
    });
    return this.http.get<GameRead[]>(`${this.apiUrl}/${roundNumber}`, { headers });
  }

  /**
   * Atualiza o placar de um jogo.
   * @param gameId O ID do jogo.
   * @param homeScore Placar do mandante.
   * @param awayScore Placar do visitante.
   * @param accessToken O token JWT do admin.
   * @returns Um Observable com o jogo atualizado.
   */
  updateGameResult(gameId: number, homeScore: number, awayScore: number, accessToken: string): Observable<GameRead> {
    if (!accessToken) {
      return new Observable(observer => observer.error('Token de autenticação ausente.'));
    }

    const headers = new HttpHeaders({
      'Authorization': `Bearer ${accessToken}`,
      'Content-Type': 'application/json'
    });

    const body: GameUpdateResult = { home_score: homeScore, away_score: awayScore, status: GameStatus.FINISHED };
    return this.http.put<GameRead>(`${this.apiUrl}/admin/games/${gameId}/result`, body, { headers });
  }

  /**
   * Obtém todos os jogos cadastrados (apenas para admin).
   * @param accessToken O token JWT do admin.
   * @returns Um Observable com a lista de todos os jogos.
   */
  getAllGamesAdmin(accessToken: string): Observable<GameRead[]> {
    if (!accessToken) {
      return new Observable(observer => observer.error('Token de autenticação ausente.'));
    }

    const headers = new HttpHeaders({
      'Authorization': `Bearer ${accessToken}`
    });
    return this.http.get<GameRead[]>(`${this.apiUrl}/admin/games`, { headers });
  }

  /**
   * Deleta um jogo específico pelo ID (apenas para administradores).
   * @param gameId O ID do jogo a ser deletado.
   * @param accessToken O token JWT do admin.
   * @returns Um Observable (sem corpo de resposta para 204 No Content).
   */
  deleteGame(gameId: number, accessToken: string): Observable<any> {
    if (!accessToken) {
      return new Observable(observer => observer.error('Token de autenticação ausente.'));
    }
    const headers = new HttpHeaders({
      'Authorization': `Bearer ${accessToken}`
    });
    return this.http.delete(`${this.apiUrl}/admin/games/${gameId}`, { headers, observe: 'response' });
  }

  /**
   * Deleta todos os jogos de uma rodada específica (apenas para administradores).
   * @param roundNumber A rodada cujos jogos serão deletados.
   * @param accessToken O token JWT do admin.
   * @returns Um Observable com a mensagem de sucesso (número de jogos deletados).
   */
  deleteRoundGames(roundNumber: number, accessToken: string): Observable<any> {
    if (!accessToken) {
      return new Observable(observer => observer.error('Token de autenticação ausente.'));
    }
    const headers = new HttpHeaders({
      'Authorization': `Bearer ${accessToken}`
    });
    // CORREÇÃO AQUI: Use roundNumber (camelCase) na URL, não round_number
    return this.http.delete(`${this.apiUrl}/admin/rounds/${roundNumber}`, { headers });
  }
}