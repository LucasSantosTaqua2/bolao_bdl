// src/app/pages/ranking/ranking.component.ts
import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common'; // Mantenha CommonModule
import { RouterLink } from '@angular/router'; // Se RouterLink for usado no HTML
// Importe o RankingService e AuthService
import { RankingService } from '../../services/ranking.service';
import { AuthService} from '../../services/auth.service';
// Importe UserProfile e UserRole do user.model.ts
import { UserProfile, UserRole } from '../../models/user.model';

@Component({
  selector: 'app-ranking',
  standalone: true,
  imports: [CommonModule, RouterLink], // Certifique-se que RouterLink está aqui se for usado no HTML
  templateUrl: './ranking.component.html',
  styleUrls: ['./ranking.component.css']
})
export class RankingComponent implements OnInit {
  usersRanking: UserProfile[] = [];
  isLoading: boolean = true;
  errorMessage: string | null = null;

  constructor(
    private rankingService: RankingService,
    private authService: AuthService
  ) { }

  ngOnInit(): void {
    this.loadRanking();
  }

  loadRanking(): void {
    this.isLoading = true;
    this.errorMessage = null;

    const token = this.authService.getAccessToken();
    if (!token) {
      this.errorMessage = 'Não autenticado. Por favor, faça login para ver o ranking.';
      this.isLoading = false;
      return;
    }

    this.rankingService.getRanking(token).subscribe({
      next: (data) => {
        // <<< MUDANÇA AQUI: Filtrar o usuário ADMIN >>>
        this.usersRanking = data
          .filter(user => user.role !== UserRole.ADMIN) // Filtra para remover o admin
          .sort((a, b) => b.points - a.points); // Mantém a ordenação por pontos

        this.isLoading = false;
      },
      error: (err) => {
        console.error('Erro ao carregar ranking:', err);
        this.errorMessage = 'Não foi possível carregar o ranking. Por favor, tente novamente mais tarde.';
        this.isLoading = false;
      }
    });
  }
}