import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { AuthService} from '../services/auth.service';
import { UserRole } from '../models/user.model';
import { map, take, switchMap } from 'rxjs/operators'; // <--- Importe switchMap
import { of } from 'rxjs'; // <--- Importe 'of' para criar um observable

export const adminGuard: CanActivateFn = (route, state) => {
  const authService = inject(AuthService);
  const router = inject(Router);

  return authService.isLoggedIn$.pipe(
    take(1),
    switchMap(isLoggedIn => { // <--- Use switchMap aqui
      if (!isLoggedIn) {
        // Se não estiver logado, redireciona e retorna um Observable<false>
        router.navigate(['/login'], { queryParams: { returnUrl: state.url } });
        return of(false); // Retorna um Observable de false
      }

      // Se estiver logado, muda para o Observable da role
      return authService.currentUserRole$.pipe(
        take(1),
        map(role => {
          if (role === UserRole.ADMIN) {
            return true; // É admin, permite acesso
          } else {
            // Não é admin, redireciona para home e bloqueia acesso
            router.navigate(['/home']);
            return false;
          }
        })
      );
    })
  );
};