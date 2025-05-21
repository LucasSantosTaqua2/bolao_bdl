// src/app/pages/ranking/ranking.component.ts
import { Component, OnInit } from '@angular/core';
import { CommonModule, NgIf } from '@angular/common';
// Importe o RankingService e UserProfile do AuthService
import { RankingService } from '../../services/ranking.service';
import { AuthService, UserProfile } from '../../services/auth.service'; // UserProfile ainda é definido no AuthService

@Component({
  selector: 'app-ranking',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './ranking.component.html',
  styleUrl: './ranking.component.css'
})
export class RankingComponent implements OnInit {
  usersRanking: UserProfile[] = [];
  isLoading: boolean = true;
  errorMessage: string | null = null;

  constructor(
    private rankingService: RankingService, // <--- Injete o RankingService
    private authService: AuthService // <--- Continue injetando AuthService para obter o token
  ) { }

  ngOnInit(): void {
    this.loadRanking();
  }

  loadRanking(): void {
    this.isLoading = true;
    this.errorMessage = null;

    const token = this.authService.getAccessToken(); // <--- Obtenha o token do AuthService
    if (!token) {
      this.errorMessage = 'Não autenticado. Por favor, faça login para ver o ranking.';
      this.isLoading = false;
      return;
    }

    this.rankingService.getRanking(token).subscribe({ // <--- Use o RankingService
      next: (data) => {
        this.usersRanking = data.sort((a, b) => b.points - a.points);
        this.isLoading = false;
      },
      error: (err) => {
        console.error('Erro ao carregar ranking:', err);
        this.errorMessage = 'Não foi possível carregar o ranking. Por favor, tente novamente mais tarde.';
        this.isLoading = false;
        // O AuthGuard já deve redirecionar para login se o token for inválido.
      }
    });
  }
}