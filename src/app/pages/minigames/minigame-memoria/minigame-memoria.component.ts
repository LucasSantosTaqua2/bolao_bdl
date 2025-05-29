import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { TeamNameToFileNamePipe } from '../../../utils/team-name-to-file-name.pipe'; // Ajuste o caminho se necessário
import { RouterLink } from '@angular/router';

interface Card {
  id: number; // Identificador único para a carta no grid
  teamName: string;
  emblemUrl: string;
  isFlipped: boolean; // Se a carta está virada para cima
  isMatched: boolean; // Se a carta já faz parte de um par encontrado
  uniqueId: string; // Para ajudar no ngFor trackBy e identificação do par
}

@Component({
  selector: 'app-minigame-memoria',
  standalone: true,
  imports: [CommonModule, TeamNameToFileNamePipe, RouterLink],
  templateUrl: './minigame-memoria.component.html',
  styleUrls: ['./minigame-memoria.component.css'],
  providers: [TeamNameToFileNamePipe]
})
export class MinigameMemoriaComponent implements OnInit {
  // Lista de times (pode ser a mesma usada no "Acerte o Escudo" ou uma subseção)
  allTeamNames: string[] = [
    'Palmeiras', 'Flamengo', 'Cruzeiro', 'Bragantino', 'Ceará', 'Bahia',
    'Fluminense', 'Corinthians', 'Atlético-MG', 'Botafogo', 'São Paulo',
    'Mirassol', 'Vasco', 'Fortaleza', 'Internacional', 'EC Vitória',
    'Grêmio', 'Juventude', 'Santos', 'Sport'
  ];

  cards: Card[] = [];
  flippedCards: Card[] = [];
  moves: number = 0;
  matchedPairs: number = 0;
  totalPairs: number = 0;
  gameLocked: boolean = false; // Para impedir cliques enquanto as cartas desviram
  gameWon: boolean = false;

  readonly numberOfPairsToSelect = 8; // Quantos pares únicos queremos no jogo (resultará em 16 cartas)

  constructor(
    private teamNamePipe: TeamNameToFileNamePipe,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit(): void {
    this.setupGame();
  }

  setupGame(): void {
    this.cards = [];
    this.flippedCards = [];
    this.moves = 0;
    this.matchedPairs = 0;
    this.gameLocked = false;
    this.gameWon = false;

    // 1. Selecionar times para os pares
    if (this.allTeamNames.length < this.numberOfPairsToSelect) {
      console.error("Não há times suficientes para o número de pares desejado.");
      // Adicionar alguma mensagem para o usuário aqui se desejar
      return;
    }

    const selectedTeams = this.shuffleArray([...this.allTeamNames]).slice(0, this.numberOfPairsToSelect);
    this.totalPairs = selectedTeams.length;

    // 2. Criar as cartas (duas para cada time selecionado)
    let cardIdCounter = 0;
    selectedTeams.forEach(teamName => {
      const emblemUrl = `assets/emblemas/${this.teamNamePipe.transform(teamName)}`;
      // Criar dois cards para cada time
      for (let i = 0; i < 2; i++) {
        this.cards.push({
          id: cardIdCounter++,
          teamName: teamName,
          emblemUrl: emblemUrl,
          isFlipped: false,
          isMatched: false,
          uniqueId: `${teamName}-${i}` // Identificador único para o par
        });
      }
    });

    // 3. Embaralhar as cartas
    this.cards = this.shuffleArray(this.cards);
    this.cdr.detectChanges();
  }

  flipCard(card: Card): void {
    if (this.gameLocked || card.isFlipped || card.isMatched || this.flippedCards.length >= 2) {
      return;
    }

    card.isFlipped = true;
    this.flippedCards.push(card);

    if (this.flippedCards.length === 2) {
      this.moves++;
      this.gameLocked = true; // Bloqueia mais cliques até a verificação
      this.checkForMatch();
    }
    this.cdr.detectChanges();
  }

  private checkForMatch(): void {
    const [card1, card2] = this.flippedCards;

    if (card1.teamName === card2.teamName) { // Encontrou um par!
      card1.isMatched = true;
      card2.isMatched = true;
      this.matchedPairs++;
      this.flippedCards = [];
      this.gameLocked = false;
      if (this.matchedPairs === this.totalPairs) {
        this.gameWon = true;
        // Adicionar mensagem de vitória ou lógica de fim de jogo
      }
    } else { // Não é um par
      setTimeout(() => {
        card1.isFlipped = false;
        card2.isFlipped = false;
        this.flippedCards = [];
        this.gameLocked = false;
        this.cdr.detectChanges();
      }, 1200); // Tempo para visualizar as cartas antes de desvirar
    }
  }

  private shuffleArray(array: any[]): any[] {
    const newArray = [...array]; // Criar uma cópia para não modificar o original diretamente se não for desejado
    for (let i = newArray.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [newArray[i], newArray[j]] = [newArray[j], newArray[i]];
    }
    return newArray;
  }

  restartGame(): void {
    this.setupGame();
  }

  // Para usar no ngFor para melhor performance
  trackByCardId(index: number, card: Card): number {
    return card.id;
  }
}