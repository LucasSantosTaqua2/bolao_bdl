// src/app/services/auth.service.ts
import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable, BehaviorSubject } from 'rxjs';
import { map, take, tap } from 'rxjs/operators';
import { jwtDecode } from 'jwt-decode';

// <<< MUDANÇA: AGORA IMPORTA DE app/models/user.model.ts APENAS
import { UserRole, UserProfile, UserUpdate as UserUpdateData, UserPasswordUpdate as UserPasswordUpdateData } from '../models/user.model';

// <<< REMOVER ESTAS DEFINIÇÕES DUPLICADAS >>>
/*
export enum UserRole {
  USER = 'user',
  ADMIN = 'admin'
}

export interface UserProfile {
  id: number;
  username: string;
  role: UserRole;
  points: number;
  created_at: string;
  updated_at: string;
}

export interface UserUpdateData {
  username?: string;
}

export interface UserPasswordUpdateData {
  current_password: string;
  new_password: string;
}
*/
// <<< FIM DAS DEFINIÇÕES DUPLICADAS A REMOVER >>>


@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private apiUrl = 'http://localhost:8001/api/v1/users'; // <<< MUDE PARA A PORTA 8001

  private _isLoggedIn = new BehaviorSubject<boolean>(this.hasToken());
  public isLoggedIn$ = this._isLoggedIn;

  private _currentUserUsername = new BehaviorSubject<string | null>(null);
  public currentUserUsername$ = this._currentUserUsername;

  private _currentUserRole = new BehaviorSubject<UserRole | null>(null);
  public currentUserRole$ = this._currentUserRole;


  constructor(private http: HttpClient) {
    if (this.hasToken()) {
      this.decodeAndSetUser();
    }
  }

  private hasToken(): boolean {
    return !!localStorage.getItem('access_token');
  }

  private decodeAndSetUser(): void {
    const token = this.getAccessToken();
    if (token) {
      try {
        const decodedToken: any = jwtDecode(token);
        this._currentUserUsername.next(decodedToken.sub || null);
        this._currentUserRole.next(decodedToken.role as UserRole || UserRole.USER);
      } catch (error) {
        console.error('Erro ao decodificar o token JWT. Token pode estar inválido ou expirado:', error);
        this.logout();
      }
    } else {
      this._currentUserUsername.next(null);
      this._currentUserRole.next(null);
    }
  }

  register(userData: { username: string; password: string }): Observable<any> {
    return this.http.post(`${this.apiUrl}/register`, userData);
  }

  login(credentials: { username: string; password: string }): Observable<any> {
    const body = new URLSearchParams();
    body.set('username', credentials.username);
    body.set('password', credentials.password);

    const headers = new HttpHeaders({ 'Content-Type': 'application/x-www-form-urlencoded' });

    return this.http.post(`${this.apiUrl}/token`, body.toString(), { headers }).pipe(
      tap((response: any) => {
        localStorage.setItem('access_token', response.access_token);
        localStorage.setItem('token_type', response.token_type);
        this._isLoggedIn.next(true);
        this.decodeAndSetUser();
      })
    );
  }

  logout(): void {
    localStorage.removeItem('access_token');
    localStorage.removeItem('token_type');
    this._isLoggedIn.next(false);
    this._currentUserUsername.next(null);
    this._currentUserRole.next(null);
  }

  getAccessToken(): string | null {
    return localStorage.getItem('access_token');
  }

  hasRole(requiredRole: UserRole): Observable<boolean> {
    return this.currentUserRole$.pipe(
      map(role => role === requiredRole),
      take(1)
    );
  }

  isAuthenticated(): Observable<boolean> {
    return this.isLoggedIn$.pipe(take(1));
  }

  getProfile(): Observable<UserProfile> {
    const token = this.getAccessToken();
    if (!token) {
      return new Observable(observer => observer.error('Usuário não autenticado.'));
    }

    const headers = new HttpHeaders({
      'Authorization': `Bearer ${token}`
    });
    return this.http.get<UserProfile>(`${this.apiUrl}/me`, { headers });
  }

  updateProfile(userData: UserUpdateData): Observable<UserProfile> {
    const token = this.getAccessToken();
    if (!token) {
      return new Observable(observer => observer.error('Usuário não autenticado.'));
    }

    const headers = new HttpHeaders({
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    });
    return this.http.put<UserProfile>(`${this.apiUrl}/me`, userData, { headers }).pipe(
        tap(updatedProfile => {
            this._currentUserUsername.next(updatedProfile.username);
        })
    );
  }

  changePassword(passwordData: UserPasswordUpdateData): Observable<any> {
    const token = this.getAccessToken();
    if (!token) {
      return new Observable(observer => observer.error('Usuário não autenticado.'));
    }

    const headers = new HttpHeaders({
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    });
    return this.http.put(`${this.apiUrl}/me/password`, passwordData, { headers, observe: 'response' });
  }

  /**
   * Obtém a lista completa de todos os usuários (apenas para administradores).
   * @returns Um Observable com uma lista de UserProfile.
   */
  getAllUsersForAdmin(): Observable<UserProfile[]> {
    const token = this.getAccessToken();
    if (!token) {
      return new Observable(observer => observer.error('Usuário não autenticado.'));
    }
    const headers = new HttpHeaders({
      'Authorization': `Bearer ${token}`
    });
    return this.http.get<UserProfile[]>(`${this.apiUrl}/admin/users`, { headers });
  }
}

export { UserRole };
