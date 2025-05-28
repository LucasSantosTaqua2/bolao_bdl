// src/app/pages/home/home.component.ts
import { Component, OnInit, OnDestroy, AfterViewInit, Renderer2, ElementRef, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterLink } from '@angular/router';
import { Subscription } from 'rxjs';
import { AuthService, UserRole } from '../../services/auth.service';
import { TeamNameToFileNamePipe } from '../../utils/team-name-to-file-name.pipe';

interface FloatingEmblemConfig {
  teamName: string;
  initialTop: string; // Ex: '10%', 'calc(50% - 25px)'
  initialLeft: string; // Ex: '5%', 'calc(100% - 55px)'
  animationName: string;
  animationDuration: string;
  animationDelay?: string;
  size: string; // Ex: '50px'
  opacity?: number;
  zIndex?: number;
}

@Component({
  selector: 'app-home',
  standalone: true,
  imports: [CommonModule, RouterLink, TeamNameToFileNamePipe],
  templateUrl: './home.component.html',
  styleUrls: ['./home.component.css'],
  providers: [TeamNameToFileNamePipe]
})
export class HomeComponent implements OnInit, OnDestroy, AfterViewInit {
  username: string | null = null;
  isAdmin: boolean = false;
  private authSubscription: Subscription | undefined;

  teamNamesForParade: string[] = [
    'Flamengo', 'Palmeiras', 'Atlético-MG', 'Corinthians', 'São Paulo',
    'Grêmio', 'Internacional', 'Fluminense', 'Santos', 'Botafogo',
    'Cruzeiro', 'Vasco', 'Mirassol', 'Bahia', 'EC Vitória'
  ];

  // Configuração para os emblemas flutuantes/orbitais
  // As posições são relativas ao '.home-page-wrapper'
  // Ajuste 'initialTop' e 'initialLeft' para posicionar "ao redor" do .content
  // Idealmente, isso seria mais dinâmico com base nas dimensões do .content
  orbitingEmblemsConfig: FloatingEmblemConfig[] = [
    // Emblemas acima do .content (aproximado)
    { teamName: 'Internacional', initialTop: 'calc(25% - 60px)', initialLeft: '30%', animationName: 'orbitPath1', animationDuration: '20s', size: '40px', animationDelay: '0s', opacity: 0.3, zIndex: 0 },
    { teamName: 'Grêmio', initialTop: 'calc(25% - 70px)', initialLeft: '70%', animationName: 'orbitPath2', animationDuration: '22s', size: '45px', animationDelay: '2s', opacity: 0.3, zIndex: 0 },

    // Emblemas abaixo do .content (aproximado) - Ajustar 'top' conforme altura do .content
    // Essas posições 'top' para baixo precisarão de ajuste fino visual ou cálculo dinâmico.
    // Por ora, valores fixos para demonstração.
    { teamName: 'Santos', initialTop: 'calc(75% + 50px)', initialLeft: '20%', animationName: 'orbitPath3', animationDuration: '24s', size: '38px', animationDelay: '1s', opacity: 0.3, zIndex: 0 },
    { teamName: 'Mirassol', initialTop: 'calc(75% + 60px)', initialLeft: '80%', animationName: 'orbitPath4', animationDuration: '26s', size: '42px', animationDelay: '3s', opacity: 0.3, zIndex: 0 },

    // Emblemas nas laterais (aproximado)
    { teamName: 'Fluminense', initialTop: '50%', initialLeft: 'calc(15% - 50px)', animationName: 'orbitPathVertical1', animationDuration: '18s', size: '40px', animationDelay: '0.5s', opacity: 0.3, zIndex: 0 },
    { teamName: 'Botafogo', initialTop: '60%', initialLeft: 'calc(85% + 50px)', animationName: 'orbitPathVertical2', animationDuration: '20s', size: '43px', animationDelay: '1.5s', opacity: 0.3, zIndex: 0 },
  ];

  @ViewChild('orbitingEmblemsHost', { static: false }) orbitingEmblemsHostRef!: ElementRef;
  private createdOrbitingEmblems: HTMLElement[] = [];

  constructor(
    private authService: AuthService,
    private router: Router,
    private renderer: Renderer2,
    private teamNameToFileName: TeamNameToFileNamePipe
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

  ngAfterViewInit(): void {
    if (this.orbitingEmblemsHostRef) {
      this.generateOrbitingEmblems();
    }
  }

  private generateOrbitingEmblems(): void {
    if (!this.orbitingEmblemsHostRef || !this.orbitingEmblemsHostRef.nativeElement) {
      return;
    }

    this.createdOrbitingEmblems.forEach(emblem => {
        if (emblem.parentNode) {
            this.renderer.removeChild(emblem.parentNode, emblem);
        }
    });
    this.createdOrbitingEmblems = [];

    this.orbitingEmblemsConfig.forEach(config => {
      const imgElement = this.renderer.createElement('img');
      const fileName = this.teamNameToFileName.transform(config.teamName);

      this.renderer.setAttribute(imgElement, 'src', `assets/emblemas/${fileName}`);
      this.renderer.setAttribute(imgElement, 'alt', config.teamName);
      this.renderer.addClass(imgElement, 'orbiting-emblem');

      this.renderer.setStyle(imgElement, 'top', config.initialTop);
      this.renderer.setStyle(imgElement, 'left', config.initialLeft);
      this.renderer.setStyle(imgElement, 'width', config.size);
      this.renderer.setStyle(imgElement, 'height', config.size);
      this.renderer.setStyle(imgElement, 'opacity', (config.opacity || 0.3).toString());
      this.renderer.setStyle(imgElement, 'animation-name', config.animationName);
      this.renderer.setStyle(imgElement, 'animation-duration', config.animationDuration);
      this.renderer.setStyle(imgElement, 'animation-delay', config.animationDelay || '0s');
      if (config.zIndex !== undefined) {
        this.renderer.setStyle(imgElement, 'z-index', config.zIndex.toString());
      }


      this.renderer.appendChild(this.orbitingEmblemsHostRef.nativeElement, imgElement);
      this.createdOrbitingEmblems.push(imgElement);
    });
  }

  ngOnDestroy(): void {
    if (this.authSubscription) {
      this.authSubscription.unsubscribe();
    }
    this.createdOrbitingEmblems.forEach(emblem => {
      if (emblem.parentNode) {
        this.renderer.removeChild(emblem.parentNode, emblem);
      }
    });
    this.createdOrbitingEmblems = [];
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