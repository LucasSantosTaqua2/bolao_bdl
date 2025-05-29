import { Component, OnInit, ChangeDetectorRef, ElementRef, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { CdkDragDrop, moveItemInArray, CdkDropList, CdkDrag, CdkDragHandle } from '@angular/cdk/drag-drop';
import { TeamNameToFileNamePipe } from '../../../utils/team-name-to-file-name.pipe'; // Ajuste o caminho se necessário
import html2canvas from 'html2canvas';
import { RouterLink } from '@angular/router';

interface DraggableTeam {
  id: string;
  name: string;
  emblemUrl: string;
  originalOrder: number; // Pode ser útil para um botão "resetar para ordem original"
}

@Component({
  selector: 'app-minigame-monte-ranking',
  standalone: true,
  imports: [
    CommonModule,
    CdkDropList,
    CdkDrag,
    CdkDragHandle,
    TeamNameToFileNamePipe,
    RouterLink
  ],
  templateUrl: './minigame-monte-ranking.component.html',
  styleUrls: ['./minigame-monte-ranking.component.css'],
  providers: [TeamNameToFileNamePipe]
})
export class MinigameMonteRankingComponent implements OnInit {
  allTeamNames: string[] = [ // Sua lista completa com 20 times
    'Palmeiras', 'Flamengo', 'Cruzeiro', 'Bragantino', 'Ceará', 'Bahia',
    'Fluminense', 'Corinthians', 'Atlético-MG', 'Botafogo', 'São Paulo',
    'Mirassol', 'Vasco', 'Fortaleza', 'Internacional', 'EC Vitória',
    'Grêmio', 'Juventude', 'Santos', 'Sport'
  ];

  teamsToRank: DraggableTeam[] = [];
  readonly numberOfTeamsToSelect = 10; // MUDANÇA: Alterado para 10

  gameMessage: string = '';
  showSaveConfirmation: boolean = false;

  @ViewChild('rankingListToCapture') rankingListElement!: ElementRef;

  constructor(
    private teamNamePipe: TeamNameToFileNamePipe,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit(): void {
    this.loadRanking(); // Tenta carregar um ranking salvo ou configura um novo
  }

  setupGame(keepExistingOrder: boolean = false): void {
    this.showSaveConfirmation = false;
    this.gameMessage = 'Organize os 10 times na ordem que você acha que eles terminarão!';

    if (!keepExistingOrder || this.teamsToRank.length === 0) {
      if (this.allTeamNames.length < this.numberOfTeamsToSelect) {
        this.gameMessage = `São necessários pelo menos ${this.numberOfTeamsToSelect} times na lista para este minigame.`;
        this.teamsToRank = [];
        this.cdr.detectChanges();
        return;
      }

      // Seleciona 10 times únicos aleatoriamente
      const selectedNames = this.shuffleArray([...this.allTeamNames]).slice(0, this.numberOfTeamsToSelect);

      this.teamsToRank = selectedNames.map((name, index) => ({
        id: `team-${index}-${name.replace(/\s+/g, '-').toLowerCase()}`, // ID mais robusto
        name: name,
        emblemUrl: `assets/emblemas/${this.teamNamePipe.transform(name)}`,
        originalOrder: index // Ordem inicial da seleção aleatória
      }));
    }
    this.cdr.detectChanges();
  }

  private shuffleArray(array: any[]): any[] {
    const newArray = [...array]; // Cria uma cópia rasa
    for (let i = newArray.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [newArray[i], newArray[j]] = [newArray[j], newArray[i]]; // Troca
    }
    return newArray;
  }

  onDrop(event: CdkDragDrop<DraggableTeam[]>) {
    moveItemInArray(this.teamsToRank, event.previousIndex, event.currentIndex);
    this.showSaveConfirmation = false;
    this.gameMessage = 'Ordem alterada! Clique em "Salvar Ordem" ou "Baixar como Imagem".';
    this.cdr.detectChanges();
  }

  saveRanking(): void {
    if (typeof localStorage !== 'undefined') {
      localStorage.setItem('userTop10Ranking', JSON.stringify(this.teamsToRank.map(team => team.name)));
      this.gameMessage = 'Seu Top 10 foi salvo no navegador!';
      this.showSaveConfirmation = true;
      setTimeout(() => {
        this.showSaveConfirmation = false;
      }, 3000);
    } else {
      this.gameMessage = 'Não foi possível salvar o ranking (localStorage não disponível).';
      this.showSaveConfirmation = true; // Mostrar a mensagem de erro
       setTimeout(() => this.showSaveConfirmation = false, 3000);
    }
    this.cdr.detectChanges();
  }

  loadRanking(): void {
    let loadedFromStorage = false;
    if (typeof localStorage !== 'undefined') {
      const savedRankingNames = localStorage.getItem('userTop10Ranking'); // Chave diferente para Top 10
      if (savedRankingNames) {
        try {
          const parsedNames: string[] = JSON.parse(savedRankingNames);
          // Verifica se os times salvos ainda são válidos e se a quantidade é 10
          if (parsedNames.length === this.numberOfTeamsToSelect && parsedNames.every(name => this.allTeamNames.includes(name))) {
            this.teamsToRank = parsedNames.map((name, index) => ({
              id: `team-${index}-${name.replace(/\s+/g, '-').toLowerCase()}`,
              name: name,
              emblemUrl: `assets/emblemas/${this.teamNamePipe.transform(name)}`,
              originalOrder: this.allTeamNames.indexOf(name) // A ordem original da lista mestre
            }));
            this.gameMessage = 'Top 10 carregado do seu navegador! Organize ou salve novamente.';
            loadedFromStorage = true;
          } else {
            localStorage.removeItem('userTop10Ranking'); // Ranking salvo é inválido
          }
        } catch (e) {
          console.error("Erro ao carregar ranking Top 10 salvo:", e);
          localStorage.removeItem('userTop10Ranking');
        }
      }
    }

    if (!loadedFromStorage) {
        this.setupGame(); // Chama setupGame se nada foi carregado ou se o salvo era inválido
    }
    this.cdr.detectChanges();
  }

  resetRanking(): void {
    if (typeof localStorage !== 'undefined') {
        localStorage.removeItem('userTop10Ranking');
    }
    this.setupGame(false); // Reinicia com 10 novos times aleatórios
    this.gameMessage = 'Ranking Top 10 resetado! Organize os novos times.';
  }

  async downloadRankingAsImage(): Promise<void> {
    if (!this.rankingListElement || !this.rankingListElement.nativeElement) {
      console.error("Elemento do ranking não encontrado para captura.");
      this.gameMessage = "Erro ao gerar imagem: elemento do ranking não encontrado.";
      this.showSaveConfirmation = true;
      this.cdr.detectChanges();
      setTimeout(() => this.showSaveConfirmation = false, 4000);
      return;
    }

    const originalMessage = this.gameMessage;
    this.gameMessage = "Gerando imagem do seu Top 10...";
    this.showSaveConfirmation = true; // Usar para mostrar a mensagem de "gerando..."
    this.cdr.detectChanges();

    try {
      this.rankingListElement.nativeElement.classList.add('capturing-ranking');

      const canvas = await html2canvas(this.rankingListElement.nativeElement, {
        logging: false,
        useCORS: true,
        scale: 2,
        backgroundColor: '#ffffff',
        onclone: (document) => {
            const clonedElement = document.querySelector('.ranking-list');
            if (clonedElement) {
                // Pode adicionar lógicas específicas para o clone aqui, se necessário
            }
        }
      });

      this.rankingListElement.nativeElement.classList.remove('capturing-ranking');

      const imageType = 'image/png';
      const imageName = 'meu_top10_bolao.png';

      const link = document.createElement('a');
      link.href = canvas.toDataURL(imageType);
      link.download = imageName;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      this.gameMessage = 'Imagem do Top 10 gerada e download iniciado!';
      // showSaveConfirmation já está true
       setTimeout(() => {
        this.showSaveConfirmation = false;
        this.gameMessage = originalMessage;
        this.cdr.detectChanges();
      }, 4000);

    } catch (error) {
      this.rankingListElement.nativeElement.classList.remove('capturing-ranking');
      console.error("Erro ao gerar imagem com html2canvas:", error);
      this.gameMessage = "Ocorreu um erro ao tentar gerar a imagem do ranking.";
      // showSaveConfirmation já está true
      setTimeout(() => {
        this.showSaveConfirmation = false;
        this.gameMessage = originalMessage;
        this.cdr.detectChanges();
      }, 4000);
    }
    // this.cdr.detectChanges(); // Já está no finally do try/catch implícito do async/await
  }

  trackByTeamId(index: number, team: DraggableTeam): string {
    return team.id;
  }
}