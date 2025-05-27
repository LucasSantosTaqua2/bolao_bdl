// src/app/pages/home/home.component.ts
import { Component, OnInit, OnDestroy, ChangeDetectionStrategy } from '@angular/core'; // Adicionado ChangeDetectionStrategy
import { CommonModule, DatePipe } from '@angular/common';
import { Router, RouterLink } from '@angular/router';
import { Subscription, forkJoin, of } from 'rxjs';
import { switchMap, map, catchError, take } from 'rxjs/operators'; // Adicionado take

import { AuthService, UserRole } from '../../services/auth.service';
import { RankingService } from '../../services/ranking.service';
import { GameService } from '../../services/game.service';
import { UserProfile } from '../../models/user.model';
import { GameRead, GameStatus } from '../../models/game.model';
import { TeamNameToFileNamePipe } from '../../utils/team-name-to-file-name.pipe';

interface DashboardData {
  userProfile: UserProfile | null;
  rank: number | null;
  nextGames: GameRead[];
  currentRoundForBetting: number | null;
}

@Component({
  selector: 'app-home',
  standalone: true,
  imports: [CommonModule, RouterLink, DatePipe, TeamNameToFileNamePipe],
  templateUrl: './home.component.html',
  styleUrls: ['./home.component.css'],
  changeDetection: ChangeDetectionStrategy.OnPush // Opcional: Pode melhorar performance
})
export class HomeComponent implements OnInit, OnDestroy {
  username: string | null = null; //
  isAdmin: boolean = false; //
  isLoggedIn: boolean = false;
  private authSubscription: Subscription = new Subscription();

  dashboardData: DashboardData | null = null;
  isLoadingDashboard: boolean = false;
  dashboardError: string | null = null;

  private readonly BETTING_DEADLINE_MINUTES = 30;

  constructor(
    private authService: AuthService, //
    private router: Router, //
    private rankingService: RankingService, //
    private gameService: GameService //
  ) {}

  ngOnInit(): void {
    this.authSubscription.add(
      this.authService.isLoggedIn$.subscribe(loggedIn => {
        this.isLoggedIn = loggedIn;
        if (loggedIn) {
          // Apenas carrega dados do dashboard se o username já estiver disponível
          // Isso evita uma condição de corrida se isLoggedIn$ emitir antes de currentUserUsername$
          this.authService.currentUserUsername$.pipe(take(1)).subscribe(username => {
            if (username) {
              this.username = username;
              this.loadDashboardData();
            }
          });
        } else {
          this.username = null;
          this.dashboardData = null;
          this.isLoadingDashboard = false; // Garante que o loading não fique preso
        }
      })
    );

    this.authSubscription.add(
      this.authService.currentUserRole$.subscribe(role => { //
        this.isAdmin = role === UserRole.ADMIN; //
      })
    );
  }

