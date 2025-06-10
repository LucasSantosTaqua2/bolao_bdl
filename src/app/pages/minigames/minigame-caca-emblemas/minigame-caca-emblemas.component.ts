import { Component, OnInit, OnDestroy, ChangeDetectorRef, Renderer2, ElementRef, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { TeamNameToFileNamePipe } from '../../../utils/team-name-to-file-name.pipe'; // Ajuste o caminho
import { RouterLink } from '@angular/router';

interface TargetEmblem {
  teamName: string;
  emblemUrl: string;
  x: number; // Posição X em %
  y: number; // Posição Y em %
  id: string; // Para identificação única
  isTarget: boolean;
  visible: boolean;
  clicked: boolean; // Para evitar múltiplos cliques no mesmo
  animationClass?: string; // Para animações CSS
  timeoutId?: any; // Para controlar o desaparecimento
}

@Component({
  selector: 'app-minigame-caca-emblemas',
  standalone: true,
  imports: [CommonModule, TeamNameToFileNamePipe, RouterLink],
  templateUrl: './minigame-caca-emblemas.component.html',
  styleUrls: ['./minigame-caca-emblemas.component.css'],
  providers: [TeamNameToFileNamePipe]
})
export class MinigameCacaEmblemasComponent implements OnInit, OnDestroy {
  allTeamNames: string[] = [
    'Palmeiras', 'Flamengo', 'Cruzeiro', 'Bragantino', 'Ceará', 'Bahia',
    'Fluminense', 'Corinthians', 'Atlético-MG', 'Botafogo', 'São Paulo',
    'Mirassol', 'Vasco', 'Fortaleza', 'Internacional', 'EC Vitória',
    'Grêmio', 'Juventude', 'Santos', 'Sport'
  ];

  activeEmblems: TargetEmblem[] = [];
  currentTargetTeamName: string = '';
  score: number = 0;
  lives: number = 2; // Opcional: sistema de vidas
  timeLeftInRound: number = 0; // Opcional: timer para cada "caçada"
  roundInterval: any;
  roundDuration: number = 4000; // 5 segundos para encontrar o emblema
  maxEmblemsOnScreen: number = 20; // Quantos emblemas aparecem por vez (1 alvo + 6 distratores)
  gameMessage: string = 'Clique em "Iniciar" para começar!';
  gameInProgress: boolean = false;
  gameOver: boolean = false;

  @ViewChild('gameArea', { static: false }) gameAreaRef!: ElementRef;

  constructor(
    private teamNamePipe: TeamNameToFileNamePipe,
    private cdr: ChangeDetectorRef,
    private renderer: Renderer2 // Para interações mais complexas, se necessário
  ) {}

  ngOnInit(): void {
    // O jogo não começa automaticamente
  }

  ngOnDestroy(): void {
    this.clearAllTimeoutsAndIntervals();
  }

  private clearAllTimeoutsAndIntervals(): void {
    if (this.roundInterval) {
      clearInterval(this.roundInterval);
    }
    this.activeEmblems.forEach(emblem => {
      if (emblem.timeoutId) {
        clearTimeout(emblem.timeoutId);
      }
    });
  }

  startGame(): void {
    this.score = 0;
    this.lives = 2;
    this.gameInProgress = true;
    this.gameOver = false;
    this.gameMessage = '';
    this.nextRound();
  }

  nextRound(): void {
    this.clearAllTimeoutsAndIntervals();
    this.activeEmblems = [];
    this.cdr.detectChanges(); // Limpa a UI antes de adicionar novos

    if (this.lives <= 0) {
      this.endGame();
      return;
    }

    // 1. Escolher time alvo
    const targetIndex = Math.floor(Math.random() * this.allTeamNames.length);
    this.currentTargetTeamName = this.allTeamNames[targetIndex];
    this.gameMessage = `Clique no escudo do: ${this.currentTargetTeamName}!`;

    // 2. Preparar lista de emblemas para esta rodada
    const teamsForRound = new Set<string>();
    teamsForRound.add(this.currentTargetTeamName);

    const tempTeamList = this.allTeamNames.filter(name => name !== this.currentTargetTeamName);
    this.shuffleArray(tempTeamList);

    for (let i = 0; teamsForRound.size < this.maxEmblemsOnScreen && i < tempTeamList.length; i++) {
      teamsForRound.add(tempTeamList[i]);
    }

    const teamsArray = Array.from(teamsForRound);
    this.shuffleArray(teamsArray); // Embaralha a ordem de aparição/criação

    // 3. Criar e posicionar emblemas
    teamsArray.forEach((teamName, index) => {
      this.spawnEmblem(teamName, teamName === this.currentTargetTeamName, index);
    });

    // 4. Iniciar timer da rodada
    this.timeLeftInRound = this.roundDuration / 1000;
    this.roundInterval = setInterval(() => {
      this.timeLeftInRound--;
      if (this.timeLeftInRound <= 0) {
        this.handleMissOrTimeout();
      }
      this.cdr.detectChanges();
    }, 1000);

    this.cdr.detectChanges();
  }

  private spawnEmblem(teamName: string, isTarget: boolean, idSuffix: number | string): void {
    if (!this.gameAreaRef || !this.gameAreaRef.nativeElement) return;

    const gameAreaWidth = this.gameAreaRef.nativeElement.offsetWidth;
    const gameAreaHeight = this.gameAreaRef.nativeElement.offsetHeight;
    const emblemSize = 60; // Tamanho do emblema em pixels

    // Evitar que o emblema apareça muito perto das bordas
    const maxX = Math.max(0, gameAreaWidth - emblemSize - 20); // 20px de margem
    const maxY = Math.max(0, gameAreaHeight - emblemSize - 20);

    const newEmblem: TargetEmblem = {
      teamName: teamName,
      emblemUrl: `assets/emblemas/${this.teamNamePipe.transform(teamName)}`,
      x: 10 + Math.random() * (maxX > 0 ? 80: 0), // Posição X em % (ajustar para caber)
      y: 10 + Math.random() * (maxY > 0 ? 80: 0), // Posição Y em %
      id: `emblem-${idSuffix}-${Date.now()}`,
      isTarget: isTarget,
      visible: true,
      clicked: false,
      animationClass: this.getRandomAnimation()
    };

    // Fazer o emblema desaparecer após um tempo
    newEmblem.timeoutId = setTimeout(() => {
      this.removeEmblem(newEmblem.id);
      // Se o emblema alvo sumir sem ser clicado, conta como erro (se ainda não foi clicado)
      if (newEmblem.isTarget && !newEmblem.clicked && this.gameInProgress) {
         // A lógica de timeout do round já trata isso, mas pode ser um backup
      }
    }, this.roundDuration - 500); // Desaparece um pouco antes do fim da rodada

    this.activeEmblems.push(newEmblem);
  }

  private removeEmblem(emblemId: string): void {
    const index = this.activeEmblems.findIndex(e => e.id === emblemId);
    if (index > -1) {
      if (this.activeEmblems[index].timeoutId) clearTimeout(this.activeEmblems[index].timeoutId);
      this.activeEmblems.splice(index, 1);
      this.cdr.detectChanges();
    }
  }

  onEmblemClick(clickedEmblem: TargetEmblem): void {
    if (!this.gameInProgress || clickedEmblem.clicked) return;

    clickedEmblem.clicked = true; // Marca como clicado para evitar processamento duplo
    // clearTimeout(clickedEmblem.timeoutId); // Remove o timeout de desaparecimento se foi clicado
    // this.removeEmblem(clickedEmblem.id); // Remove imediatamente ao clicar ou anima a saída

    if (clickedEmblem.isTarget) {
      this.score++;
      this.gameMessage = 'Boa! Você acertou! 👍';
      // Animação de acerto pode ser adicionada aqui
      setTimeout(() => this.nextRound(), 1000); // Próxima rodada após 1s
    } else {
      this.lives--;
      this.gameMessage = 'Errado! Menos uma vida... 😬';
      // Animação de erro pode ser adicionada aqui
      if (this.lives <= 0) {
        this.endGame();
      } else {
        // Pode continuar a rodada atual ou ir para a próxima
         setTimeout(() => this.nextRound(), 1000);
      }
    }
    this.clearAllTimeoutsAndIntervals(); // Limpa timers da rodada ao clicar
    this.activeEmblems.forEach(e => e.visible = false); // Esconde todos os emblemas
    this.cdr.detectChanges();
  }

  private handleMissOrTimeout(): void {
    if (!this.gameInProgress) return;

    clearInterval(this.roundInterval);
    this.lives--;
    this.gameMessage = `Tempo esgotado ou alvo perdido! O time era ${this.currentTargetTeamName}.`;
    this.activeEmblems.forEach(e => e.visible = false); // Esconde todos
    this.cdr.detectChanges();

    if (this.lives <= 0) {
      this.endGame();
    } else {
      setTimeout(() => this.nextRound(), 1500); // Delay antes da próxima rodada
    }
  }


  private endGame(): void {
    this.clearAllTimeoutsAndIntervals();
    this.gameInProgress = false;
    this.gameOver = true;
    this.gameMessage = `Fim de Jogo! Sua pontuação final: ${this.score}.`;
    this.activeEmblems = [];
    this.cdr.detectChanges();
  }

  private shuffleArray(array: any[]): void {
    for (let i = array.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [array[i], array[j]] = [array[j], array[i]];
    }
  }

  private getRandomAnimation(): string {
    const animations = ['fadeInQuick', 'zoomInQuick', 'slideInTopQuick'];
    return animations[Math.floor(Math.random() * animations.length)];
  }

  getEmblemStyle(emblem: TargetEmblem): any {
    return {
      'top': `${emblem.y}%`,
      'left': `${emblem.x}%`,
      'opacity': emblem.visible ? 1 : 0,
      'pointer-events': emblem.visible ? 'auto' : 'none' // Só permite clique se visível
    };
  }
}
