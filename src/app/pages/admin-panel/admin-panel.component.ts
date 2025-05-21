import { Component } from '@angular/core';
import { AuthService, UserProfile } from '../../services/auth.service';
import { CommonModule, DatePipe, TitleCasePipe } from '@angular/common';

@Component({
  selector: 'app-admin-panel',
  standalone: true,
  imports: [CommonModule, DatePipe, TitleCasePipe],
  templateUrl: './admin-panel.component.html',
  styleUrl: './admin-panel.component.css'
})
export class AdminPanelComponent {
  allUsers: UserProfile[] = [];
  isLoading: boolean = true;
  errorMessage: string | null = null;

  constructor(private authService: AuthService) { } // Injete o AuthService

  ngOnInit(): void {
    this.loadAllUsers();
  }

  loadAllUsers(): void {
    this.isLoading = true;
    this.errorMessage = null;

    this.authService.getAllUsersForAdmin().subscribe({ // Chama o método do AuthService
      next: (users) => {
        // Opcional: ordenar usuários aqui, se a API não garantir a ordem
        this.allUsers = users.sort((a, b) => a.id - b.id); // Ex: ordenar por ID
        this.isLoading = false;
        console.log('Todos os usuários (Admin):', this.allUsers);
      },
      error: (err) => {
        console.error('Erro ao carregar usuários (Admin):', err);
        this.isLoading = false;
        // Erro 403 FORBIDDEN indica que o usuário não é admin
        if (err.status === 403) {
          this.errorMessage = 'Acesso negado. Você não tem permissão de administrador para este recurso.';
        } else {
          this.errorMessage = 'Erro ao carregar usuários. Tente novamente.';
        }
        // O AdminGuard já deve redirecionar para /home, mas a mensagem é para caso chegue aqui.
      }
    });
  }
}
