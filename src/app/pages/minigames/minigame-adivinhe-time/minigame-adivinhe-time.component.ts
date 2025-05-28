import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { TeamNameToFileNamePipe } from '../../../utils/team-name-to-file-name.pipe'; // Ajuste o caminho

interface NameOption {
  name: string;
  isCorrect: boolean;
  isChosen?: boolean;
  isActualCorrect?: boolean;
  isDisabled?: boolean; // Para desabilitar opções já tentadas erroneamente
}

@Component({
  selector: 'app-minigame-adivinhe-time',
  standalone: true,
  imports: [CommonModule, FormsModule, TeamNameToFileNamePipe],
  templateUrl: './minigame-adivinhe-time.component.html',
  styleUrls: ['./minigame-adivinhe-time.component.css'],
  providers: [TeamNameToFileNamePipe]
})
export class MinigameAdivinheTimeComponent implements OnInit {
  allTeamNames: string[] = [
    'Palmeiras', 'Flamengo', 'Cruzeiro', 'Bragantino', 'Ceará', 'Bahia',
    'Fluminense', 'Corinthians', 'Atlético-MG', 'Botafogo', 'São Paulo',
    'Mirassol', 'Vasco', 'Fortaleza', 'Internacional', 'EC Vitória',
    'Grêmio', 'Juventude', 'Santos', 'Sport'
  ];

  correctTeamName: string = '';
  correctEmblemUrl: string = '';
  nameOptions: NameOption[] = [];
  readonly numberOfNameOptions = 4;

  score: number = 0;
  totalChallenges: number = 0; // Total de desafios/escudos apresentados
  feedbackMessage: string = '';
  showFeedback: boolean = false;
  isCorrectGuess: boolean = false;
  gameInProgress: boolean = false;
  challengeRevealed: boolean = false; // Indica se o desafio atual foi completamente revelado (acerto ou todos erros)

  // Níveis de distorção
  initialDistortion: number = 12;
  currentDistortion: number = this.initialDistortion;
  minDistortion: number = 0;
  distortionReductionStep: number = 4; // Redução maior do blur por erro
  maxAttemptsPerChallenge: number = 3; // Ex: 3 tentativas para adivinhar o mesmo escudo
  attemptsThisChallenge: number = 0;


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
    this.totalChallenges = 0;
    this.nextChallenge();
  }

  nextChallenge(): void {
    this.showFeedback = false;
    this.feedbackMessage = '';
    this.nameOptions = [];
    this.currentDistortion = this.initialDistortion;
    this.attemptsThisChallenge = 0;
    this.challengeRevealed = false;
    this.isCorrectGuess = false;
    this.cdr.detectChanges();


    if (this.allTeamNames.length < 1) { // Precisa de pelo menos 1 time para ser a resposta
      this.feedbackMessage = "Times insuficientes para continuar.";
      this.gameInProgress = false;
      this.cdr.detectChanges();
      return;
    }
    if (this.allTeamNames.length < this.numberOfNameOptions && this.numberOfNameOptions > 1) {
        console.warn("Número de opções é maior que o de times disponíveis, pode haver repetições ou menos opções.");
    }


    const correctTeamIndex = Math.floor(Math.random() * this.allTeamNames.length);
    this.correctTeamName = this.allTeamNames[correctTeamIndex];
    this.correctEmblemUrl = `assets/emblemas/${this.teamNamePipe.transform(this.correctTeamName)}`;

    const optionsSet = new Set<string>();
    optionsSet.add(this.correctTeamName);

    // Adiciona o nome correto
    this.nameOptions.push({ name: this.correctTeamName, isCorrect: true, isDisabled: false });

    // Adiciona nomes incorretos
    const tempTeamList = this.allTeamNames.filter(name => name !== this.correctTeamName);
    this.shuffleArray(tempTeamList); // Embaralha para pegar distratores diferentes

    for (let i = 0; this.nameOptions.length < this.numberOfNameOptions && i < tempTeamList.length; i++) {
        if (!optionsSet.has(tempTeamList[i])) {
            this.nameOptions.push({ name: tempTeamList[i], isCorrect: false, isDisabled: false });
            optionsSet.add(tempTeamList[i]);
        }
    }
    // Se ainda não tivermos opções suficientes (caso de poucos times restantes), preenche com o que tiver
    while(this.nameOptions.length < this.numberOfNameOptions && tempTeamList.length > this.nameOptions.length -1 ) {
        // Esta condição é para evitar loop infinito se tempTeamList for muito pequena
        // Em um cenário real, teríamos mais times ou menos opções
        const randomDistractor = tempTeamList[Math.floor(Math.random() * tempTeamList.length)];
        if(!optionsSet.has(randomDistractor)){
             this.nameOptions.push({ name: randomDistractor, isCorrect: false, isDisabled: false });
             optionsSet.add(randomDistractor);
        } else if (this.nameOptions.length < this.numberOfNameOptions) {
            // Adiciona um placeholder ou lida com a falta de opções
            // Para simplificar, pode adicionar um distrator repetido se for o caso extremo
            // ou simplesmente ter menos opções. Aqui, vamos parar para não ter repetição visível imediata.
            break;
        }
    }


    this.shuffleArray(this.nameOptions);
    this.totalChallenges++;
    this.cdr.detectChanges();
  }


  guessName(selectedOption: NameOption): void {
    if (!this.gameInProgress || this.challengeRevealed || selectedOption.isDisabled) {
      return;
    }

    this.attemptsThisChallenge++;
    this.showFeedback = true; // Mostra feedback imediatamente

    this.nameOptions.forEach(opt => {
        opt.isChosen = (opt.name === selectedOption.name);
        // Não marcar isActualCorrect ainda, só depois do feedback
    });


    if (selectedOption.isCorrect) {
      this.score++;
      this.feedbackMessage = 'Você acertou! Mandou bem! 👍';
      this.isCorrectGuess = true;
      this.currentDistortion = this.minDistortion; // Revela totalmente
      this.challengeRevealed = true; // Trava este desafio e permite ir para o próximo
      this.disableAllOptions();
    } else {
      this.feedbackMessage = `Errado! Tente de novo ou veja se melhora.`;
      this.isCorrectGuess = false;
      selectedOption.isDisabled = true; // Desabilita a opção errada

      if (this.attemptsThisChallenge < this.maxAttemptsPerChallenge) {
        this.currentDistortion = Math.max(this.minDistortion, this.currentDistortion - this.distortionReductionStep);
        // O feedback já está sendo mostrado, não precisa de timeout para mudar de desafio aqui.
        // Mantém o desafio atual.
      } else {
        this.feedbackMessage = `Que pena! O time correto era ${this.correctTeamName}.`;
        this.currentDistortion = this.minDistortion; // Revela totalmente
        this.challengeRevealed = true; // Permite ir para o próximo
        this.disableAllOptions(true); // Destaca a correta
      }
    }
    this.cdr.detectChanges();
  }

  proceedToNextChallenge(): void {
    if (this.challengeRevealed) { // Só permite ir para o próximo se o atual foi resolvido/esgotado
        this.nextChallenge();
    }
  }

  private disableAllOptions(highlightCorrect: boolean = false): void {
    this.nameOptions.forEach(opt => {
        opt.isDisabled = true;
        if (highlightCorrect && opt.isCorrect) {
            opt.isActualCorrect = true;
        }
    });
  }

  private shuffleArray(array: any[]): void {
    for (let i = array.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [array[i], array[j]] = [array[j], array[i]];
    }
  }

  restartGame(): void {
    this.startGame();
  }
}