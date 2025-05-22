// src/app/models/user.model.ts
// Interfaces TypeScript para os schemas de usuário do backend

export enum UserRole {
  USER = 'user',
  ADMIN = 'admin'
}

export interface UserBase {
  username: string;
  role?: UserRole; // Optional na entrada para criação
}

export interface UserCreate extends UserBase {
  password: string;
}

export interface UserRead extends UserBase {
  id: number;
  role: UserRole;
  points: number;
  created_at: string; // Vem como string ISO do backend
  updated_at: string; // Vem como string ISO do backend
}

// UserProfile é a interface que você já usa em AuthService
export interface UserProfile extends UserRead {
  // UserProfile é basicamente o UserRead completo
  // Se houver campos adicionais que só o backend retorna para perfil completo, adicione aqui.
  // Ex: is_active?: boolean;
}

export interface UserUpdate {
  username?: string;
}

export interface UserPasswordUpdate {
  current_password: string;
  new_password: string;
}