// src/app/services/ranking.service.ts
import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable } from 'rxjs';
import { UserProfile } from './auth.service'; // <--- Importe UserProfile do AuthService (onde ela está definida)

@Injectable({
  providedIn: 'root' // Isso faz com que o serviço seja um singleton e esteja disponível em toda a aplicação
})
export class RankingService {
  // Ajuste a URL base da sua API FastAPI para o endpoint de ranking
  private apiUrl = 'http://localhost:8000/api/v1/users/ranking'; // Endpoint direto do ranking

  constructor(private http: HttpClient) { } // Injeção do HttpClient

  getRanking(accessToken: string): Observable<UserProfile[]> {
    if (!accessToken) {
      // Se não há token, o usuário não está logado. Retorna um Observable de erro.
      return new Observable(observer => observer.error('Token de autenticação ausente.'));
    }

    const headers = new HttpHeaders({
      'Authorization': `Bearer ${accessToken}`
    });
    // O endpoint é diretamente o /ranking
    return this.http.get<UserProfile[]>(this.apiUrl, { headers });
  }
}