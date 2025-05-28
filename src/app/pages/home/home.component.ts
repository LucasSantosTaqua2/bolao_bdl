// src/app/pages/home/home.component.ts
import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterLink } from '@angular/router';
import { Subscription } from 'rxjs';
import { AuthService, UserRole } from '../../services/auth.service';
import { TeamNameToFileNamePipe } from '../../utils/team-name-to-file-name.pipe'; // <--- ADICIONE ESTA LINHA

@Component({
  selector: 'app-home',
  standalone: true,
  imports: [CommonModule, RouterLink, TeamNameToFileNamePipe], // <--- ADICIONE TeamNameToFileNamePipe AQUI
  templateUrl: './home.component.html',
  styleUrls: ['./home.component.css']
})
export class HomeComponent implements OnInit, OnDestroy {
  username: string | null = null;
  isAdmin: boolean = false;
  private authSubscription: Subscription | undefined;

  // Lista de times para a parada de emblemas
  teamNamesForParade: string[] = [
    'Flamengo', 'Palmeiras', 'Atlético-MG', 'Corinthians', 'São Paulo',
    'Grêmio', 'Internacional', 'Fluminense', 'Santos', 'Botafogo',
    'Cruzeiro', 'Vasco', 'Athletico-PR', 'Bahia', 'EC Vitória'
  ];

  constructor(
    private authService: AuthService,
    private router: Router
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
  }

  ngOnDestroy(): void {
    if (this.authSubscription) {
      this.authSubscription.unsubscribe();
    }
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