// src/app/pages/home/home.component.ts
import { Component, OnInit, OnDestroy } from '@angular/core'; // Importe OnInit e OnDestroy
import { CommonModule } from '@angular/common'; // Para *ngIf
import { Router, RouterLink } from '@angular/router'; // Importe Router e RouterLink
import { Subscription } from 'rxjs'; // Para gerenciar a inscrição ao Observable

// Importe AuthService e UserRole do seu models/user.model.ts
import { AuthService, UserRole } from '../../services/auth.service'; 

@Component({
  selector: 'app-home',
  standalone: true,
  imports: [CommonModule, RouterLink], // Adicione RouterLink aqui
  templateUrl: './home.component.html',
  styleUrls: ['./home.component.css']
})
export class HomeComponent implements OnInit, OnDestroy {
  username: string | null = null;
  isAdmin: boolean = false; // Propriedade para controlar a visibilidade do botão de admin
  private authSubscription: Subscription | undefined; // Para gerenciar a inscrição aos Observables

  constructor(
    private authService: AuthService, // Injete o AuthService
    private router: Router // Injete o Router para navegação
  ) { }

  ngOnInit(): void {
    // Inscreve-se para observar mudanças no username do usuário logado
    this.authSubscription = this.authService.currentUserUsername$.subscribe(username => {
      this.username = username;
    });

    // Inscreve-se para observar mudanças no role do usuário logado
    // Adiciona a inscrição do role na mesma subscription para desinscrever tudo junto
    this.authSubscription.add(
      this.authService.currentUserRole$.subscribe(role => {
        this.isAdmin = role === UserRole.ADMIN; // Define isAdmin se o role for ADMIN
      })
    );
  }

  ngOnDestroy(): void {
    // É crucial desinscrever-se para evitar vazamentos de memória
    if (this.authSubscription) {
      this.authSubscription.unsubscribe();
    }
  }

  // Método para navegar para a página de apostas
  goToApostar(): void {
    if (this.authService.getAccessToken()) { // Apenas navega se o usuário estiver logado (tem token)
      this.router.navigate(['/apostar']);
    } else {
      // Opcional: mostrar uma mensagem ou redirecionar para o login
      this.router.navigate(['/login']); // Redireciona para o login se não estiver logado
    }
  }

  // Método para navegar para o painel de administração (apenas para admins)
  goToAdminPanel(): void {
    if (this.isAdmin) { // Apenas navega se o usuário for admin (já verificado na propriedade isAdmin)
      this.router.navigate(['/admin']);
    }
  }
}