// src/app/services/game.service.ts
import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators'; // Importe o operador 'map'
import { GameRead, GameStatus, GameCreate, GameUpdateResult } from '../models/game.model';


@Injectable({
  providedIn: 'root'
})
export class GameService {
  private apiUrl = 'https://back-bolao-bdl-production.up.railway.app/api/v1/games'; // <<< MUDE PARA A PORTA 8001;

  constructor(private http: HttpClient) { }

  /**
   * Função auxiliar para converter strings de data/hora ISO recebidas da API para objetos Date.
   * Isso garante que os componentes recebam GameRead com game_datetime como Date.
   */
  private parseGameDates(game: any): GameRead {
    return {
      ...game,
      game_datetime: new Date(game.game_datetime), // Converte a string ISO para objeto Date
    } as GameRead; // Assegura que o tipo final é GameRead
  }

  private getAuthHeaders(token: string): HttpHeaders {
    return new HttpHeaders().set('Authorization', `Bearer ${token}`);
  }

  /**
   * Envia uma planilha Excel com jogos para o backend (criação de jogos).
   * @param file O arquivo Excel (.xlsx) a ser enviado.
   * @param roundNumber O número da rodada para os jogos na planilha.
   * @param accessToken O token JWT do admin.
   * @returns Um Observable com a lista de jogos criados.
   */
  uploadGamesExcel(file: File, roundNumber: number, accessToken: string): Observable<GameRead[]> {
    if (!accessToken) {
      return new Observable(observer => observer.error('Token de autenticação ausente.'));
    }

    const headers = this.getAuthHeaders(accessToken);

    const formData = new FormData();
    formData.append('file', file);

    let params = new HttpParams().set('round_number', roundNumber.toString());

    return this.http.post<any[]>(`${this.apiUrl}/admin/games/upload-excel`, formData, { headers, params }).pipe(
      map(games => games.map(this.parseGameDates))
    );
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

    const headers = this.getAuthHeaders(accessToken);
    return this.http.get<any[]>(`${this.apiUrl}/${roundNumber}`, { headers }).pipe(
      map(games => games.map(this.parseGameDates))
    );
  }

  /**
   * Atualiza o placar de um jogo (admin).
   * @param gameId O ID do jogo.
   * @param homeScore Placar do mandante (pode ser null se ainda não preenchido).
   * @param awayScore Placar do visitante (pode ser null se ainda não preenchido).
   * @param accessToken O token JWT do admin.
   * @returns Um Observable com o jogo atualizado.
   */
  updateGameResult(gameId: number, homeScore: number | null, awayScore: number | null, accessToken: string): Observable<GameRead> {
    if (!accessToken) {
      return new Observable(observer => observer.error('Token de autenticação ausente.'));
    }

    const headers = this.getAuthHeaders(accessToken);

    const body: GameUpdateResult = {
        home_score: homeScore,
        away_score: awayScore,
        status: GameStatus.FINISHED // Assume que ao atualizar placar, o jogo está finalizado
    };

    return this.http.put<any>(`${this.apiUrl}/admin/games/${gameId}/result`, body, { headers }).pipe(
      map(this.parseGameDates)
    );
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

    const headers = this.getAuthHeaders(accessToken);
    return this.http.get<any[]>(`${this.apiUrl}/admin/games`, { headers }).pipe(
      map(games => games.map(this.parseGameDates))
    );
  }

  /**
   * NOVO MÉTODO: Obtém todos os jogos visíveis para usuários comuns.
   * @param accessToken O token JWT do usuário.
   * @returns Um Observable com a lista de todos os jogos visíveis para usuários.
   */
  getAllGamesForUser(accessToken: string): Observable<GameRead[]> {
    if (!accessToken) {
      return new Observable(observer => observer.error('Token de autenticação ausente.'));
    }
    const headers = this.getAuthHeaders(accessToken);
    // Este endpoint '/all' deve ser o que você criou no backend para usuários comuns
    return this.http.get<any[]>(`${this.apiUrl}/all`, { headers }).pipe(
      map(games => games.map(this.parseGameDates))
    );
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
    const headers = this.getAuthHeaders(accessToken);
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
    const headers = this.getAuthHeaders(accessToken);
    return this.http.delete(`${this.apiUrl}/admin/rounds/${roundNumber}`, { headers });
  }

  /**
   * Faz o download de uma planilha Excel com jogos de uma rodada para preencher resultados.
   * @param roundNumber A rodada para a qual baixar a planilha.
   * @param accessToken O token JWT do admin.
   * @returns Um Observable com o Blob do arquivo Excel.
   */
  downloadResultsTemplate(roundNumber: number, accessToken: string): Observable<Blob> {
    if (!accessToken) {
      return new Observable(observer => observer.error('Token de autenticação ausente.'));
    }
    const headers = this.getAuthHeaders(accessToken);
    return this.http.get(`${this.apiUrl}/admin/games/download-results-template/${roundNumber}`, { headers, responseType: 'blob' });
  }

  /**
   * Faz upload de uma planilha Excel com resultados de jogos para atualizar.
   * @param file O arquivo Excel (.xlsx) com os resultados.
   * @param accessToken O token JWT do admin.
   * @returns Um Observable com a lista de jogos atualizados.
   */
  uploadResultsExcel(file: File, accessToken: string): Observable<GameRead[]> {
    if (!accessToken) {
      return new Observable(observer => observer.error('Token de autenticação ausente.'));
    }

    const headers = this.getAuthHeaders(accessToken);

    const formData = new FormData();
    formData.append('file', file);

    return this.http.post<any[]>(`${this.apiUrl}/admin/games/upload-results-excel`, formData, { headers }).pipe(
      map(games => games.map(this.parseGameDates))
    );
  }
}