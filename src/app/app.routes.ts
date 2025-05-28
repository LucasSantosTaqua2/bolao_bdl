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
import { AdminPanelComponent } from './pages/admin-panel/admin-panel.component';
import { ApostarComponent } from './pages/apostar/apostar.component';
import { MinigameComponent } from './pages/minigame/minigame.component';
import { MinigameAcerteEscudoComponent } from './pages/minigames/minigame-acerte-escudo/minigame-acerte-escudo.component';
import { MinigameMemoriaComponent } from './pages/minigames/minigame-memoria/minigame-memoria.component';
import { MinigameAdivinheTimeComponent } from './pages/minigames/minigame-adivinhe-time/minigame-adivinhe-time.component';
import { MinigameMonteRankingComponent } from './pages/minigames/minigame-monte-ranking/minigame-monte-ranking.component';
import { MinigameCacaEmblemasComponent } from './pages/minigames/minigame-caca-emblemas/minigame-caca-emblemas.component';
import { MinigameTimeSonhosComponent } from './pages/minigames/minigame-time-sonhos/minigame-time-sonhos.component';


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
    component: ApostarComponent,
    canActivate: [authGuard] // <--- Protegido pelo AuthGuard
  },
  {
    path: 'minigames',
    component: MinigameComponent,
    // canActivate: [authGuard] // <--- Protegido pelo AuthGuard
  },
  {
    path: 'minigames/acerte-o-escudo',
    component: MinigameAcerteEscudoComponent,
    // canActivate: [authGuard] // <--- Protegido pelo AuthGuard
  },
  {
    path: 'minigames/memoria',
    component: MinigameMemoriaComponent,
    // canActivate: [authGuard] // <--- Protegido pelo AuthGuard
  },
  {
    path: 'minigames/adivinhe-time',
    component: MinigameAdivinheTimeComponent,
    // canActivate: [authGuard] // <--- Protegido pelo AuthGuard
  },
  {
    path: 'minigames/monte-ranking',
    component: MinigameMonteRankingComponent,
    // canActivate: [authGuard] // <--- Protegido pelo AuthGuard
  },
  {
    path: 'minigames/caca-emblemas',
    component: MinigameCacaEmblemasComponent,
    // canActivate: [authGuard] // <--- Protegido pelo AuthGuard
  },
  {
    path: 'minigames/time-sonhos',
    component: MinigameTimeSonhosComponent,
    // canActivate: [authGuard] // <--- Protegido pelo AuthGuard
  },
  {
    path: 'profile', // <--- Nova rota para o perfil
    component: ProfileComponent,
    canActivate: [authGuard] // <--- Protegida pelo AuthGuard
  },
  { 
    path: 'admin', 
    component: AdminPanelComponent,
    canActivate: [adminGuard] 
  },
  {
    path: '**', // Rota curinga para qualquer URL não encontrada
    redirectTo: '', // Redireciona para a home, que será protegida pelo AuthGuard
    pathMatch: 'full'
  }
];