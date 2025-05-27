// src/app/nav-bar/nav-bar.component.ts
import { Component, OnInit, OnDestroy, ViewChild, ElementRef, HostBinding } from '@angular/core'; // <--- Importe ViewChild e ElementRef
import { Router, RouterLink } from '@angular/router';
import { CommonModule } from '@angular/common';

import { BehaviorSubject, Observable, Subscription } from 'rxjs';
import { MediaMatcher } from '@angular/cdk/layout';
import { AuthService } from '../../../services/auth.service';
import { ThemeService, Theme } from '../../../../services/theme.service';

interface NavLink {
  path?: string;
  label: string;
  icon: string;
  action?: () => void;
  isLogout?: boolean;
}

@Component({
  selector: 'app-nav-bar',
  standalone: true,
  imports: [RouterLink, CommonModule],
  templateUrl: './nav-bar.component.html',
  styleUrl: './nav-bar.component.css'
})
export class NavBarComponent implements OnInit, OnDestroy {
  isLoggedIn$: BehaviorSubject<boolean>;
  currentUserUsername$: BehaviorSubject<string | null>;
  isAdmin$: BehaviorSubject<boolean>; // Para o link do Admin Panel
  private subscriptions: Subscription = new Subscription();

  isMobile: boolean;
  private _mobileQueryListener: () => void;

  @ViewChild('navLinksMobileRef') navLinksMobileElement!: ElementRef;
  isMenuOpen: boolean = false;

  // currentTheme: Theme = 'auto'; // Removido, usaremos o getter do serviço no template

  constructor(
    private authService: AuthService,
    private router: Router,
    private mediaMatcher: MediaMatcher,
    public themeService: ThemeService // Injetado e público para uso no template
  ) {
    this.isLoggedIn$ = this.authService.isLoggedIn$;
    this.currentUserUsername$ = this.authService.currentUserUsername$;
    this.isAdmin$ = new BehaviorSubject<boolean>(false); // Inicializa

    const mobileQuery = mediaMatcher.matchMedia('(max-width: 768px)');
    this.isMobile = mobileQuery.matches;
    this._mobileQueryListener = () => {
      const oldIsMobile = this.isMobile;
      this.isMobile = mobileQuery.matches;
      if (oldIsMobile !== this.isMobile && !this.isMobile && this.isMenuOpen) {
        this.isMenuOpen = false; // Fecha o menu se redimensionar para desktop
      }
    };
    // Usar addListener e removeListener para compatibilidade ou o novo addEventListener
    try {
      mobileQuery.addEventListener('change', this._mobileQueryListener);
    } catch (e) {
      mobileQuery.addListener(this._mobileQueryListener); // Fallback para navegadores mais antigos
    }
  }

  ngOnInit(): void {
    this.subscriptions.add(
      this.isLoggedIn$.subscribe(loggedIn => {
        if (!loggedIn && this.isMenuOpen && this.isMobile) {
          this.isMenuOpen = false;
        }
      })
    );
    this.subscriptions.add(
      this.authService.currentUserRole$.subscribe(role => {
        this.isAdmin$.next(role === UserRole.ADMIN);
      })
    );
  }

  ngOnDestroy(): void {
    this.subscriptions.unsubscribe();
    try {
      this.mediaMatcher.matchMedia('(max-width: 768px)').removeEventListener('change', this._mobileQueryListener);
    } catch (e) {
      this.mediaMatcher.matchMedia('(max-width: 768px)').removeListener(this._mobileQueryListener); // Fallback
    }
  }

  toggleMenu(): void {
    this.isMenuOpen = !this.isMenuOpen;
  }

  onLogout(): void {
    this.authService.logout();
    this.router.navigate(['/login']);
    if (this.isMenuOpen) { // Fecha o menu independentemente de ser mobile ou não
        this.isMenuOpen = false;
    }
  }

  toggleAppTheme(): void {
    this.themeService.toggleTheme();
    // O ícone no HTML já reage ao this.themeService.getEffectiveTheme()
    if (this.isMobile && this.isMenuOpen) {
      this.toggleMenu(); // Fecha o menu mobile ao trocar o tema
    }
  }
}
