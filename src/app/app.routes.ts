import { Routes } from '@angular/router';
import { HomeComponent } from './pages/home/home.component';
import { RankingComponent } from './pages/ranking/ranking.component';
import { LoginComponent } from './pages/login/login.component';
import { RegisterComponent } from './pages/register/register.component';
import { ApostasComponent } from './pages/apostas/apostas.component';

export const routes: Routes = [
    {
        path: '', component: HomeComponent
    },
    {
        path: 'ranking', component: RankingComponent
    },
    {
        path: 'login', component: LoginComponent
    },
    {
        path: 'register', component: RegisterComponent
    },
    {
        path: 'apostar', component: ApostasComponent
    },
    
];
