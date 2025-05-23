// src/app/pages/admin-panel/admin-panel.component.ts
import { Component, OnInit } from '@angular/core';
import { CommonModule, DatePipe, TitleCasePipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { AuthService} from '../../services/auth.service';
import { UserProfile } from '../../models/user.model';
import { GameService } from '../../services/game.service';
// <<< MUDANÇA AQUI: Importar GameRead e GameStatus do game.model.ts
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

  // Propriedades para Gerar/Enviar Planilha de Resultados (Excel)
  downloadRoundNumber: number = 1;
  resultsFile: File | null = null;
  resultsUploadMessage: string | null = null;
  isResultsUploadSuccess: boolean = false;

  rounds: number[] = Array.from({ length: 38 }, (_, i) => i + 1); // Array de 1 a 38 para selects de rodada
  roundsWithGames: number[] = []; // Array de rodadas que possuem jogos

  constructor(
    private authService: AuthService,
    private gameService: GameService
  ) { }

  ngOnInit(): void {
    this.loadAllUsers();
    this.loadAllGames();
  }

  // --- FUNÇÃO AUXILIAR PARA PARSEAR DATAS COMO UTC ---
  // Esta função não é mais necessária aqui para game_datetime, pois o GameService já faz.
  // Mantenha-a APENAS se as datas em UserProfile (created_at, updated_at)
  // precisarem ser convertidas de string para Date e depois para string ISO para exibição.
  // Se seu pipe 'date' no HTML consegue formatar a string diretamente, você pode removê-la.
  private parseUserDateString(dateString: string): string {
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
        this.allUsers = users.sort((a, b) => a.id - b.id);
        this.isLoading = false;
       
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
        return;
    }
    this.gameService.getAllGamesAdmin(token).subscribe({
      next: (games) => {
        this.allGames = games;
        this.roundsWithGames = [...new Set(this.allGames.map(game => game.round_number))].sort((a, b) => a - b);

        if (this.roundsWithGames.length > 0) {
          this.downloadRoundNumber = this.roundsWithGames[0];
          this.deleteRoundNumber = this.roundsWithGames[0];
        }
      },
      error: (err) => {
     
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
        this.loadAllGames();
        const fileInput = document.getElementById('excelFile') as HTMLInputElement;
        if (fileInput) {
            fileInput.value = '';
        }
      },
      error: (err) => {
       
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
          this.errorMessage = null;
          this.loadAllGames();
          this.showTemporaryMessage('Jogo excluído com sucesso!', true, 'deleteRoundMessage', 'isDeleteRoundSuccess');
        } else {
          this.showTemporaryMessage('Erro inesperado ao excluir jogo.', false, 'deleteRoundMessage', 'isDeleteRoundSuccess');
        }
      },
      error: (err) => {
  
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
        
        this.showTemporaryMessage(`Erro ao excluir rodada: ${err.error?.detail || 'Verifique o console.'}`, false, 'deleteRoundMessage', 'isDeleteRoundSuccess');
      }
    });
  }

  private showTemporaryMessage(message: string, isSuccess: boolean, targetMessageProperty: 'uploadMessage' | 'deleteRoundMessage' | 'resultsUploadMessage', isTargetSuccessProperty: 'isUploadSuccess' | 'isDeleteRoundSuccess' | 'isResultsUploadSuccess'): void {
      this.errorMessage = null;

      (this as any)[targetMessageProperty] = message;
      (this as any)[isTargetSuccessProperty] = isSuccess;

      setTimeout(() => {
          (this as any)[targetMessageProperty] = null;
      }, 5000);
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
        this.loadAllGames();

        const fileInput = document.getElementById('resultsExcelFile') as HTMLInputElement;
        if (fileInput) {
            fileInput.value = '';
        }
      },
      error: (err) => {
       
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
