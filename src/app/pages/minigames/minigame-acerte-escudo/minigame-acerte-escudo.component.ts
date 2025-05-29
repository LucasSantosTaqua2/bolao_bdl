import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { TeamNameToFileNamePipe } from '../../../utils/team-name-to-file-name.pipe';
import { RouterLink } from '@angular/router';
// Ajuste o caminho se necessário

interface EmblemOption {
  teamName: string;
  emblemUrl: string;
  isCorrect: boolean;
}

@Component({
  selector: 'app-minigame-acerte-escudo',
  standalone: true,
  imports: [CommonModule, TeamNameToFileNamePipe, RouterLink],
  templateUrl: './minigame-acerte-escudo.component.html',
  styleUrls: ['./minigame-acerte-escudo.component.css'],
  providers: [TeamNameToFileNamePipe]
})
export class MinigameAcerteEscudoComponent implements OnInit {
  // Lista de times fornecida por você
  allTeamNames: string[] = [
    'Palmeiras', 'Flamengo', 'Cruzeiro', 'Bragantino', 'Ceará', 'Bahia',
    'Fluminense', 'Corinthians', 'Atlético-MG', 'Botafogo', 'São Paulo',
    'Mirassol', 'Vasco', 'Fortaleza', 'Internacional', 'EC Vitória',
    'Grêmio', 'Juventude', 'Santos', 'Sport'
  ];

  currentQuestionTeamName: string = '';
  emblemOptions: EmblemOption[] = [];
  feedbackMessage: string = '';
  score: number = 0;
  attempts: number = 0;
  gameInProgress: boolean = false;
  showFeedback: boolean = false;
  isCorrectAttempt: boolean = false;

  readonly numberOfOptions = 4; // Quantos emblemas mostrar (1 correto + 3 errados)

  constructor(
    private teamNamePipe: TeamNameToFileNamePipe,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit(): void {
    this.startGame();
  }

  startGame(): void {
    this.gameInProgress = true;
    this.score = 0;
    this.attempts = 0;
    this.nextQuestion();
  }

  nextQuestion(): void {
    this.showFeedback = false;
    this.feedbackMessage = '';
    this.emblemOptions = [];

    if (this.allTeamNames.length < this.numberOfOptions) {
      this.feedbackMessage = "Não há times suficientes para continuar o jogo.";
      this.gameInProgress = false;
      return;
    }

    // 1. Escolher o time correto aleatoriamente
    const correctAnswerIndex = Math.floor(Math.random() * this.allTeamNames.length);
    this.currentQuestionTeamName = this.allTeamNames[correctAnswerIndex];

    // 2. Adicionar o time correto às opções
    this.emblemOptions.push({
      teamName: this.currentQuestionTeamName,
      emblemUrl: `assets/emblemas/${this.teamNamePipe.transform(this.currentQuestionTeamName)}`,
      isCorrect: true
    });

    // 3. Escolher times errados (distratores)
    const tempTeamList = [...this.allTeamNames];
    tempTeamList.splice(correctAnswerIndex, 1); // Remove o time correto da lista temporária

    for (let i = 0; i < this.numberOfOptions - 1; i++) {
      if (tempTeamList.length === 0) break; // Não há mais times únicos para escolher

      const distractorIndex = Math.floor(Math.random() * tempTeamList.length);
      const distractorTeamName = tempTeamList[distractorIndex];
      this.emblemOptions.push({
        teamName: distractorTeamName,
        emblemUrl: `assets/emblemas/${this.teamNamePipe.transform(distractorTeamName)}`,
        isCorrect: false
      });
      tempTeamList.splice(distractorIndex, 1); // Remove o distrator escolhido para não repetir
    }

    // 4. Embaralhar as opções
    this.shuffleArray(this.emblemOptions);
    this.cdr.detectChanges();
  }

  selectEmblem(selectedOption: EmblemOption): void {
    if (!this.gameInProgress || this.showFeedback) {
      return;
    }

    this.attempts++;
    this.showFeedback = true;

    if (selectedOption.isCorrect) {
      this.score++;
      this.feedbackMessage = 'Correto! 🎉';
      this.isCorrectAttempt = true;
    } else {
      this.feedbackMessage = `Errado! O time era ${this.currentQuestionTeamName}. 😢`;
      this.isCorrectAttempt = false;
    }

    // Prepara para a próxima pergunta após um pequeno delay
    setTimeout(() => {
      if (this.gameInProgress) { // Verifica se o jogo ainda deve continuar
        this.nextQuestion();
      }
    }, 2000); // Delay de 2 segundos para mostrar o feedback
  }

  private shuffleArray(array: any[]): void {
    for (let i = array.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [array[i], array[j]] = [array[j], array[i]]; // Troca de elementos
    }
  }

  // Função para reiniciar o jogo (pode ser chamada por um botão "Jogar Novamente")
  restartGame(): void {
    this.startGame();
  }
}