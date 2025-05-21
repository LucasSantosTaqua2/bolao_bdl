// src/app/pages/admin-panel/admin-panel.component.ts
import { Component, OnInit } from '@angular/core';
import { CommonModule, DatePipe, TitleCasePipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { AuthService, UserProfile } from '../../services/auth.service';
import { GameService } from '../../services/game.service';
import { GameRead, GameStatus, GameUpdateResult } from '../../models/game.model';

@Component({
  selector: 'app-admin-panel',
  standalone: true,
  imports: [CommonModule, DatePipe, TitleCasePipe, FormsModule],
  templateUrl: './admin-panel.component.html',
  styleUrls: ['./admin-panel.component.css']
})
export class AdminPanelComponent implements OnInit {
  allUsers: UserProfile[] = [];
  allGames: GameRead[] = []; // Lista de todos os jogos
  isLoading: boolean = true;
  errorMessage: string | null = null; // Mensagens de erro geral

  // Propriedades para Inserir Jogos (Upload de Excel)
  selectedRound: number = 1; // Rodada selecionada para upload
  selectedFile: File | null = null; // Arquivo Excel para upload de CRIAÇÃO
  uploadMessage: string | null = null; // Mensagem de feedback para upload de criação
  isUploadSuccess: boolean = false; // Status do upload de criação

  // Propriedades para Excluir Jogos/Rodadas
  deleteRoundNumber: number = 1;
  deleteRoundMessage: string | null = null;
  isDeleteRoundSuccess: boolean = false;

  // Propriedades para Registrar Resultados (Manual)
  selectedResultRound: number = 1;
  gamesToScore: GameRead[] = [];
  scoreMessage: string | null = null;
  isScoreSuccess: boolean = false;
  isLoadingGamesToScore: boolean = false;

  // Propriedades para Gerar/Enviar Planilha de Resultados (Excel)
  downloadRoundNumber: number = 1;
  resultsFile: File | null = null;
  resultsUploadMessage: string | null = null;
  isResultsUploadSuccess: boolean = false;


  rounds: number[] = Array.from({ length: 38 }, (_, i) => i + 1); // Array de 1 a 38 para selects de rodada

  constructor(
    private authService: AuthService,
    private gameService: GameService
  ) { }

  ngOnInit(): void {
    this.loadAllUsers();
    this.loadAllGames();
    this.loadGamesToScore(); // Carrega os jogos da rodada padrão para inserir resultados
  }

  // --- FUNÇÃO AUXILIAR PARA PARSEAR DATAS COMO UTC ---
  private parseDateAsUTC(dateString: string): string {
    const utcString = dateString.endsWith('Z') ? dateString : dateString + 'Z';
    const dateObject = new Date(utcString);
    return dateObject.toISOString(); // Retorna a string ISO formatada com 'Z'
  }

  // Métodos de Carregamento de Dados Iniciais
  loadAllUsers(): void {
    this.isLoading = true;
    this.errorMessage = null;

    this.authService.getAllUsersForAdmin().subscribe({
      next: (users) => {
        // Ajusta o fuso horário das datas dos usuários
        this.allUsers = users.sort((a, b) => a.id - b.id).map(user => ({
          ...user,
          created_at: this.parseDateAsUTC(user.created_at), // <--- AGORA parseDateAsUTC EXISTE
          updated_at: this.parseDateAsUTC(user.updated_at)  // <--- AGORA parseDateAsUTC EXISTE
        }));
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
        // Ajusta o fuso horário das datas dos jogos
        this.allGames = games.map(game => ({
          ...game,
          game_datetime: this.parseDateAsUTC(game.game_datetime) // <--- AGORA parseDateAsUTC EXISTE
        }));
      },
      error: (err) => {
        console.error('Erro ao carregar todos os jogos (Admin):', err);
        this.errorMessage = 'Erro ao carregar todos os jogos. Tente novamente.';
      }
    });
  }

  // Métodos para Inserir Jogos (Upload de Excel)
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
        this.loadAllGames(); // Recarrega a tabela geral
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

  // Métodos para Excluir Jogos/Rodadas
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
          this.errorMessage = null; // Limpa qualquer erro geral
          this.loadAllGames(); // Recarrega a lista de jogos
          this.showTemporaryMessage('Jogo excluído com sucesso!', true, 'deleteRoundMessage', 'isDeleteRoundSuccess');
        } else {
          this.showTemporaryMessage('Erro inesperado ao excluir jogo.', false, 'deleteRoundMessage', 'isDeleteRoundSuccess');
        }
      },
      error: (err) => {
        console.error('Erro ao excluir jogo:', err);
        this.showTemporaryMessage(`Erro ao excluir jogo: ${err.error?.detail || 'Verifique o console.'}`, false, 'deleteRoundMessage', 'isDeleteRoundSuccess');
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
        this.showTemporaryMessage(response.message, true, 'deleteRoundMessage', 'isDeleteRoundSuccess');
        this.loadAllGames();
      },
      error: (err) => {
        console.error('Erro ao excluir rodada:', err);
        this.showTemporaryMessage(`Erro ao excluir rodada: ${err.error?.detail || 'Verifique o console.'}`, false, 'deleteRoundMessage', 'isDeleteRoundSuccess');
      }
    });
  }

  // Métodos para Registrar Resultados (Manual)
  loadGamesToScore(): void {
    this.isLoadingGamesToScore = true;
    this.scoreMessage = null;
    this.isScoreSuccess = false;

    const token = this.authService.getAccessToken();
    if (!token) {
      this.scoreMessage = 'Não autenticado. Faça login para gerenciar resultados.';
      this.isScoreSuccess = false;
      this.isLoadingGamesToScore = false;
      return;
    }

    this.gameService.getGamesByRound(this.selectedResultRound, token).subscribe({
      next: (games) => {
        // Ajusta o fuso horário das datas dos jogos
        this.gamesToScore = games.filter(game => game.status === GameStatus.SCHEDULED || (game.home_score === null && game.away_score === null));
        this.gamesToScore = this.gamesToScore.map(game => ({
          ...game,
          game_datetime: this.parseDateAsUTC(game.game_datetime) // <--- AGORA parseDateAsUTC EXISTE
        }));
        this.isLoadingGamesToScore = false;
        if (this.gamesToScore.length === 0) {
          this.scoreMessage = `Nenhum jogo agendado na rodada ${this.selectedResultRound} para registrar resultados.`;
          this.isScoreSuccess = true;
        }
      },
      error: (err) => {
        console.error('Erro ao carregar jogos para resultados:', err);
        this.scoreMessage = `Erro ao carregar jogos da rodada ${this.selectedResultRound}: ${err.error?.detail || 'Verifique o console.'}`;
        this.isScoreSuccess = false;
        this.isLoadingGamesToScore = false;
      }
    });
  }

  onSubmitGameScores(): void {
    this.scoreMessage = null;
    this.isScoreSuccess = false;

    const token = this.authService.getAccessToken();
    if (!token) {
      this.scoreMessage = 'Não autenticado. Faça login como admin para registrar resultados.';
      this.isScoreSuccess = false;
      return;
    }

    const updates: Promise<GameRead>[] = [];

    for (const game of this.gamesToScore) {
      if (game.home_score !== null && game.away_score !== null) {
        updates.push(
          new Promise((resolve, reject) => {
            this.gameService.updateGameResult(game.id, game.home_score, game.away_score, token).subscribe({
              next: (updatedGame) => {
                console.log(`Resultado do jogo ${updatedGame.home_team} x ${updatedGame.away_team} atualizado.`);
                resolve(updatedGame);
              },
              error: (err) => {
                console.error(`Erro ao atualizar resultado do jogo ${game.id}:`, err);
                reject(err);
              }
            });
          })
        );
      }
    }

    if (updates.length === 0) {
      this.scoreMessage = 'Nenhum placar preenchido para registrar nesta rodada.';
      this.isScoreSuccess = false;
      return;
    }

    Promise.all(updates)
      .then(() => {
        this.scoreMessage = `Resultados da rodada ${this.selectedResultRound} registrados com sucesso!`;
        this.isScoreSuccess = true;
        this.loadGamesToScore();
        this.loadAllGames();
      })
      .catch((err) => {
        this.scoreMessage = `Erro ao registrar resultados: ${err.error?.detail || 'Verifique o console.'}`;
        this.isScoreSuccess = false;
      });
  }

  onResultRoundChange(): void {
    this.loadGamesToScore();
  }

  // Método auxiliar para exibir mensagens temporárias (generalizado)
  private showTemporaryMessage(message: string, isSuccess: boolean, targetMessageProperty: 'uploadMessage' | 'deleteRoundMessage' | 'scoreMessage' | 'resultsUploadMessage', isTargetSuccessProperty: 'isUploadSuccess' | 'isDeleteRoundSuccess' | 'isScoreSuccess' | 'isResultsUploadSuccess'): void {
      this.errorMessage = null; // Garante que a mensagem principal (topo) seja limpa

      // Define a mensagem e o status na propriedade alvo
      (this as any)[targetMessageProperty] = message;
      (this as any)[isTargetSuccessProperty] = isSuccess;

      setTimeout(() => {
          (this as any)[targetMessageProperty] = null; // Limpa a mensagem alvo
      }, 5000); // Mensagem some após 5 segundos
  }

  // ----------------------------------------------------
  // Métodos para Gerar/Enviar Planilha de Resultados (Excel)
  // ----------------------------------------------------

  onDownloadResultsTemplate(): void {
    const token = this.authService.getAccessToken();
    if (!token) {
      this.showTemporaryMessage('Não autenticado. Faça login como admin para baixar a planilha.', false, 'resultsUploadMessage', 'isResultsUploadSuccess');
      return;
    }

    this.gameService.downloadResultsTemplate(this.downloadRoundNumber, token).subscribe({
      next: (blob) => {
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `resultados_rodada_${this.downloadRoundNumber}.xlsx`;
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
        document.body.removeChild(a);
        this.showTemporaryMessage('Planilha de resultados baixada com sucesso!', true, 'resultsUploadMessage', 'isResultsUploadSuccess');
      },
      error: (err) => {
        console.error('Erro ao baixar planilha de resultados:', err);
        this.showTemporaryMessage(`Erro ao baixar planilha: ${err.error?.detail || 'Verifique o console.'}`, false, 'resultsUploadMessage', 'isResultsUploadSuccess');
      }
    });
  }

  onResultsFileSelected(event: Event): void {
    const element = event.target as HTMLInputElement;
    if (element.files && element.files.length > 0) {
      this.resultsFile = element.files[0];
    } else {
      this.resultsFile = null;
    }
    this.clearResultsUploadMessage();
  }

  onUploadResults(): void {
    this.clearResultsUploadMessage();

    if (!this.resultsFile) {
      this.resultsUploadMessage = 'Por favor, selecione um arquivo Excel (.xlsx) com os resultados.';
      this.isResultsUploadSuccess = false;
      return;
    }

    const token = this.authService.getAccessToken();
    if (!token) {
      this.resultsUploadMessage = 'Não autenticado. Faça login como admin para fazer upload dos resultados.';
      this.isResultsUploadSuccess = false;
      return;
    }

    this.gameService.uploadResultsExcel(this.resultsFile, token).subscribe({
      next: (updatedGames) => {
        this.resultsUploadMessage = `Sucesso! ${updatedGames.length} jogo(s) com resultados atualizado(s).`;
        this.isResultsUploadSuccess = true;
        this.resultsFile = null;
        this.loadAllGames(); // Recarrega a tabela geral para mostrar os resultados
        this.loadGamesToScore(); // Recarrega a seção de resultados caso o status mude

        // Limpar o input file manualmente
        const fileInput = document.getElementById('resultsExcelFile') as HTMLInputElement;
        if (fileInput) {
            fileInput.value = '';
        }
      },
      error: (err) => {
        console.error('Erro no upload de resultados Excel:', err);
        this.resultsUploadMessage = `Erro no upload de resultados: ${err.error?.detail || 'Verifique o console.'}`;
        this.isResultsUploadSuccess = false;
      }
    });
  }

  private clearResultsUploadMessage(): void {
      this.resultsUploadMessage = null;
      this.isResultsUploadSuccess = false;
  }
}