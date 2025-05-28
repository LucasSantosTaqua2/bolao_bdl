// src/app/pages/home/home.component.ts
import { Component, OnInit, OnDestroy, ChangeDetectionStrategy, ChangeDetectorRef } from '@angular/core';
import { CommonModule, DatePipe } from '@angular/common';
import { Router, RouterLink } from '@angular/router';
import { Subscription, forkJoin, of } from 'rxjs';
import { map, catchError, take, tap, switchMap } from 'rxjs/operators';

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
  // Considere OnPush para otimizar, mas lembre-se do cdr.detectChanges()
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class HomeComponent implements OnInit, OnDestroy {
  username: string | null = null;
  isAdmin: boolean = false;
  isLoggedIn: boolean = false;
  private authSubscription: Subscription = new Subscription();

  dashboardData: DashboardData | null = null;
  isLoadingDashboard: boolean = false;
  dashboardError: string | null = null;

  private readonly BETTING_DEADLINE_MINUTES = 30;

  constructor(
    private authService: AuthService,
    private router: Router,
    private rankingService: RankingService,
    private gameService: GameService,
    private cdr: ChangeDetectorRef // Injetar ChangeDetectorRef
  ) {}

  ngOnInit(): void {
    console.log('[HomeComponent] ngOnInit');
    this.authSubscription.add(
      this.authService.isLoggedIn$.pipe(
        tap(loggedIn => console.log('[HomeComponent] isLoggedIn$ emitiu:', loggedIn)),
        switchMap(loggedIn => {
          this.isLoggedIn = loggedIn;
          this.cdr.detectChanges(); // Atualiza a UI para isLoggedIn
          if (loggedIn) {
            // Pega o username atual uma vez para evitar múltiplas chamadas a loadDashboardData
            return this.authService.currentUserUsername$.pipe(
                take(1),
                tap(username => console.log('[HomeComponent] currentUserUsername$ (take 1) emitiu:', username))
            );
          } else {
            this.username = null;
            this.dashboardData = null;
            this.isLoadingDashboard = false;
            this.dashboardError = null;
            this.cdr.detectChanges();
            return of(null); // Para o switchMap
          }
        })
      ).subscribe(usernameFromAuth => {
        console.log('[HomeComponent] Resultado da subscrição combinada isLoggedIn/currentUserUsername:', usernameFromAuth);
        if (usernameFromAuth) {
          this.username = usernameFromAuth;
          this.loadDashboardData();
        } else if (!this.isLoggedIn) { // Garante que limpe se deslogou
            this.username = null;
            this.dashboardData = null;
            this.isLoadingDashboard = false;
            this.dashboardError = null;
            this.cdr.detectChanges();
        }
      })
    );

    this.authSubscription.add(
      this.authService.currentUserRole$.subscribe(role => {
        this.isAdmin = role === UserRole.ADMIN;
        this.cdr.detectChanges();
      })
    );
  }

  loadDashboardData(): void {
    if (!this.username) {
      console.warn('[HomeComponent] loadDashboardData chamado, mas this.username é nulo. Abortando.');
      this.isLoadingDashboard = false;
      this.dashboardError = 'Não foi possível carregar o resumo: nome de usuário não disponível.';
      this.cdr.detectChanges();
      return;
    }
    console.log(`[HomeComponent] loadDashboardData - INICIANDO para usuário: ${this.username}`);
    this.isLoadingDashboard = true;
    this.dashboardError = null;
    this.dashboardData = null; // Limpar dados antigos
    this.cdr.detectChanges();

    const token = this.authService.getAccessToken();

    if (!token) {
      console.error('[HomeComponent] loadDashboardData - Token não encontrado no AuthService!');
      this.isLoadingDashboard = false;
      this.dashboardError = 'Sessão inválida. Por favor, faça login novamente.';
      this.authService.logout(); // Forçar logout se o token sumir
      this.router.navigate(['/login']);
      this.cdr.detectChanges();
      return;
    }

    console.log('[HomeComponent] loadDashboardData - Token presente. Fazendo chamadas API...');

    const userProfile$ = this.authService.getProfile().pipe(
      take(1), // Importante para evitar múltiplas execuções se o source observable emitir mais de uma vez
      tap({
        next: profile => console.log('[HomeComponent] userProfile$ - Sucesso:', profile),
        error: err => console.error('[HomeComponent] userProfile$ - ERRO:', err)
      }),
      catchError(err => { // Captura o erro aqui para que o forkJoin não falhe imediatamente
        console.error('[HomeComponent] Erro CRÍTICO ao buscar perfil:', err);
        this.dashboardError = 'Falha ao carregar dados do perfil.';
        return of(null); // Retorna um observable de null para o forkJoin continuar
      })
    );

    const ranking$ = this.rankingService.getRanking(token).pipe(
      take(1),
      tap({
        next: ranking => console.log('[HomeComponent] ranking$ - Sucesso:', ranking),
        error: err => console.error('[HomeComponent] ranking$ - ERRO:', err)
      }),
      catchError(err => {
        console.error('[HomeComponent] Erro CRÍTICO ao buscar ranking:', err);
        this.dashboardError = (this.dashboardError ? this.dashboardError + '; ' : '') + 'Falha ao carregar ranking.';
        return of(null); // Retorna um observable de null
      })
    );

    const allGamesForUser$ = this.gameService.getAllGamesForUser(token).pipe(
      take(1),
      tap({
        next: games => console.log('[HomeComponent] allGamesForUser$ - Sucesso:', games),
        error: err => console.error('[HomeComponent] allGamesForUser$ - ERRO:', err)
      }),
      catchError(err => {
        console.error('[HomeComponent] Erro CRÍTICO ao buscar jogos:', err);
        this.dashboardError = (this.dashboardError ? this.dashboardError + '; ' : '') + 'Falha ao carregar jogos.';
        return of(null); // Retorna um observable de null
      })
    );

    const dashboardSub = forkJoin([userProfile$, ranking$, allGamesForUser$]).pipe(
      map(([profile, ranking, allGames]) => {
        console.log('[HomeComponent] forkJoin - map - Dados brutos recebidos:', { profile, ranking, allGames });

        // Se alguma chamada falhou e retornou null, não podemos prosseguir com o processamento normal
        if (!profile || !ranking || !allGames) {
            console.warn('[HomeComponent] forkJoin - map - Dados incompletos, uma ou mais chamadas falharam.');
            // O dashboardError já deve ter sido setado pelos catchError individuais
            return null; // Sinaliza que o processamento completo não pôde ser feito
        }

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
        console.log('[HomeComponent] forkJoin - map - Dados processados:', { userRank, currentRoundForBetting, nextGamesForDashboard });
        return {
          userProfile: profile,
          rank: userRank > 0 ? userRank : null,
          nextGames: nextGamesForDashboard,
          currentRoundForBetting: currentRoundForBetting
        };
      })
      // Removido o catchError global do forkJoin, pois os erros são tratados individualmente agora.
      // O subscribe receberá 'null' se alguma das chamadas falhar e retornou of(null)
    ).subscribe(data => {
      console.log('[HomeComponent] forkJoin - subscribe - Dados finais para UI:', data);
      if (data) { // Se data for null, significa que uma das chamadas falhou e o erro já foi setado
        this.dashboardData = data;
      }
      // Se this.dashboardError já foi setado por um catchError individual, não sobrescreva com sucesso.
      // Apenas limpe o erro se data for válido.
      if (this.dashboardData) {
        this.dashboardError = null;
      }
      this.isLoadingDashboard = false;
      this.cdr.detectChanges(); // Fundamental para atualizar a UI
    });
    this.authSubscription.add(dashboardSub);
  }

  ngOnDestroy(): void {
    console.log('[HomeComponent] ngOnDestroy');
    if (this.authSubscription) {
      this.authSubscription.unsubscribe();
    }
  }

  trackByGameId(index: number, game: GameRead): number {
    return game.id;
  }

  goToApostar(roundNumber?: number | null): void {
    if (this.authService.getAccessToken()) {
      if (roundNumber) {
        this.router.navigate(['/apostar'], { queryParams: { rodada: roundNumber } });
      } else {
        this.router.navigate(['/apostar']);
      }
    } else {
      this.router.navigate(['/login']);
    }
  }

  goToAdminPanel(): void {
    if (this.isAdmin) {
      this.router.navigate(['/admin']);
    }
  }
}