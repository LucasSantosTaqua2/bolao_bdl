// src/app/apostar/apostar.component.ts
import { CommonModule, DatePipe } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { FormsModule, NgForm } from '@angular/forms';
import { GameService } from '../../services/game.service';
import { BetService, UserBet } from '../../services/bet.service';
import { GameRead, GameStatus } from '../../models/game.model'; // GameRead agora com 'user_bet_...'
import { AuthService } from '../../services/auth.service';
import { BetRead } from '../../models/bet.model';

@Component({
  selector: 'app-apostar',
  standalone: true,
  imports: [CommonModule, FormsModule, DatePipe],
  templateUrl: './apostar.component.html',
  styleUrl: './apostar.component.css'
})
export class ApostarComponent implements OnInit {
  allGamesData: GameRead[] = [];
  games: GameRead[] = [];
  message: string = '';
  isSuccess: boolean = false;
  selectedRound: number = 1;
  availableRounds: number[] = [];
  isLoading: boolean = true;
  private userToken: string | null = null;

  public now: Date = new Date(); // Propriedade 'now' para comparações de data no template.

  public GameStatus = GameStatus; // Exponha o GameStatus para o template

  constructor(
    private gameService: GameService,
    private betService: BetService,
    private authService: AuthService
  ) { }

  ngOnInit(): void {
    this.userToken = this.authService.getAccessToken();
    if (!this.userToken) {
      this.message = 'Você precisa estar logado para ver os jogos e fazer apostas.';
      this.isSuccess = false;
      this.isLoading = false;
      return;
    }
    this.loadAllGamesAndRounds();
  }

  loadAllGamesAndRounds(): void {
    this.isLoading = true;
    this.message = '';
    this.isSuccess = false;

    if (!this.userToken) {
      this.message = 'Token de usuário não disponível. Por favor, faça login novamente.';
      this.isSuccess = false;
      this.isLoading = false;
      return;
    }

    this.gameService.getAllGamesForUser(this.userToken).subscribe({
      next: (gamesFromApi) => {
        this.allGamesData = gamesFromApi;

        this.availableRounds = [...new Set(this.allGamesData
          .map(game => game.round_number)
        )].sort((a, b) => a - b);

        if (this.availableRounds.length > 0) {
          this.selectedRound = this.availableRounds[0];
          this.onRoundChange();
        } else {
          this.games = [];
          this.message = 'Nenhuma rodada com jogos encontrada no banco de dados.';
          this.isSuccess = true;
          this.isLoading = false;
        }
      },
      error: (err) => {
        console.error('Erro ao carregar todos os jogos e rodadas:', err);
        this.message = 'Erro ao carregar jogos e rodadas. Tente novamente mais tarde.';
        this.isSuccess = false;
        this.isLoading = false;
      }
    });
  }

  onRoundChange(): void {
    this.message = '';
    this.isSuccess = false;
    this.isLoading = true;

    if (!this.userToken) {
      this.message = 'Token de usuário não disponível. Por favor, faça login novamente.';
      this.isSuccess = false;
      this.isLoading = false;
      return;
    }

    this.now = new Date(); // Atualiza 'now' antes de filtrar/processar os jogos

    let gamesForSelectedRound = this.allGamesData.filter(game => game.round_number === this.selectedRound);

    this.betService.getUserBetsByRound(this.selectedRound, this.userToken).subscribe({
      next: (userBetsForRound: BetRead[]) => {
        const userBetsMap = new Map<number, BetRead>();
        userBetsForRound.forEach(bet => userBetsMap.set(bet.game_id, bet));

        this.games = gamesForSelectedRound.map(game => {
          const gameCopy = { ...game };

          const userBet = userBetsMap.get(game.id);

          gameCopy.user_bet_home_score = userBet?.home_score_bet ?? null;
          gameCopy.user_bet_away_score = userBet?.away_score_bet ?? null;
          gameCopy.user_bet_id = userBet?.id;
          gameCopy.user_bet_is_correct = userBet?.is_correct;
          gameCopy.user_bet_points_awarded = userBet?.points_awarded ?? null;

          const hasStarted = game.game_datetime < this.now;
          gameCopy.has_user_bet = !!userBet;

          gameCopy.can_bet = !hasStarted && game.status === GameStatus.SCHEDULED && !gameCopy.has_user_bet;

          return gameCopy;
        }).sort((a, b) => a.game_datetime.getTime() - b.game_datetime.getTime());

        this.isLoading = false;
        if (this.games.length === 0) {
          this.message = `Nenhum jogo encontrado na Rodada ${this.selectedRound}.`;
          this.isSuccess = true;
        }
      },
      error: (err) => {
        console.error('Erro ao carregar apostas do usuário para a rodada:', err);
        this.message = 'Erro ao carregar suas apostas. Tente novamente.';
        this.isSuccess = false;
        this.isLoading = false;
      }
    });
  }

  hasGamesToBetOn(): boolean {
    return this.games.some(g => g.can_bet ?? false);
  }

  onSubmitAllBets(form: NgForm): void {
    this.message = '';
    this.isSuccess = false;

    const gamesToBetOn = this.games.filter(game => game.can_bet);

    if (gamesToBetOn.length === 0) {
        this.message = 'Não há jogos elegíveis para aposta nesta rodada ou você já apostou em todos.';
        this.isSuccess = true;
        return;
    }

    const incompleteBets = gamesToBetOn.filter(game => game.user_bet_home_score === null || game.user_bet_away_score === null);
    if (incompleteBets.length > 0) {
      console.log('Formulário inválido. Preencha todos os placares para registrar suas apostas nos jogos futuros.');
      this.message = 'Por favor, preencha todos os placares para registrar suas apostas nos jogos futuros.';
      return;
    }
    
    const token = this.authService.getAccessToken();
    if (!token) {
      this.message = 'Você precisa estar logado para registrar apostas.';
      this.isSuccess = false;
      return;
    }

    const betsToSubmit: UserBet[] = gamesToBetOn.map(game => ({
      game_id: game.id,
      home_score_bet: game.user_bet_home_score!,
      away_score_bet: game.user_bet_away_score!,
    }));

    console.log(`Apostas a serem enviadas para Rodada ${this.selectedRound}:`, betsToSubmit);

    this.betService.submitUserBets(betsToSubmit, token).subscribe({
      next: (response) => {
        this.message = 'Apostas registradas com sucesso!';
        this.isSuccess = true;
        console.log('Resposta da API ao registrar apostas:', response);
        this.onRoundChange();
      },
      error: (err) => {
        console.error('Erro de API ao registrar apostas:', err);
        this.isSuccess = false;
        let errorMessage = 'Ocorreu um erro ao registrar suas apostas. Tente novamente.';
        if (err.error && err.error.detail) {
            errorMessage = err.error.detail;
        } else if (err.message) {
            errorMessage = err.message;
        }
        this.message = errorMessage;
      }
    });
  }
}