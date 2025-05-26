// src/app/pages/admin-panel/admin-panel.component.ts
import { Component, OnInit } from '@angular/core';
import { CommonModule, DatePipe, TitleCasePipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { AuthService } from '../../services/auth.service';
import { UserProfile } from '../../models/user.model';
import { GameService } from '../../services/game.service';
import { GameRead, GameStatus } from '../../models/game.model'; // GameStatus já importado

@Component({
  selector: 'app-admin-panel',
  standalone: true,
  imports: [CommonModule, DatePipe, TitleCasePipe, FormsModule],
  templateUrl: './admin-panel.component.html',
  styleUrls: ['./admin-panel.component.css']
})
export class AdminPanelComponent implements OnInit {
  allUsers: UserProfile[] = [];
  allGames: GameRead[] = []; // Lista original de todos os jogos
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

  // Propriedades para Gerar/Enviar Planilha de Resultados (Excel)
  downloadRoundNumber: number = 1;
  resultsFile: File | null = null;
  resultsUploadMessage: string | null = null;
  isResultsUploadSuccess: boolean = false;

  rounds: number[] = Array.from({ length: 38 }, (_, i) => i + 1); // Array de 1 a 38 para selects de rodada
  roundsWithGames: number[] = []; // Array de rodadas que possuem jogos

  // --- PROPRIEDADES PARA FILTROS E PAGINAÇÃO DE JOGOS ---
  filteredAndSortedGames: GameRead[] = []; // Jogos após filtros e ordenação
  paginatedGames: GameRead[] = [];      // Jogos da página atual

  // Filtros
  filterRound: number | '' = ''; // Usar '' para "Todas as Rodadas"
  filterStatus: GameStatus | '' = ''; // Usar '' para "Todos os Status"
  filterDate: string = ''; // Formato YYYY-MM-DD para o input date

  availableStatuses: { value: GameStatus | ''; display: string }[] = [];
  // roundsForFilter usará this.roundsWithGames no template

  // Paginação
  currentPage: number = 1;
  itemsPerPage: number = 10;
  totalPages: number = 0;
  totalItems: number = 0;
  // --- FIM DAS PROPRIEDADES PARA FILTROS E PAGINAÇÃO ---

  constructor(
    private authService: AuthService,
    private gameService: GameService
  ) { }

  ngOnInit(): void {
    this.isLoading = true; // Garante que o loading geral comece
    this.loadAllUsers(); // Continua carregando usuários
    this.loadAllGames(); // Carrega jogos (e também fará o isLoading = false ao final)
    this.prepareFilterOptions();
  }

  // Função auxiliar para parsear datas - pode não ser mais necessária para game_datetime
  // Se UserProfile.created_at/updated_at já são objetos Date ou o pipe 'date' lida com a string
  private parseUserDateString(dateString: string): string {
    const utcString = dateString.endsWith('Z') ? dateString : dateString + 'Z';
    const dateObject = new Date(utcString);
    return dateObject.toISOString(); // Retorna a string ISO formatada com 'Z'
  }

  // Métodos de Carregamento de Dados Iniciais
  loadAllUsers(): void {
    // this.isLoading = true; // O isLoading geral já é true no ngOnInit
    this.errorMessage = null;

    this.authService.getAllUsersForAdmin().subscribe({
      next: (users) => {
        this.allUsers = users.sort((a, b) => a.id - b.id);
        // Não mexe no isLoading aqui, pois loadAllGames ainda pode estar rodando
      },
      error: (err) => {
        this.isLoading = false; // Se houver erro aqui e loadAllGames não rodar, paramos o loading
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
      this.isLoading = false; // Parar o loading se não houver token
      return;
    }
    // this.isLoading = true; // O isLoading geral já é true no ngOnInit
    this.gameService.getAllGamesAdmin(token).subscribe({
      next: (games) => {
        // Ordena por data mais recente primeiro
        this.allGames = games.sort((a, b) => new Date(b.game_datetime).getTime() - new Date(a.game_datetime).getTime());
        this.roundsWithGames = [...new Set(this.allGames.map(game => game.round_number))].sort((a, b) => a - b);

        if (this.roundsWithGames.length > 0) {
          this.downloadRoundNumber = this.roundsWithGames[0]; // Popula select de download
          this.deleteRoundNumber = this.roundsWithGames[0];   // Popula select de exclusão
        }
        this.applyFiltersAndPagination(); // Aplicar filtros e paginação após carregar
        this.isLoading = false; // Loading principal termina aqui
      },
      error: (err) => {
        this.errorMessage = 'Erro ao carregar todos os jogos. Tente novamente.';
        this.isLoading = false; // Loading principal termina aqui em caso de erro
      }
    });
  }

  // --- MÉTODOS PARA FILTROS E PAGINAÇÃO DE JOGOS ---
  prepareFilterOptions(): void {
    this.availableStatuses = [
      { value: '', display: 'Todos os Status' },
      { value: GameStatus.SCHEDULED, display: 'Agendado' },
      // Adicione outros status conforme seu enum GameStatus, por exemplo:
      // { value: GameStatus.IN_PLAY, display: 'Em Andamento' },
      { value: GameStatus.FINISHED, display: 'Encerrado (Placar Preenchido)' }, // Ex: Placar real informado
      { value: GameStatus.COMPLETED, display: 'Completo (Apostas Processadas)' }, // Ex: Pontuação calculada
      // { value: GameStatus.POSTPONED, display: 'Adiado' },
      // { value: GameStatus.CANCELED, display: 'Cancelado' },
    ];
  }

  applyFiltersAndPagination(): void {
    let result = [...this.allGames];

    if (this.filterRound !== '') {
      result = result.filter(g => g.round_number === Number(this.filterRound));
    }

    if (this.filterStatus !== '') {
      result = result.filter(g => g.status === this.filterStatus);
    }

    if (this.filterDate) { // filterDate é uma string 'YYYY-MM-DD'
      result = result.filter(g => {
        const gameDate = new Date(g.game_datetime);
        // Converte data do jogo para 'YYYY-MM-DD' no fuso local para comparação
        const year = gameDate.getFullYear();
        const month = ('0' + (gameDate.getMonth() + 1)).slice(-2);
        const day = ('0' + gameDate.getDate()).slice(-2);
        const gameDateString = `${year}-${month}-${day}`;
        return gameDateString === this.filterDate;
      });
    }

    this.filteredAndSortedGames = result;
    this.totalItems = this.filteredAndSortedGames.length;
    this.totalPages = Math.ceil(this.totalItems / this.itemsPerPage);

    // Ajusta currentPage se estiver fora dos limites após a filtragem
    if (this.currentPage > this.totalPages && this.totalPages > 0) {
      this.currentPage = this.totalPages;
    } else if (this.currentPage < 1 && this.totalPages > 0) {
      this.currentPage = 1;
    } else if (this.totalPages === 0) {
      this.currentPage = 1; // Ou 0, dependendo de como quer lidar com "nenhuma página"
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

  // Helper para o template, se quiser mostrar links diretos para páginas
  getPagesArray(): number[] {
    if (this.totalPages <= 0) return [];
    return new Array(this.totalPages).fill(0).map((_, index) => index + 1);
  }
  // --- FIM DOS MÉTODOS PARA FILTROS E PAGINAÇÃO ---


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

    this.isLoading = true; // Feedback de loading para esta ação específica
    this.gameService.uploadGamesExcel(this.selectedFile, this.selectedRound, token).subscribe({
      next: (createdGames) => {
        this.uploadMessage = `Sucesso! ${createdGames.length} jogo(s) inserido(s) na rodada ${this.selectedRound}.`;
        this.isUploadSuccess = true;
        this.selectedFile = null;
        this.loadAllGames(); // Recarrega a lista de jogos e aplica filtros/paginação
        const fileInput = document.getElementById('excelFile') as HTMLInputElement;
        if (fileInput) {
          fileInput.value = '';
        }
        // isLoading será false ao final de loadAllGames
      },
      error: (err) => {
        this.uploadMessage = `Erro no upload: ${err.error?.detail || 'Verifique o console para mais detalhes.'}`;
        this.isUploadSuccess = false;
        this.isLoading = false; // Garante que o loading para se houver erro no upload
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
      this.showTemporaryMessage('Não autenticado. Faça login como admin para excluir jogos.', false, 'deleteRoundMessage', 'isDeleteRoundSuccess');
      return;
    }
    this.isLoading = true;
    this.gameService.deleteGame(gameId, token).subscribe({
      next: (response) => {
        // Assumindo que response.status é do HttpResponse se não houver corpo, ou um objeto com .message
        // Se o backend retorna 204 No Content, a verificação pode ser diferente
        this.showTemporaryMessage('Jogo excluído com sucesso!', true, 'deleteRoundMessage', 'isDeleteRoundSuccess');
        this.loadAllGames(); // isLoading será false ao final
      },
      error: (err) => {
        this.showTemporaryMessage(`Erro ao excluir jogo: ${err.error?.detail || 'Verifique o console.'}`, false, 'deleteRoundMessage', 'isDeleteRoundSuccess');
        this.isLoading = false;
      }
    });
  }

  onDeleteRoundGames(): void {
    if (!confirm(`Tem certeza que deseja excluir TODOS os jogos da rodada ${this.deleteRoundNumber}?`)) {
      return;
    }

    const token = this.authService.getAccessToken();
    if (!token) {
      this.showTemporaryMessage('Não autenticado. Faça login como admin para excluir rodadas.', false, 'deleteRoundMessage', 'isDeleteRoundSuccess');
      return;
    }
    this.isLoading = true;
    this.gameService.deleteRoundGames(this.deleteRoundNumber, token).subscribe({
      next: (response: any) => { // Ajuste o tipo de 'response' conforme o que sua API retorna
        this.showTemporaryMessage(response.message || 'Rodada excluída com sucesso!', true, 'deleteRoundMessage', 'isDeleteRoundSuccess');
        this.loadAllGames(); // isLoading será false ao final
      },
      error: (err) => {
        this.showTemporaryMessage(`Erro ao excluir rodada: ${err.error?.detail || 'Verifique o console.'}`, false, 'deleteRoundMessage', 'isDeleteRoundSuccess');
        this.isLoading = false;
      }
    });
  }

  // Função auxiliar para mensagens temporárias
  private showTemporaryMessage(
    message: string,
    isSuccess: boolean,
    targetMessageProperty: 'uploadMessage' | 'deleteRoundMessage' | 'resultsUploadMessage',
    isTargetSuccessProperty: 'isUploadSuccess' | 'isDeleteRoundSuccess' | 'isResultsUploadSuccess'
  ): void {
    this.errorMessage = null; // Limpa erro geral

    (this as any)[targetMessageProperty] = message;
    (this as any)[isTargetSuccessProperty] = isSuccess;

    setTimeout(() => {
      (this as any)[targetMessageProperty] = null;
    }, 5000);
  }

  // Métodos para Gerar/Enviar Planilha de Resultados (Excel)
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
        this.showTemporaryMessage(`Erro ao baixar planilha: ${err.error?.detail || 'Verifique o console.'}`, false, 'resultsUploadMessage', 'isResultsUploadSuccess');
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
    this.isLoading = true;
    this.gameService.uploadResultsExcel(this.resultsFile, token).subscribe({
      next: (updatedGames) => {
        this.resultsUploadMessage = `Sucesso! ${updatedGames.length} jogo(s) com resultados atualizado(s).`;
        this.isResultsUploadSuccess = true;
        this.resultsFile = null;
        this.loadAllGames(); // Recarrega e aplica filtros/paginação // isLoading será false ao final
        const fileInput = document.getElementById('resultsExcelFile') as HTMLInputElement;
        if (fileInput) {
          fileInput.value = '';
        }
      },
      error: (err) => {
        this.resultsUploadMessage = `Erro no upload de resultados: ${err.error?.detail || 'Verifique o console.'}`;
        this.isResultsUploadSuccess = false;
        this.isLoading = false;
      }
    });
  }

  private clearResultsUploadMessage(): void {
    this.resultsUploadMessage = null;
    this.isResultsUploadSuccess = false;
  }
}
