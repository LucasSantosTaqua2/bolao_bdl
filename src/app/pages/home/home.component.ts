// src/app/pages/home/home.component.ts
import { Component, OnInit, OnDestroy, ChangeDetectorRef } from '@angular/core'; // Adicionado ChangeDetectorRef
import { CommonModule } from '@angular/common';
import { Router, RouterLink } from '@angular/router';
import { Subscription } from 'rxjs';
import { AuthService, UserRole } from '../../services/auth.service';
import { TeamNameToFileNamePipe } from '../../utils/team-name-to-file-name.pipe';

@Component({
  selector: 'app-home',
  standalone: true,
  imports: [CommonModule, RouterLink, TeamNameToFileNamePipe],
  templateUrl: './home.component.html',
  styleUrls: ['./home.component.css'],
  providers: [TeamNameToFileNamePipe] // Adicionar o pipe aos providers para injeção
})
export class HomeComponent implements OnInit, OnDestroy {
  username: string | null = null;
  isAdmin: boolean = false;
  private authSubscription: Subscription | undefined;

  teamNamesForParade: string[] = [
    'Flamengo', 'Palmeiras', 'Atlético-MG', 'Corinthians', 'São Paulo',
    'Grêmio', 'Internacional', 'Fluminense', 'Santos', 'Botafogo',
    'Cruzeiro', 'Vasco', 'Mirassol', 'Bahia', 'EC Vitória'
  ];

  // --- Propriedades da Roleta de Times ---
  rouletteTeams: string[] = [];
  currentRouletteDisplayTeamName: string = 'Clique em "Sortear"!';
  currentRouletteDisplayEmblem: string = 'assets/img/logo_bdl_shield.png'; // Um escudo genérico ou logo
  isSpinning: boolean = false;
  private spinTimeout: any;
  // --- Fim das Propriedades da Roleta ---

  constructor(
    private authService: AuthService,
    private router: Router,
    private teamNamePipe: TeamNameToFileNamePipe, // Injetar o pipe
    private cdr: ChangeDetectorRef // Injetar ChangeDetectorRef
  ) { }

  ngOnInit(): void {
    this.authSubscription = this.authService.currentUserUsername$.subscribe(username => {
      this.username = username;
    });

    this.authSubscription.add(
      this.authService.currentUserRole$.subscribe(role => {
        this.isAdmin = role === UserRole.ADMIN;
      })
    );

    // Inicializar times para a roleta
    this.rouletteTeams = [...this.teamNamesForParade];
    // Definir um emblema inicial visível se logo_bdl_shield.png não existir
    if (this.rouletteTeams.length > 0 && this.currentRouletteDisplayEmblem === 'assets/img/logo_bdl_shield.png') {
        // Opcional: usar o primeiro time da lista como placeholder se logo_bdl_shield não for ideal
        // this.currentRouletteDisplayEmblem = `assets/emblemas/${this.teamNamePipe.transform(this.rouletteTeams[0])}`;
    }
  }

  // --- Métodos da Roleta de Times ---
  startRoulette(): void {
    if (this.isSpinning || this.rouletteTeams.length === 0) {
      return;
    }

    this.isSpinning = true;
    this.currentRouletteDisplayTeamName = 'Sorteando...';
    clearTimeout(this.spinTimeout); // Limpar timeout anterior, se houver

    let spinCount = 0;
    const maxVisualSpins = 20 + Math.floor(Math.random() * 10); // Total de mudanças visuais, com alguma variação
    const initialDelay = 50; // ms - velocidade inicial
    const finalDelayMultiplier = 1.5; // Multiplicador para desacelerar

    const spinEffect = () => {
      spinCount++;
      const randomIndex = Math.floor(Math.random() * this.rouletteTeams.length);
      const randomTeamName = this.rouletteTeams[randomIndex];
      this.currentRouletteDisplayEmblem = `assets/emblemas/${this.teamNamePipe.transform(randomTeamName)}`;
      this.cdr.detectChanges(); // Forçar detecção de mudanças para atualizar a UI rapidamente

      if (spinCount < maxVisualSpins) {
        // Calcula o delay para o próximo passo, aumentando progressivamente
        const progress = spinCount / maxVisualSpins;
        let currentDelay = initialDelay;
        if (progress > 0.6) { // Começa a desacelerar após 60% dos spins
            currentDelay = initialDelay + (initialDelay * finalDelayMultiplier * ((progress - 0.6) / 0.4));
        }
        this.spinTimeout = setTimeout(spinEffect, currentDelay);
      } else {
        // Sorteio final
        const finalTeamIndex = Math.floor(Math.random() * this.rouletteTeams.length);
        const finalTeamName = this.rouletteTeams[finalTeamIndex];
        this.currentRouletteDisplayEmblem = `assets/emblemas/${this.teamNamePipe.transform(finalTeamName)}`;
        this.currentRouletteDisplayTeamName = finalTeamName;
        this.isSpinning = false;
        this.cdr.detectChanges();
      }
    };

    spinEffect(); // Inicia o primeiro "giro"
  }
  // --- Fim dos Métodos da Roleta ---

  ngOnDestroy(): void {
    if (this.authSubscription) {
      this.authSubscription.unsubscribe();
    }
    clearTimeout(this.spinTimeout); // Limpar timeout ao destruir componente
  }

  goToApostar(): void {
    if (this.authService.getAccessToken()) {
      this.router.navigate(['/apostar']);
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