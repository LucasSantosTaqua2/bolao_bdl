// src/app/guards/auth.guard.ts
import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { AuthService } from '../services/auth.service'; // Importe o AuthService
import { map, take } from 'rxjs/operators'; // Importe map e take

export const authGuard: CanActivateFn = (route, state) => {
  const authService = inject(AuthService); // Injeta o serviço
  const router = inject(Router); // Injeta o Router

  return authService.isLoggedIn$.pipe(
    take(1), // Pega o valor atual e completa
    map(isLoggedIn => {
      if (isLoggedIn) {
        return true; // Se estiver logado, permite o acesso
      } else {
        // Se não estiver logado, redireciona para a página de login
        // e opcionalmente adiciona um parâmetro de query para redirecionar de volta após o login
        router.navigate(['/login'], { queryParams: { returnUrl: state.url } });
        return false; // Bloqueia o acesso
      }
    })
  );
};