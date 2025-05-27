// src/app/pages/home/home.component.ts
import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule, DatePipe } from '@angular/common';
import { Router, RouterLink } from '@angular/router';
import { Subscription, forkJoin, of } from 'rxjs';
import { switchMap, map, catchError } from 'rxjs/operators';

import { AuthService, UserRole } from '../../services/auth.service';
import { RankingService } from '../../services/ranking.service';
import { GameService } from '../../services/game.service';
import { UserProfile } from '../../models/user.model';
import { GameRead, GameStatus } from '../../models/game.model';

// Importe o seu pipe recém-criado (ajuste o caminho se necessário)
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
  imports: [
    CommonModule,
    RouterLink,
    DatePipe,
    TeamNameToFileNamePipe // Adicione o pipe aqui para que ele esteja disponível no template
  ],
  templateUrl: './home.component.html',
  styleUrls: ['./home.component.css'] //
})
export class HomeComponent implements OnInit, OnDestroy {
  username: string | null = null; //
  isAdmin: boolean = false; //
  isLoggedIn: boolean = false;
  private authSubscription: Subscription = new Subscription(); //

  dashboardData: DashboardData | null = null;
  isLoadingDashboard: boolean = false;
  dashboardError: string | null = null;

  private readonly BETTING_DEADLINE_MINUTES = 30;

  constructor(
    private authService: AuthService, //
    private router: Router, //
    private rankingService: RankingService,
    private gameService: GameService
  ) { }

  ngOnInit(): void {
    this.authSubscription.add(
      this.authService.isLoggedIn$.subscribe(loggedIn => {
        this.isLoggedIn = loggedIn;
        if (loggedIn) {
          this.loadDashboardData();
        } else {
          this.dashboardData = null;
        }
      })
    );

    this.authSubscription.add(
      this.authService.currentUserUsername$.subscribe(username => { //
        this.username = username; //
      })
    );

    this.authSubscription.add(
      this.authService.currentUserRole$.subscribe(role => { //
        this.isAdmin = role === UserRole.ADMIN; //
      })
    );
  }

  loadDashboardData(): void {
    this.isLoadingDashboard = true;
    this.dashboardError = null;
    const token = this.authService.getAccessToken(); //

    if (!token || !this.username) {
      this.isLoadingDashboard = false;
      this.dashboardError = 'Usuário não autenticado ou nome de usuário não disponível.';
      return;
    }

    const userProfile$ = this.authService.getProfile(); //
    const ranking$ = this.rankingService.getRanking(token); //
    const allGamesForUser$ = this.gameService.getAllGamesForUser(token); //

    this.authSubscription.add(
      forkJoin([userProfile$, ranking$, allGamesForUser$]).pipe(
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

          this.dashboardData = {
            userProfile: profile,
            rank: userRank > 0 ? userRank : null,
            nextGames: nextGamesForDashboard,
            currentRoundForBetting: currentRoundForBetting
          };
          this.isLoadingDashboard = false;
        }),
        catchError(error => {
          console.error('Erro ao carregar dados do dashboard:', error);
          this.dashboardError = 'Não foi possível carregar as informações do dashboard. Tente recarregar a página.';
          this.isLoadingDashboard = false;
          return of(null);
        })
      ).subscribe()
    );
  }

  ngOnDestroy(): void {
    if (this.authSubscription) { //
      this.authSubscription.unsubscribe(); //
    }
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

  hasPendingBetsForDashboardRound(): boolean {
    if (!this.dashboardData || !this.dashboardData.nextGames || this.dashboardData.nextGames.length === 0) {
      return false;
    }
    return true;
  }
}