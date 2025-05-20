// src/app/services/auth.service.ts
import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http'; // <--- Importe HttpClient
import { Observable } from 'rxjs'; // Para trabalhar com Observables (requisições assíncronas)

@Injectable({
  providedIn: 'root' // Isso faz com que o serviço seja um singleton e esteja disponível em toda a aplicação
})
export class AuthService {
  // Ajuste a URL base da sua API FastAPI
  private apiUrl = 'http://localhost:8000/api/v1/users'; // URL do endpoint de usuários

  constructor(private http: HttpClient) { } // Injeção do HttpClient

  /**
   * Envia os dados de registro para a API.
   * @param userData Um objeto contendo username e password.
   * @returns Um Observable com a resposta da API.
   */
  register(userData: { username: string; password: string }): Observable<any> {
    return this.http.post(`${this.apiUrl}/register`, userData);
  }

  // Você adicionará o método de login aqui no futuro
  // login(credentials: { username: string; password: string }): Observable<any> {
  //   // Para o endpoint /token, FastAPI espera 'x-www-form-urlencoded'
  //   // Então, você precisará de um FormData ou de HttpParams
  //   const body = new URLSearchParams();
  //   body.set('username', credentials.username);
  //   body.set('password', credentials.password);

  //   return this.http.post(`${this.apiUrl}/token`, body.toString(), {
  //     headers: { 'Content-Type': 'application/x-www-form-urlencoded' }
  //   });
  // }
}