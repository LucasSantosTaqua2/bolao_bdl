// src/app/app.routes.ts
import { Routes } from '@angular/router';
import { HomeComponent } from './pages/home/home.component';
import { RankingComponent } from './pages/ranking/ranking.component';
import { LoginComponent } from './pages/login/login.component';
import { RegisterComponent } from './pages/register/register.component';
import { ApostasComponent } from './pages/apostas/apostas.component';

// Importe os Guards
import { authGuard } from './guards/auth.guard';
import { adminGuard } from './guards/admin.guard'; // Se você criar uma rota para admins
import { ProfileComponent } from './pages/profile/profile.component';


export const routes: Routes = [
  // Rotas públicas (não exigem autenticação)
  {
    path: 'login',
    component: LoginComponent
  },
  {
    path: 'register',
    component: RegisterComponent
  },

  // Rotas protegidas (exigem que o usuário esteja logado)
  {
    path: '', // Rota principal, geralmente a home page
    component: HomeComponent,
    canActivate: [authGuard] // <--- Protegido pelo AuthGuard
  },
  {
    path: 'ranking',
    component: RankingComponent,
    canActivate: [authGuard] // <--- Protegido pelo AuthGuard
  },
  {
    path: 'apostar',
    component: ApostasComponent,
    canActivate: [authGuard] // <--- Protegido pelo AuthGuard
  },
  {
    path: 'profile', // <--- Nova rota para o perfil
    component: ProfileComponent,
    canActivate: [authGuard] // <--- Protegida pelo AuthGuard
  },
  // Exemplo de rota para administradores (crie um componente AdminPanelComponent)
  // {
  //   path: 'admin',
  //   component: AdminPanelComponent,
  //   canActivate: [adminGuard] // <--- Protegido pelo AdminGuard
  // },

  // Redirecionamento padrão para login se a URL estiver vazia e não estiver logado
  // Note: O AuthGuard no path: '' já lida com isso em parte.
  // Você pode querer que a rota padrão seja algo como um 'welcome' público, se houver.
  // Por enquanto, se a rota padrão é protegida, o usuário será redirecionado para /login.
  {
    path: '**', // Rota curinga para qualquer URL não encontrada
    redirectTo: '', // Redireciona para a home, que será protegida pelo AuthGuard
    pathMatch: 'full'
  }
];