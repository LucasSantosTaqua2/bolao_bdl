// src/app/pages/home/home.component.ts
import { Component, OnInit, OnDestroy, ChangeDetectorRef } from '@angular/core';
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
  providers: [TeamNameToFileNamePipe]
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
  currentRouletteDisplayTeamName: string = 'Clique em "Sortear!"'; // Mantém as aspas duplas aqui
  currentRouletteDisplayEmblem: string = 'assets/img/logo_bdl_shield.png';
  isSpinning: boolean = false;
  private spinTimeout: any;
  // --- Fim das Propriedades da Roleta ---

  // Nova propriedade getter para a classe
  public get isFinalSelection(): boolean {
    return !this.isSpinning &&
           this.currentRouletteDisplayTeamName !== 'Clique em "Sortear!"' &&
           this.currentRouletteDisplayTeamName !== 'Sorteando...';
  }

  constructor(
    private authService: AuthService,
    private router: Router,
    private teamNamePipe: TeamNameToFileNamePipe,
    private cdr: ChangeDetectorRef
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
    this.rouletteTeams = [...this.teamNamesForParade];
  }

  startRoulette(): void {
    if (this.isSpinning || this.rouletteTeams.length === 0) {
      return;
    }

    this.isSpinning = true;
    this.currentRouletteDisplayTeamName = 'Sorteando...';
    clearTimeout(this.spinTimeout);

    let spinCount = 0;
    const maxVisualSpins = 20 + Math.floor(Math.random() * 10);
    const initialDelay = 50;
    const finalDelayMultiplier = 1.5;

    const spinEffect = () => {
      spinCount++;
      const randomIndex = Math.floor(Math.random() * this.rouletteTeams.length);
      const randomTeamName = this.rouletteTeams[randomIndex];
      this.currentRouletteDisplayEmblem = `assets/emblemas/${this.teamNamePipe.transform(randomTeamName)}`;
      // Não precisamos mais forçar a detecção de mudanças para o nome aqui se ele só muda no final
      this.cdr.detectChanges(); // Para o emblema

      if (spinCount < maxVisualSpins) {
        const progress = spinCount / maxVisualSpins;
        let currentDelay = initialDelay;
        if (progress > 0.6) {
            currentDelay = initialDelay + (initialDelay * finalDelayMultiplier * ((progress - 0.6) / 0.4));
        }
        this.spinTimeout = setTimeout(spinEffect, currentDelay);
      } else {
        const finalTeamIndex = Math.floor(Math.random() * this.rouletteTeams.length);
        const finalTeamName = this.rouletteTeams[finalTeamIndex];
        this.currentRouletteDisplayEmblem = `assets/emblemas/${this.teamNamePipe.transform(finalTeamName)}`;
        this.currentRouletteDisplayTeamName = finalTeamName; // Define o nome final
        this.isSpinning = false;
        this.cdr.detectChanges(); // Para atualizar nome e emblema finais
      }
    };
    spinEffect();
  }

  ngOnDestroy(): void {
    if (this.authSubscription) {
      this.authSubscription.unsubscribe();
    }
    clearTimeout(this.spinTimeout);
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