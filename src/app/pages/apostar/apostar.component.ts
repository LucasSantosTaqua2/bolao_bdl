// src/app/apostar/apostar.component.ts
import { CommonModule, DatePipe } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { FormsModule, NgForm } from '@angular/forms';
import { GameService } from '../../services/game.service';
import { BetService, UserBet } from '../../services/bet.service';
import { GameRead, GameStatus } from '../../models/game.model';
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

  public now: Date = new Date();
  public GameStatus = GameStatus;

  public bettingBlockedForRound: boolean = false;
  private readonly BETTING_DEADLINE_MINUTES = 30;

  constructor(
    private gameService: GameService,
    private betService: BetService,
    private authService: AuthService
  ) { }

  ngOnInit(): void {
    console.log('ApostarComponent: ngOnInit - Iniciando...');
    this.userToken = this.authService.getAccessToken();
    if (!this.userToken) {
      this.message = 'Você precisa estar logado para ver os jogos e fazer apostas.';
      this.isSuccess = false;
      this.isLoading = false;
      console.log('ApostarComponent: Token não encontrado, usuário não logado.');
      return;
    }
    this.loadAllGamesAndRounds();
  }

  loadAllGamesAndRounds(): void {
    this.isLoading = true;
    this.message = '';
    this.isSuccess = false;
    console.log('ApostarComponent: loadAllGamesAndRounds - Carregando todos os jogos para usuário.');

    if (!this.userToken) {
      this.message = 'Token de usuário não disponível. Por favor, faça login novamente.';
      this.isSuccess = false;
      this.isLoading = false;
      console.log('ApostarComponent: Token nulo na chamada de loadAllGamesAndRounds.');
      return;
    }

    this.gameService.getAllGamesForUser(this.userToken).subscribe({
      next: (gamesFromApi) => {
        this.allGamesData = gamesFromApi;
        console.log('ApostarComponent: allGamesData populado (todos os jogos da API):', this.allGamesData);

        this.availableRounds = [...new Set(this.allGamesData
          .map(game => game.round_number)
        )].sort((a, b) => a - b);
        console.log('ApostarComponent: Rodadas disponíveis (availableRounds):', this.availableRounds);


        if (this.availableRounds.length > 0) {
          this.selectedRound = this.availableRounds[0];
          console.log('ApostarComponent: Rodada inicial selecionada (default):', this.selectedRound);
          this.onRoundChange();
        } else {
          this.games = [];
          this.message = 'Nenhuma rodada com jogos encontrada no banco de dados.';
          this.isSuccess = true;
          this.isLoading = false;
          console.log('ApostarComponent: Nenhuma rodada encontrada.');
        }
      },
      error: (err) => {
        console.error('ApostarComponent: Erro ao carregar todos os jogos e rodadas:', err);
        this.message = 'Erro ao carregar jogos e rodadas. Tente novamente mais tarde.';
        this.isSuccess = false;
        this.isLoading = false;
      }
    });
  }

  onRoundChange(): void {
    console.log(`ApostarComponent: onRoundChange - INÍCIO.`);
    console.log('ApostarComponent: Valor de this.selectedRound no início:', this.selectedRound);
    console.log('ApostarComponent: Tipo de this.selectedRound no início:', typeof this.selectedRound);

    this.message = ''; // Limpa a mensagem anterior
    this.isSuccess = false; // Reseta o estado da mensagem
    this.isLoading = true; // Define o loading como true
    this.bettingBlockedForRound = false; // Reseta o bloqueio da rodada


    if (!this.userToken) {
      this.message = 'Token de usuário não disponível. Por favor, faça login novamente.';
      this.isSuccess = false;
      this.isLoading = false;
      console.log('ApostarComponent: Token nulo na chamada de onRoundChange.');
      return;
    }

    this.now = new Date(); // Atualiza 'now'
    console.log('ApostarComponent: this.now (hora atual do navegador):', this.now);

    let gamesForSelectedRound = this.allGamesData.filter(game => {
      return game.round_number === this.selectedRound;
    });
    
    console.log(`ApostarComponent: gamesForSelectedRound APÓS filtro por rodada ${this.selectedRound}:`, gamesForSelectedRound);
    console.log('ApostarComponent: Tamanho de gamesForSelectedRound:', gamesForSelectedRound.length);

    // Se não houver jogos para esta rodada (depois do filtro inicial), define a mensagem e sai
    if (gamesForSelectedRound.length === 0) {
        this.games = []; // Garante que a tabela esteja vazia
        this.message = `Nenhum jogo encontrado na Rodada ${this.selectedRound}.`;
        this.isSuccess = true;
        this.isLoading = false;
        console.log('ApostarComponent: Nenhum jogo encontrado após filtro inicial.');
        return;
    }

    // Lógica de Bloqueio de Apostas
    const firstScheduledGame = gamesForSelectedRound
        .filter(game => game.status === GameStatus.SCHEDULED && game.game_datetime >= this.now) // Apenas jogos agendados E futuros
        .sort((a, b) => a.game_datetime.getTime() - b.game_datetime.getTime())[0];

    // Variáveis para controlar a mensagem final
    let determinedMessage = '';
    let determinedIsSuccess = false;
    let blockingReasonFound = false;

    if (firstScheduledGame) {
        console.log('ApostarComponent: Primeiro jogo agendado da rodada (firstScheduledGame):', firstScheduledGame);
        console.log('ApostarComponent: game_datetime do primeiro jogo:', firstScheduledGame.game_datetime);
        console.log('ApostarComponent: Tipo de game_datetime:', typeof firstScheduledGame.game_datetime);
        
        const bettingDeadline = new Date(firstScheduledGame.game_datetime.getTime() - (this.BETTING_DEADLINE_MINUTES * 60 * 1000));
        console.log(`ApostarComponent: Prazo limite para apostas (${this.BETTING_DEADLINE_MINUTES}min antes):`, bettingDeadline);

        const deadlinePassed = this.now.getTime() >= bettingDeadline.getTime();
        console.log(`ApostarComponent: this.now.getTime() >= bettingDeadline.getTime() --> ${this.now.getTime()} >= ${bettingDeadline.getTime()} = ${deadlinePassed}`);


        if (deadlinePassed) {
            this.bettingBlockedForRound = true;
            determinedMessage = `Apostas encerradas para a Rodada ${this.selectedRound}. O prazo limite de ${this.BETTING_DEADLINE_MINUTES} minutos antes do início do primeiro jogo já passou.`;
            determinedIsSuccess = false; // Cor vermelha para "encerradas"
            blockingReasonFound = true;
            console.log('ApostarComponent: Apostas bloqueadas para a rodada: PRAZO EXPIRADO.');
        }
    } else { // Não há jogos agendados/futuros nesta rodada
        const allGamesFinished = gamesForSelectedRound.every(game => game.status === GameStatus.FINISHED || game.status === GameStatus.COMPLETED);
        if (gamesForSelectedRound.length > 0 && allGamesFinished) {
            this.bettingBlockedForRound = true;
            determinedMessage = `Todos os jogos da Rodada ${this.selectedRound} já foram encerrados.`;
            determinedIsSuccess = true; // Cor verde para "encerrados"
            blockingReasonFound = true;
            console.log('ApostarComponent: Todos os jogos da rodada terminaram (sem jogos futuros).');
        } else if (gamesForSelectedRound.length > 0) { // Existe jogos, mas nenhum agendado/futuro E nem todos terminados (ex: adiados/cancelados/em andamento)
            this.bettingBlockedForRound = true;
            determinedMessage = `Apostas não disponíveis para a Rodada ${this.selectedRound} (jogos não agendados ou passados).`;
            determinedIsSuccess = false; // Cor vermelha para "não disponíveis"
            blockingReasonFound = true;
            console.log('ApostarComponent: Apostas não disponíveis (status ambíguo).');
        }
    }

    this.betService.getUserBetsByRound(this.selectedRound, this.userToken).subscribe({
      next: (userBetsForRound: BetRead[]) => {
        console.log('ApostarComponent: Apostas do usuário para a rodada recebidas:', userBetsForRound);

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

          gameCopy.can_bet = !this.bettingBlockedForRound && !hasStarted && game.status === GameStatus.SCHEDULED && !gameCopy.has_user_bet;

          return gameCopy;
        }).sort((a, b) => a.game_datetime.getTime() - b.game_datetime.getTime());
        
        console.log('ApostarComponent: Jogos processados (games para exibição final):', this.games);
        console.log('ApostarComponent: Tamanho de games para exibição final:', this.games.length);


        this.isLoading = false;

        // <<< MUDANÇA: Lógica de mensagem final consolidada >>>
        if (!blockingReasonFound) { // Se não houve um motivo de bloqueio explícito até agora
            const gamesStillEligibleToBet = this.games.filter(g => g.can_bet);
            if (gamesStillEligibleToBet.length === 0 && this.games.length > 0) { // Se não tem jogos para apostar, mas tem jogos na rodada (todos já apostados)
                determinedMessage = `Você já apostou em todos os jogos elegíveis da Rodada ${this.selectedRound}.`;
                determinedIsSuccess = true;
                console.log('ApostarComponent: Todos os jogos elegíveis já apostados.');
            } else if (gamesStillEligibleToBet.length > 0) { // Se há jogos para apostar e não foi bloqueado por prazo
                determinedMessage = 'Preencha os placares dos jogos abertos e clique em "Registrar Todas as Apostas".';
                determinedIsSuccess = true;
                console.log('ApostarComponent: Rodada aberta para apostas.');
            } else { // Caso fallback: não tem jogos para apostar (nem foi bloqueado por prazo) e talvez não tenha jogos na rodada (já coberto no início)
                determinedMessage = `Nenhum jogo agendado para apostar na Rodada ${this.selectedRound}.`;
                determinedIsSuccess = true;
                console.log('ApostarComponent: Mensagem padrão: Nenhum jogo agendado para apostar.');
            }
        }
        
        // Atribui a mensagem final e o status de sucesso
        this.message = determinedMessage;
        this.isSuccess = determinedIsSuccess;
        console.log('ApostarComponent: Estado final de isLoading e message:', this.isLoading, this.message);
      },
      error: (err) => {
        console.error('ApostarComponent: Erro ao carregar apostas do usuário para a rodada:', err);
        this.message = 'Erro ao carregar suas apostas. Tente novamente.';
        this.isSuccess = false;
        this.isLoading = false;
      }
    });
  }

  hasGamesToBetOn(): boolean {
    return this.games.some(g => g.can_bet ?? false) && !this.bettingBlockedForRound;
  }

  onSubmitAllBets(form: NgForm): void {
    this.message = '';
    this.isSuccess = false;

    if (this.bettingBlockedForRound) {
        this.message = `Apostas encerradas para a Rodada ${this.selectedRound}. Não é possível registrar apostas.`;
        this.isSuccess = false;
        return;
    }

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