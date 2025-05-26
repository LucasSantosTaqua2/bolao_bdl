// src/app/pages/admin-panel/admin-panel.component.ts
import { Component, OnInit } from '@angular/core';
import { CommonModule, DatePipe, TitleCasePipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { AuthService } from '../../services/auth.service';
import { UserProfile } from '../../models/user.model';
import { GameService } from '../../services/game.service';
import { GameRead, GameStatus } from '../../models/game.model';

interface AdminEditableGame extends GameRead {
  editable_home_score: number | null;
  editable_away_score: number | null;
}

@Component({
  selector: 'app-admin-panel',
  standalone: true,
  imports: [CommonModule, DatePipe, TitleCasePipe, FormsModule],
  templateUrl: './admin-panel.component.html',
  styleUrls: ['./admin-panel.component.css']
})
export class AdminPanelComponent implements OnInit {
  allUsers: UserProfile[] = [];
  allGames: AdminEditableGame[] = [];
  isLoading: boolean = true;
  errorMessage: string | null = null;

  selectedRound: number = 1;
  selectedFile: File | null = null;
  uploadMessage: string | null = null;
  isUploadSuccess: boolean = false;

  deleteRoundNumber: number = 1;
  deleteRoundMessage: string | null = null;
  isDeleteRoundSuccess: boolean = false;

  downloadRoundNumber: number = 1;
  resultsFile: File | null = null;
  resultsUploadMessage: string | null = null;
  isResultsUploadSuccess: boolean = false;

  rounds: number[] = Array.from({ length: 38 }, (_, i) => i + 1);
  roundsWithGames: number[] = [];

  filteredAndSortedGames: AdminEditableGame[] = [];
  paginatedGames: AdminEditableGame[] = [];

  filterRound: number | '' = '';
  filterStatus: GameStatus | '' = '';
  filterDate: string = '';

  availableStatuses: { value: GameStatus | ''; display: string }[] = [];

  currentPage: number = 1;
  itemsPerPage: number = 10;
  totalPages: number = 0;
  totalItems: number = 0;

  public GameStatus = GameStatus;

  saveResultMessage: string | null = null;
  isSaveResultSuccess: boolean = false;

  constructor(
    private authService: AuthService,
    private gameService: GameService
  ) { }

  ngOnInit(): void {
    this.isLoading = true;
    this.loadAllUsers();
    this.loadAllGames();
    this.prepareFilterOptions();
  }

  // Função trackBy para otimizar o *ngFor da tabela de jogos
  trackByGameId(index: number, game: AdminEditableGame): number {
    return game.id;
  }

  private parseUserDateString(dateString: string): string {
    const utcString = dateString.endsWith('Z') ? dateString : dateString + 'Z';
    const dateObject = new Date(utcString);
    return dateObject.toISOString();
  }

  loadAllUsers(): void {
    this.errorMessage = null;
    this.authService.getAllUsersForAdmin().subscribe({
      next: (users) => {
        this.allUsers = users.sort((a, b) => a.id - b.id);
      },
      error: (err) => {
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
      this.isLoading = false;
      return;
    }
    this.gameService.getAllGamesAdmin(token).subscribe({
      next: (games: GameRead[]) => {
        this.allGames = games.map((g: GameRead): AdminEditableGame => ({
          ...g,
          editable_home_score: g.status === GameStatus.SCHEDULED ? null : (g.home_score !== undefined ? g.home_score : null),
          editable_away_score: g.status === GameStatus.SCHEDULED ? null : (g.away_score !== undefined ? g.away_score : null),
        })).sort((a, b) => new Date(b.game_datetime).getTime() - new Date(a.game_datetime).getTime());

        this.roundsWithGames = [...new Set(this.allGames.map(game => game.round_number))].sort((a, b) => a - b);

        if (this.roundsWithGames.length > 0) {
          if (!this.roundsWithGames.includes(this.downloadRoundNumber)) {
             this.downloadRoundNumber = this.roundsWithGames[0];
          }
          if (!this.roundsWithGames.includes(this.deleteRoundNumber)) {
            this.deleteRoundNumber = this.roundsWithGames[0];
          }
        } else { // Se não há rodadas com jogos, reseta para um valor padrão ou desabilitado
            this.downloadRoundNumber = 1; // Ou algum valor que indique desabilitado
            this.deleteRoundNumber = 1;   // Ou algum valor que indique desabilitado
        }

        this.applyFiltersAndPagination();
        this.isLoading = false;
      },
      error: (err) => {
        this.errorMessage = 'Erro ao carregar todos os jogos. Tente novamente.';
        this.isLoading = false;
      }
    });
  }

  prepareFilterOptions(): void {
    this.availableStatuses = [
      { value: '', display: 'Todos os Status' },
      { value: GameStatus.SCHEDULED, display: 'Agendado' },
      { value: GameStatus.FINISHED, display: 'Encerrado (Placar Preenchido)' },
      { value: GameStatus.COMPLETED, display: 'Completo (Apostas Processadas)' },
      { value: GameStatus.CANCELED, display: 'Cancelado' }
    ];
  }

  applyFiltersAndPagination(): void {
    let result: AdminEditableGame[] = [...this.allGames];

    if (this.filterRound !== '') {
      result = result.filter(g => g.round_number === Number(this.filterRound));
    }
    if (this.filterStatus !== '') {
      result = result.filter(g => g.status === this.filterStatus);
    }
    if (this.filterDate) {
      result = result.filter(g => {
        const gameDate = new Date(g.game_datetime);
        const year = gameDate.getFullYear();
        const month = ('0' + (gameDate.getMonth() + 1)).slice(-2);
        const day = ('0' + gameDate.getDate()).slice(-2);
        const gameDateString = `${year}-${month}-${day}`;
        return gameDateString === this.filterDate;
      });
    }

    this.filteredAndSortedGames = result.sort((a,b) => new Date(b.game_datetime).getTime() - new Date(a.game_datetime).getTime()); // Re-sort aqui
    this.totalItems = this.filteredAndSortedGames.length;
    this.totalPages = Math.ceil(this.totalItems / this.itemsPerPage);

    if (this.currentPage > this.totalPages && this.totalPages > 0) {
      this.currentPage = this.totalPages;
    } else if (this.currentPage < 1 && this.totalPages > 0) {
      this.currentPage = 1;
    } else if (this.totalPages === 0 && this.totalItems > 0) { // Havia jogos, mas o filtro limpou todos
        this.currentPage = 1; // Reseta para a página 1
    } else if (this.totalPages === 0 && this.totalItems === 0) { // Nenhum jogo ou filtro resultou em zero
        this.currentPage = 1;
    }


    const startIndex = (this.currentPage - 1) * this.itemsPerPage;
    const endIndex = startIndex + this.itemsPerPage;
    this.paginatedGames = this.filteredAndSortedGames.slice(startIndex, endIndex);
  }

  onFilterChange(): void {
    this.currentPage = 1;
    this.applyFiltersAndPagination();
  }

  resetFilters(): void {
    this.filterRound = '';
    this.filterStatus = '';
    this.filterDate = '';
    this.currentPage = 1;
    this.applyFiltersAndPagination();
  }

  goToPage(page: number): void {
    if (page >= 1 && page <= this.totalPages) {
      this.currentPage = page;
      this.applyFiltersAndPagination();
    }
  }

  nextPage(): void {
    if (this.currentPage < this.totalPages) {
      this.currentPage++;
      this.applyFiltersAndPagination();
    }
  }

  previousPage(): void {
    if (this.currentPage > 1) {
      this.currentPage--;
      this.applyFiltersAndPagination();
    }
  }

  onItemsPerPageChange(event: Event): void {
    const selectElement = event.target as HTMLSelectElement;
    this.itemsPerPage = Number(selectElement.value);
    this.currentPage = 1;
    this.applyFiltersAndPagination();
  }

  getPagesArray(): number[] {
    if (this.totalPages <= 0) return [];
    return new Array(this.totalPages).fill(0).map((_, index) => index + 1);
  }

  onSaveGameResult(game: AdminEditableGame): void {
    this.clearSaveResultMessage();
    // As validações de placar já garantem que não são null/undefined aqui
    if (game.editable_home_score === null || game.editable_home_score < 0 ||
        game.editable_away_score === null || game.editable_away_score < 0) {
      this.showTemporaryMessage('Ambos os placares devem ser preenchidos e não podem ser negativos.', false, 'saveResultMessage', 'isSaveResultSuccess');
      return;
    }

    const token = this.authService.getAccessToken();
    if (!token) {
      this.showTemporaryMessage('Não autenticado. Faça login como admin.', false, 'saveResultMessage', 'isSaveResultSuccess');
      return;
    }

    this.isLoading = true;
    this.gameService.updateGameResult(game.id, game.editable_home_score, game.editable_away_score, token)
      .subscribe({
        next: (updatedGameFromApi) => { // Renomeado para clareza
          this.showTemporaryMessage(`Resultado do jogo ${updatedGameFromApi.home_team} x ${updatedGameFromApi.away_team} salvo com sucesso! As apostas serão processadas.`, true, 'saveResultMessage', 'isSaveResultSuccess');

          const index = this.allGames.findIndex(g => g.id === updatedGameFromApi.id);
          if (index !== -1) {
            // Criar um novo objeto para o jogo atualizado
            const fullyUpdatedGame: AdminEditableGame = {
              ...this.allGames[index], // Preserva propriedades locais não vindas da API
              ...updatedGameFromApi,   // Sobrescreve com dados da API
              game_datetime: new Date(updatedGameFromApi.game_datetime), // Garante que é um objeto Date
              // Atualiza os campos 'editable_' com base no novo status/placar
              editable_home_score: updatedGameFromApi.status === GameStatus.SCHEDULED ? null : updatedGameFromApi.home_score,
              editable_away_score: updatedGameFromApi.status === GameStatus.SCHEDULED ? null : updatedGameFromApi.away_score,
            };
            this.allGames[index] = fullyUpdatedGame;
            this.allGames = [...this.allGames]; // Nova referência para o array this.allGames
          }

          this.applyFiltersAndPagination(); // Re-aplica filtros e paginação
          this.isLoading = false;
        },
        error: (err) => {
          this.showTemporaryMessage(`Erro ao salvar resultado: ${err.error?.detail || 'Tente novamente.'}`, false, 'saveResultMessage', 'isSaveResultSuccess');
          this.isLoading = false;
        }
      });
  }

  private clearSaveResultMessage(): void {
    this.saveResultMessage = null;
    this.isSaveResultSuccess = false;
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
      this.showTemporaryMessage('Por favor, selecione um arquivo Excel (.xlsx) para upload.', false, 'uploadMessage', 'isUploadSuccess');
      return;
    }
    const token = this.authService.getAccessToken();
    if (!token) {
      this.showTemporaryMessage('Não autenticado. Faça login como admin para fazer upload.', false, 'uploadMessage', 'isUploadSuccess');
      return;
    }
    this.isLoading = true;
    this.gameService.uploadGamesExcel(this.selectedFile, this.selectedRound, token).subscribe({
      next: (createdGames) => {
        this.showTemporaryMessage(`Sucesso! ${createdGames.length} jogo(s) inserido(s) na rodada ${this.selectedRound}.`, true, 'uploadMessage', 'isUploadSuccess');
        this.selectedFile = null;
        const fileInput = document.getElementById('excelFile') as HTMLInputElement;
        if (fileInput) fileInput.value = '';
        this.loadAllGames(); // Recarrega todos os jogos após o upload bem-sucedido
      },
      error: (err) => {
        this.showTemporaryMessage(`Erro no upload: ${err.error?.detail || 'Verifique o console para mais detalhes.'}`, false, 'uploadMessage', 'isUploadSuccess');
        this.isLoading = false;
      }
    });
  }

  private clearUploadMessage(): void {
    this.uploadMessage = null;
    this.isUploadSuccess = false;
  }

  onDeleteGame(gameId: number): void {
    if (!confirm('Tem certeza que deseja excluir este jogo? Esta ação não pode ser desfeita.')) {
      return;
    }
    const token = this.authService.getAccessToken();
    if (!token) {
      this.showTemporaryMessage('Não autenticado. Faça login como admin para excluir jogos.', false, 'deleteRoundMessage', 'isDeleteRoundSuccess');
      return;
    }
    this.isLoading = true;
    this.gameService.deleteGame(gameId, token).subscribe({
      next: () => { // Resposta de deleção geralmente é vazia ou uma mensagem de sucesso
        this.showTemporaryMessage('Jogo excluído com sucesso!', true, 'deleteRoundMessage', 'isDeleteRoundSuccess');
        // Atualizar a lista localmente em vez de recarregar tudo
        this.allGames = this.allGames.filter(g => g.id !== gameId);
        this.allGames = [...this.allGames]; // Forçar detecção de mudança
        this.applyFiltersAndPagination();
        this.isLoading = false;
      },
      error: (err) => {
        this.showTemporaryMessage(`Erro ao excluir jogo: ${err.error?.detail || 'Tente novamente.'}`, false, 'deleteRoundMessage', 'isDeleteRoundSuccess');
        this.isLoading = false;
      }
    });
  }

  onDeleteRoundGames(): void {
    if (!confirm(`Tem certeza que deseja excluir TODOS os jogos da rodada ${this.deleteRoundNumber}? Esta ação não pode ser desfeita e afetará todas as apostas relacionadas.`)) {
      return;
    }
    const token = this.authService.getAccessToken();
    if (!token) {
      this.showTemporaryMessage('Não autenticado. Faça login como admin para excluir rodadas.', false, 'deleteRoundMessage', 'isDeleteRoundSuccess');
      return;
    }
    this.isLoading = true;
    this.gameService.deleteRoundGames(this.deleteRoundNumber, token).subscribe({
      next: (response: any) => {
        this.showTemporaryMessage(response.message || `Todos os jogos da rodada ${this.deleteRoundNumber} foram excluídos com sucesso!`, true, 'deleteRoundMessage', 'isDeleteRoundSuccess');
        this.loadAllGames(); // Recarrega todos os jogos, pois uma rodada inteira foi afetada
      },
      error: (err) => {
        this.showTemporaryMessage(`Erro ao excluir rodada: ${err.error?.detail || 'Tente novamente.'}`, false, 'deleteRoundMessage', 'isDeleteRoundSuccess');
        this.isLoading = false;
      }
    });
  }

  private showTemporaryMessage(
    message: string,
    isSuccess: boolean,
    targetMessageProperty: 'uploadMessage' | 'deleteRoundMessage' | 'resultsUploadMessage' | 'saveResultMessage',
    isTargetSuccessProperty: 'isUploadSuccess' | 'isDeleteRoundSuccess' | 'isResultsUploadSuccess' | 'isSaveResultSuccess'
  ): void {
    this.errorMessage = null; // Limpa a mensagem de erro principal, se houver
    (this as any)[targetMessageProperty] = message;
    (this as any)[isTargetSuccessProperty] = isSuccess;
    setTimeout(() => {
      (this as any)[targetMessageProperty] = null;
    }, 5000);
  }

  onDownloadResultsTemplate(): void {
    const token = this.authService.getAccessToken();
    if (!token) {
      this.showTemporaryMessage('Não autenticado. Faça login como admin para baixar a planilha.', false, 'resultsUploadMessage', 'isResultsUploadSuccess');
      return;
    }
    this.isLoading = true;
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
        this.isLoading = false;
      },
      error: (err) => {
        this.showTemporaryMessage(`Erro ao baixar planilha: ${err.error?.detail || 'Tente novamente.'}`, false, 'resultsUploadMessage', 'isResultsUploadSuccess');
        this.isLoading = false;
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
      this.showTemporaryMessage('Por favor, selecione um arquivo Excel (.xlsx) com os resultados.', false, 'resultsUploadMessage', 'isResultsUploadSuccess');
      return;
    }
    const token = this.authService.getAccessToken();
    if (!token) {
      this.showTemporaryMessage('Não autenticado. Faça login como admin para fazer upload dos resultados.', false, 'resultsUploadMessage', 'isResultsUploadSuccess');
      return;
    }
    this.isLoading = true;
    this.gameService.uploadResultsExcel(this.resultsFile, token).subscribe({
      next: (updatedGames) => {
        this.showTemporaryMessage(`Sucesso! ${updatedGames.length} jogo(s) com resultados atualizado(s).`, true, 'resultsUploadMessage', 'isResultsUploadSuccess');
        this.resultsFile = null;
        const fileInput = document.getElementById('resultsExcelFile') as HTMLInputElement;
        if (fileInput) fileInput.value = '';
        this.loadAllGames(); // Recarrega todos os jogos após o upload bem-sucedido
      },
      error: (err) => {
        this.showTemporaryMessage(`Erro no upload de resultados: ${err.error?.detail || 'Verifique o console.'}`, false, 'resultsUploadMessage', 'isResultsUploadSuccess');
        this.isLoading = false;
      }
    });
  }

  private clearResultsUploadMessage(): void {
    this.resultsUploadMessage = null;
    this.isResultsUploadSuccess = false;
  }
}