  loadDashboardData(): void {
    if (!this.username) return; // Guarda adicional

    this.isLoadingDashboard = true;
    this.dashboardError = null;
    const token = this.authService.getAccessToken(); //

    if (!token) { // Não deve acontecer se isLoggedIn é true, mas é uma boa checagem
      this.isLoadingDashboard = false;
      this.dashboardError = 'Token de autenticação não encontrado.';
      return;
    }

    // Usar take(1) para garantir que as chamadas HTTP não sejam refeitas se os observables base emitirem novamente
    const userProfile$ = this.authService.getProfile().pipe(take(1)); //
    const ranking$ = this.rankingService.getRanking(token).pipe(take(1)); //
    const allGamesForUser$ = this.gameService.getAllGamesForUser(token).pipe(take(1)); //

    // Adicionar a subscrição do forkJoin ao this.authSubscription principal
    // para garantir que seja cancelada no ngOnDestroy
    const dashboardSub = forkJoin([userProfile$, ranking$, allGamesForUser$]).pipe(
      map(([profile, ranking, allGames]) => {
        const userRank = ranking.findIndex(r => r.username === this.username) + 1;
        const now = new Date();
        let currentRoundForBetting: number | null = null;
        let nextGamesForDashboard: GameRead[] = [];

        const roundsWithSchedOrFutureGames = [...new Set(allGames
          .filter(game => game.status === GameStatus.SCHEDULED && new Date(game.game_datetime) > now)
          .map(game => game.round_number))]
          .sort((a, b) => a - b);

        if (roundsWithSchedOrFutureGames.length > 0) {
          currentRoundForBetting = roundsWithSchedOrFutureGames[0];
          const gamesOfThisRound = allGames.filter(game => game.round_number === currentRoundForBetting);
          
          const firstGameOfRound = gamesOfThisRound
            .filter(game => game.status === GameStatus.SCHEDULED && new Date(game.game_datetime) >= now)
            .sort((a, b) => new Date(a.game_datetime).getTime() - new Date(b.game_datetime).getTime())[0];
          
          let bettingBlockedForThisRound = false;
          if (firstGameOfRound) {
            const bettingDeadline = new Date(new Date(firstGameOfRound.game_datetime).getTime() - (this.BETTING_DEADLINE_MINUTES * 60 * 1000));
            if (now.getTime() >= bettingDeadline.getTime()) {
              bettingBlockedForThisRound = true;
            }
          } else { 
            bettingBlockedForThisRound = true;
          }

          if (!bettingBlockedForThisRound) {
             nextGamesForDashboard = gamesOfThisRound
              .filter(game => game.status === GameStatus.SCHEDULED && new Date(game.game_datetime) > now)
              .sort((a, b) => new Date(a.game_datetime).getTime() - new Date(b.game_datetime).getTime())
              .slice(0, 5); 
          } else {
              if (roundsWithSchedOrFutureGames.length > 1) {
                  currentRoundForBetting = roundsWithSchedOrFutureGames[1];
                   nextGamesForDashboard = allGames
                      .filter(game => game.round_number === currentRoundForBetting && game.status === GameStatus.SCHEDULED && new Date(game.game_datetime) > now)
                      .sort((a, b) => new Date(a.game_datetime).getTime() - new Date(b.game_datetime).getTime())
                      .slice(0, 5);
              } else {
                  currentRoundForBetting = null; 
              }
          }
        }

        // Retornar os dados para o próximo passo do pipe (subscribe)
        return {
          userProfile: profile,
          rank: userRank > 0 ? userRank : null,
          nextGames: nextGamesForDashboard,
          currentRoundForBetting: currentRoundForBetting
        };
      }),
      catchError(error => {
        console.error('Erro ao carregar dados do dashboard:', error);
        this.dashboardError = 'Não foi possível carregar as informações do dashboard. Tente recarregar a página.';
        this.isLoadingDashboard = false; // Certificar que o loading para em caso de erro
        return of(null); // Retornar um observable que emite null para o subscribe
      })
    ).subscribe(data => {
      if (data) { // Apenas atualiza se os dados não forem nulos (do catchError)
        this.dashboardData = data;
      }
      this.isLoadingDashboard = false; // Finaliza o loading aqui
      // Se estiver usando OnPush, pode ser necessário marcar para verificação
      // import { ChangeDetectorRef } from '@angular/core';
      // constructor(..., private cdr: ChangeDetectorRef) {}
      // this.cdr.detectChanges();
    });
    this.authSubscription.add(dashboardSub);
  }

  ngOnDestroy(): void {
    if (this.authSubscription) { //
      this.authSubscription.unsubscribe(); //
    }
  }

  // Método para usar com trackBy no *ngFor da lista de jogos
  trackByGameId(index: number, game: GameRead): number {
    return game.id; //
  }

  goToApostar(roundNumber?: number | null): void { //
    if (this.authService.getAccessToken()) { //
      if (roundNumber) {
        this.router.navigate(['/apostar'], { queryParams: { rodada: roundNumber } });
      } else {
        this.router.navigate(['/apostar']); //
      }
    } else {
      this.router.navigate(['/login']); //
    }
  }

  goToAdminPanel(): void { //
    if (this.isAdmin) { //
      this.router.navigate(['/admin']); //
    }
  }
}