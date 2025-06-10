import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { TeamNameToFileNamePipe } from '../../../../utils/team-name-to-file-name.pipe';

interface EmblemOption {
  teamName: string;
  emblemUrl: string;
  isCorrect: boolean;
  clipPathStyle: string;
}

@Component({
  selector: 'app-minigame-acerte-escudo',
  standalone: true,
  // O Pipe continua nos imports para o caso de ser usado no template no futuro
  imports: [CommonModule, RouterModule, TeamNameToFileNamePipe],
  templateUrl: './minigame-acerte-escudo.component.html',
  styleUrls: ['./minigame-acerte-escudo.component.css'],
  // providers: [TeamNameToFileNamePipe] // 1. Remova a linha de providers
})
export class MinigameAcerteEscudoComponent implements OnInit {
  // ... (outras propriedades como allTeamNames, score, etc. continuam aqui)
  allTeamNames = [
    'América-MG', 'Athletico-PR', 'Atlético-GO', 'Atlético-MG', 'Bahia',
    'Botafogo', 'Corinthians', 'Criciúma', 'Cruzeiro', 'Cuiabá',
    'Flamengo', 'Fluminense', 'Fortaleza', 'Grêmio', 'Internacional',
    'Juventude', 'Palmeiras', 'Red Bull Bragantino', 'São Paulo', 'Vasco da Gama'
  ];
  availableTeamNames: string[] = [];
  emblemOptions: EmblemOption[] = [];
  currentQuestionTeamName: string = '';

  score = 0;
  attempts = 0;
  gameInProgress = true;
  gameLocked = false;
  feedbackMessage = '';
  isCorrectAnswer?: boolean;


  // 2. Instancie o Pipe diretamente como uma propriedade da classe
  private teamNameToFileName = new TeamNameToFileNamePipe();

  // 3. Deixe o construtor vazio, sem injeção
  constructor() { }

  ngOnInit(): void {
    this.startGame();
  }

  startGame(): void {
    this.score = 0;
    this.attempts = 0;
    this.gameInProgress = true;
    this.availableTeamNames = [...this.allTeamNames];
    this.nextQuestion();
  }

  nextQuestion(): void {
    if (this.availableTeamNames.length < 4) {
      this.endGame();
      return;
    }

    this.feedbackMessage = '';
    this.isCorrectAnswer = undefined;
    this.gameLocked = false;

    const correctTeamIndex = Math.floor(Math.random() * this.availableTeamNames.length);
    const correctTeamName = this.availableTeamNames.splice(correctTeamIndex, 1)[0];
    this.currentQuestionTeamName = correctTeamName;

    const incorrectTeamNames = this.getIncorrectAnswers(correctTeamName);

    const optionsWithObfuscation = [
      // A chamada para `this.teamNameToFileName.transform` agora usa a instância local
      { teamName: correctTeamName, emblemUrl: this.teamNameToFileName.transform(correctTeamName), isCorrect: true },
      ...incorrectTeamNames.map(name => ({
        teamName: name,
        emblemUrl: this.teamNameToFileName.transform(name),
        isCorrect: false
      }))
    ].map(option => {
      const shouldObfuscate = Math.random() <= 0.7;
      let clipPathStyle = 'none';

      if (shouldObfuscate) {
        const radius = Math.floor(Math.random() * 15) + 30;
        const posX = Math.floor(Math.random() * 50) + 25;
        const posY = Math.floor(Math.random() * 50) + 25;
        clipPathStyle = `circle(${radius}% at ${posX}% ${posY}%)`;
      }
      return { ...option, clipPathStyle };
    });

    this.emblemOptions = this.shuffleArray(optionsWithObfuscation);
  }

  getIncorrectAnswers(correctTeamName: string): string[] {
    const incorrectOptions: string[] = [];
    const tempAvailableNames = this.allTeamNames.filter(name => name !== correctTeamName);

    while (incorrectOptions.length < 3) {
      const randomIndex = Math.floor(Math.random() * tempAvailableNames.length);
      const selectedName = tempAvailableNames.splice(randomIndex, 1)[0];
      incorrectOptions.push(selectedName);
    }
    return incorrectOptions;
  }

  selectEmblem(selectedOption: EmblemOption): void {
    if (this.gameLocked) return;

    this.gameLocked = true;
    this.attempts++;
    this.isCorrectAnswer = selectedOption.isCorrect;

    if (this.isCorrectAnswer) {
      this.score++;
      this.feedbackMessage = 'Parabéns, você acertou!';
    } else {
      this.feedbackMessage = 'Que pena, você errou!';
    }

    setTimeout(() => {
      this.nextQuestion();
    }, 2000);
  }

  shuffleArray<T>(array: T[]): T[] {
    for (let i = array.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [array[i], array[j]] = [array[j], array[i]];
    }
    return array;
  }

  endGame(): void {
    this.gameInProgress = false;
  }

  restartGame(): void {
    this.startGame();
  }
}
