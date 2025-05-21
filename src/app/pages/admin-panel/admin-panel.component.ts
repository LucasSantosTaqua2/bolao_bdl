// src/app/pages/admin-panel/admin-panel.component.ts
import { Component, OnInit } from '@angular/core';
import { CommonModule, DatePipe, TitleCasePipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { AuthService, UserProfile } from '../../services/auth.service';
import { GameService } from '../../services/game.service';
import { GameRead, GameStatus } from '../../models/game.model';

@Component({
  selector: 'app-admin-panel',
  standalone: true,
  imports: [CommonModule, DatePipe, TitleCasePipe, FormsModule],
  templateUrl: './admin-panel.component.html',
  styleUrls: ['./admin-panel.component.css']
})
export class AdminPanelComponent implements OnInit {
  allUsers: UserProfile[] = [];
  allGames: GameRead[] = [];
  isLoading: boolean = true;
  errorMessage: string | null = null;

  selectedRound: number = 1;
  selectedFile: File | null = null;
  uploadMessage: string | null = null;
  isUploadSuccess: boolean = false;

  rounds: number[] = Array.from({ length: 38 }, (_, i) => i + 1);

  deleteRoundNumber: number = 1; // <--- GARANTA QUE ESTA LINHA ESTÁ AQUI (CORREÇÃO 1)
  deleteRoundMessage: string | null = null;
  isDeleteRoundSuccess: boolean = false;


  constructor(
    private authService: AuthService,
    private gameService: GameService
  ) { }

  ngOnInit(): void {
    this.loadAllUsers();
    this.loadAllGames();
  }

  loadAllUsers(): void {
    this.isLoading = true;
    this.errorMessage = null;

    this.authService.getAllUsersForAdmin().subscribe({
      next: (users) => {
        this.allUsers = users.sort((a, b) => a.id - b.id);
        this.isLoading = false;
        console.log('Todos os usuários (Admin):', this.allUsers);
      },
      error: (err) => {
        console.error('Erro ao carregar usuários (Admin):', err);
        this.isLoading = false;
        if (err.status === 403) {
          this.errorMessage = 'Acesso negado. Você não tem permissão de administrador para este recurso.';
        } else {
          this.errorMessage = 'Erro ao carregar usuários. Tente novamente.';
        }
      }
    });
  }

  loadAllGames(): void {
    const token = this.authService.getAccessToken();
    if (!token) {
        this.errorMessage = 'Não autenticado. Faça login para ver os jogos.';
        return;
    }
    this.gameService.getAllGamesAdmin(token).subscribe({
      next: (games) => {
        this.allGames = games.map(game => ({
          ...game,
          game_datetime: game.game_datetime.endsWith('Z') ? game.game_datetime : game.game_datetime + 'Z'
        }));
      },
      error: (err) => {
        console.error('Erro ao carregar todos os jogos (Admin):', err);
        this.errorMessage = 'Erro ao carregar todos os jogos. Tente novamente.';
      }
    });
  }

  onFileSelected(event: Event): void {
    const element = event.target as HTMLInputElement;
    if (element.files && element.files.length > 0) {
      this.selectedFile = element.files[0];
    } else {
      this.selectedFile = null;
    }
    this.clearUploadMessage();
  }

  onUploadGames(): void {
    this.clearUploadMessage();

    if (!this.selectedFile) {
      this.uploadMessage = 'Por favor, selecione um arquivo Excel (.xlsx) para upload.';
      this.isUploadSuccess = false;
      return;
    }

    const token = this.authService.getAccessToken();
    if (!token) {
      this.uploadMessage = 'Não autenticado. Faça login como admin para fazer upload.';
      this.isUploadSuccess = false;
      return;
    }

    this.gameService.uploadGamesExcel(this.selectedFile, this.selectedRound, token).subscribe({
      next: (createdGames) => {
        this.uploadMessage = `Sucesso! ${createdGames.length} jogo(s) inserido(s) na rodada ${this.selectedRound}.`;
        this.isUploadSuccess = true;
        this.selectedFile = null;
        this.loadAllGames();
        const fileInput = document.getElementById('excelFile') as HTMLInputElement;
        if (fileInput) {
            fileInput.value = '';
        }
      },
      error: (err) => {
        console.error('Erro no upload do Excel:', err);
        this.uploadMessage = `Erro no upload: ${err.error?.detail || 'Verifique o console para mais detalhes.'}`;
        this.isUploadSuccess = false;
      }
    });
  }

  private clearUploadMessage(): void {
    this.uploadMessage = null;
    this.isUploadSuccess = false;
  }

  onDeleteGame(gameId: number): void {
    if (!confirm('Tem certeza que deseja excluir este jogo?')) {
      return;
    }

    const token = this.authService.getAccessToken();
    if (!token) {
      this.errorMessage = 'Não autenticado. Faça login como admin para excluir jogos.';
      return;
    }

    this.gameService.deleteGame(gameId, token).subscribe({
      next: (response) => {
        if (response.status === 204) {
          this.errorMessage = null;
          this.loadAllGames();
          this.showTemporaryMessage('Jogo excluído com sucesso!', true);
        } else {
          this.showTemporaryMessage('Erro inesperado ao excluir jogo.', false);
        }
      },
      error: (err) => {
        console.error('Erro ao excluir jogo:', err);
        this.showTemporaryMessage(`Erro ao excluir jogo: ${err.error?.detail || 'Verifique o console.'}`, false);
      }
    });
  }

  onDeleteRoundGames(): void {
    if (!confirm(`Tem certeza que deseja excluir TODOS os jogos da rodada ${this.deleteRoundNumber}?`)) {
      return;
    }

    const token = this.authService.getAccessToken();
    if (!token) {
      this.errorMessage = 'Não autenticado. Faça login como admin para excluir rodadas.';
      return;
    }

    this.gameService.deleteRoundGames(this.deleteRoundNumber, token).subscribe({
      next: (response) => {
        this.showTemporaryMessage(response.message, true);
        this.loadAllGames();
      },
      error: (err) => {
        console.error('Erro ao excluir rodada:', err);
        this.showTemporaryMessage(`Erro ao excluir rodada: ${err.error?.detail || 'Verifique o console.'}`, false);
      }
    });
  }

  private showTemporaryMessage(message: string, isSuccess: boolean): void {
      this.errorMessage = null;
      this.uploadMessage = message;
      this.isUploadSuccess = isSuccess;
      setTimeout(() => {
          this.uploadMessage = null;
      }, 5000);
  }
}