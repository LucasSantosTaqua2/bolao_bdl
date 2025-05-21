// // src/app/services/auth.service.ts
// import { Injectable } from '@angular/core';
// import { HttpClient, HttpHeaders } from '@angular/common/http';
// import { Observable, BehaviorSubject } from 'rxjs';
// import { map, take, tap } from 'rxjs/operators';
// import { jwtDecode } from 'jwt-decode';

// export enum UserRole {
//   USER = 'user',
//   ADMIN = 'admin',
// }

// // Interfaces para tipar os dados do usuário e de atualização
// // (Você pode querer criar um arquivo 'user.model.ts' para isso, mas aqui é mais rápido)
// export interface UserProfile {
//   id: number;
//   username: string;
//   role: UserRole;
//   points: number; // <--- Adicionado o campo 'points'
//   created_at: string; // Ou Date, se você for converter no front
//   updated_at: string; // Ou Date
// }

// export interface UserUpdateData {
//   username?: string; // Opcional, pois pode ser que só a senha mude
// }

// export interface UserPasswordUpdateData {
//   current_password: string;
//   new_password: string;
// }

// @Injectable({
//   providedIn: 'root',
// })
// export class AuthService {
//   private apiUrl = 'http://localhost:8000/api/v1/users';

//   private _isLoggedIn = new BehaviorSubject<boolean>(this.hasToken());
//   isLoggedIn$ = this._isLoggedIn.asObservable();

//   private _currentUserUsername = new BehaviorSubject<string | null>(null);
//   currentUserUsername$ = this._currentUserUsername.asObservable();

//   private _currentUserRole = new BehaviorSubject<UserRole | null>(null);
//   currentUserRole$ = this._currentUserRole.asObservable();

//   constructor(private http: HttpClient) {
//     if (this.hasToken()) {
//       this.decodeAndSetUser();
//     }
//   }

//   private hasToken(): boolean {
//     return !!localStorage.getItem('access_token');
//   }

//   private decodeAndSetUser(): void {
//     const token = this.getAccessToken();
//     if (token) {
//       try {
//         const decodedToken: any = jwtDecode(token);
//         this._currentUserUsername.next(decodedToken.sub || null);
//         this._currentUserRole.next(decodedToken.role as UserRole || UserRole.USER);
//       } catch (error) {
//         console.error(
//           'Erro ao decodificar o token JWT. Token pode estar inválido ou expirado:',
//           error
//         );
//         this.logout();
//       }
//     } else {
//       this._currentUserUsername.next(null);
//       this._currentUserRole.next(null);
//     }
//   }

//   register(userData: { username: string; password: string }): Observable<any> {
//     return this.http.post(`${this.apiUrl}/register`, userData);
//   }

//   login(credentials: { username: string; password: string }): Observable<any> {
//     const body = new URLSearchParams();
//     body.set('username', credentials.username);
//     body.set('password', credentials.password);

//     const headers = new HttpHeaders({
//       'Content-Type': 'application/x-www-form-urlencoded',
//     });

//     return this.http.post(`${this.apiUrl}/token`, body.toString(), { headers }).pipe(
//       tap((response: any) => {
//         localStorage.setItem('access_token', response.access_token);
//         localStorage.setItem('token_type', response.token_type);
//         this._isLoggedIn.next(true);
//         this.decodeAndSetUser();
//       })
//     );
//   }

//   logout(): void {
//     localStorage.removeItem('access_token');
//     localStorage.removeItem('token_type');
//     this._isLoggedIn.next(false);
//     this._currentUserUsername.next(null);
//     this._currentUserRole.next(null);
//   }

//   getAccessToken(): string | null {
//     return localStorage.getItem('access_token');
//   }

//   hasRole(requiredRole: UserRole): Observable<boolean> {
//     return this.currentUserRole$.pipe(map((role) => role === requiredRole), take(1));
//   }

//   isAuthenticated(): Observable<boolean> {
//     return this.isLoggedIn$.pipe(take(1));
//   }

//   // ----------------------------------------------------
//   // NOVOS MÉTODOS PARA O PERFIL DO USUÁRIO
//   // ----------------------------------------------------

//   /**
//    * Obtém os dados do perfil do usuário logado.
//    * @returns Um Observable com os dados do perfil (UserProfile).
//    */
//   getProfile(): Observable<UserProfile> {
//     const token = this.getAccessToken();
//     if (!token) {
//       // Se não há token, o usuário não está logado. Retorna um Observable de erro ou completa.
//       return new Observable((observer) => observer.error('Usuário não autenticado.'));
//     }

//     const headers = new HttpHeaders({
//       Authorization: `Bearer ${token}`,
//     });
//     return this.http.get<UserProfile>(`${this.apiUrl}/me`, { headers });
//   }

//   /**
//    * Atualiza o nome de usuário (ou outros dados de perfil).
//    * @param userData Os dados a serem atualizados (UserUpdateData).
//    * @returns Um Observable com o perfil atualizado.
//    */
//   updateProfile(userData: UserUpdateData): Observable<UserProfile> {
//     const token = this.getAccessToken();
//     if (!token) {
//       return new Observable((observer) => observer.error('Usuário não autenticado.'));
//     }

//     const headers = new HttpHeaders({
//       Authorization: `Bearer ${token}`,
//       'Content-Type': 'application/json', // O FastAPI espera JSON para PUT /me
//     });
//     return this.http.put<UserProfile>(`${this.apiUrl}/me`, userData, { headers }).pipe(
//       tap((updatedProfile) => {
//         // Se o username for atualizado, precisamos atualizar o BehaviorSubject
//         this._currentUserUsername.next(updatedProfile.username);
//       })
//     );
//   }

//   /**
//    * Altera a senha do usuário logado.
//    * @param passwordData Objeto com a senha atual e a nova senha.
//    * @returns Um Observable (sem corpo de resposta para 204 No Content).
//    */
//   changePassword(passwordData: UserPasswordUpdateData): Observable<any> {
//     const token = this.getAccessToken();
//     if (!token) {
//       return new Observable((observer) => observer.error('Usuário não autenticado.'));
//     }

//     const headers = new HttpHeaders({
//       Authorization: `Bearer ${token}`,
//       'Content-Type': 'application/json', // O FastAPI espera JSON para PUT /me/password
//     });
//     // O backend retorna 204 No Content, então não esperamos um corpo de resposta.
//     return this.http.put(`${this.apiUrl}/me/password`, passwordData, {
//       headers,
//       observe: 'response',
//     });
//   }
// }

// src/app/services/auth.service.ts
import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable, BehaviorSubject } from 'rxjs'; // <--- Mantenha BehaviorSubject aqui
import { map, take, tap } from 'rxjs/operators';
import { jwtDecode } from 'jwt-decode';

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

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private apiUrl = 'http://localhost:8000/api/v1/users';

  // Declarar como BehaviorSubject
  private _isLoggedIn = new BehaviorSubject<boolean>(this.hasToken());
  public isLoggedIn$ = this._isLoggedIn; // <--- Expor diretamente o BehaviorSubject

  // Declarar como BehaviorSubject
  private _currentUserUsername = new BehaviorSubject<string | null>(null);
  public currentUserUsername$ = this._currentUserUsername; // <--- Expor diretamente o BehaviorSubject

  // Declarar como BehaviorSubject
  private _currentUserRole = new BehaviorSubject<UserRole | null>(null);
  public currentUserRole$ = this._currentUserRole; // <--- Expor diretamente o BehaviorSubject


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
}