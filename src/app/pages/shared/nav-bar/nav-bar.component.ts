// src/app/nav-bar/nav-bar.component.ts
import { Component, OnInit, OnDestroy, ViewChild, ElementRef, HostBinding } from '@angular/core'; // <--- Importe ViewChild e ElementRef
import { Router, RouterLink } from '@angular/router';
import { CommonModule } from '@angular/common';

import { BehaviorSubject, Observable, Subscription } from 'rxjs';
import { MediaMatcher } from '@angular/cdk/layout';
import { AuthService } from '../../../services/auth.service';

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
  private subscriptions: Subscription = new Subscription();

  isMobile: boolean;
  private _mobileQueryListener: () => void;

  @ViewChild('navLinksRef') navLinksElement!: ElementRef;
  isMenuOpen: boolean = false;


  mainNavLinks: NavLink[] = [];
  actionNavLinks: NavLink[] = [];


  constructor(
    private authService: AuthService,
    private router: Router,
    private mediaMatcher: MediaMatcher
  ) {
    this.isLoggedIn$ = this.authService.isLoggedIn$;
    this.currentUserUsername$ = this.authService.currentUserUsername$;

    const mobileQuery = mediaMatcher.matchMedia('(max-width: 768px)');
    this.isMobile = mobileQuery.matches;
    this._mobileQueryListener = () => {
      this.isMobile = mobileQuery.matches;
      this.updateNavLinks();
    };
    mobileQuery.addEventListener('change', this._mobileQueryListener);
  }

  ngOnInit(): void {
    this.subscriptions.add(
      this.isLoggedIn$.subscribe(loggedIn => {
        this.updateNavLinks();
      })
    );
    this.updateNavLinks();
  }

  ngOnDestroy(): void {
    this.subscriptions.unsubscribe();
    this.mediaMatcher.matchMedia('(max-width: 768px)').removeEventListener('change', this._mobileQueryListener);
  }

  private updateNavLinks(): void {
    const commonLinks: NavLink[] = [
      { path: '/home', label: 'Página Inicial', icon: 'bi-house-fill' },
      { path: '/ranking', label: 'Classificação', icon: 'bi-trophy-fill' },
      { path: '/profile', label: 'Perfil', icon: 'bi-person-fill' }
    ];

    if (this.isLoggedIn$.value) {
        this.mainNavLinks = commonLinks;
        this.actionNavLinks = [{ label: 'Sair', icon: 'bi-box-arrow-right', action: () => this.onLogout(), isLogout: true }];
    } else {
        this.mainNavLinks = []; // Sem links principais no centro do desktop quando deslogado
        this.actionNavLinks = [
            { path: '/login', label: 'Entrar', icon: 'bi-box-arrow-in-right' },
            { path: '/register', label: 'Registre-se', icon: 'bi-person-plus-fill' }
        ];
    }
  }

  toggleMenu() {
    this.isMenuOpen = !this.isMenuOpen;
    const menuIcon = document.querySelector('.menu-icon');
    menuIcon?.classList.toggle('open', this.isMenuOpen);
  }

  onLogout(): void {
    this.authService.logout();
    this.router.navigate(['/login']);
    this.isMenuOpen = false;
    const menuIcon = document.querySelector('.menu-icon');
    menuIcon?.classList.remove('open');
  }
}