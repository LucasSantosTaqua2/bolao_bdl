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

  @ViewChild('navLinksMobileRef') navLinksMobileElement!: ElementRef; // Updated ViewChild name if needed, though not directly manipulated in this version
  isMenuOpen: boolean = false;

  // mainNavLinks: NavLink[] = []; // Unused by the current HTML logic
  // actionNavLinks: NavLink[] = []; // Unused by the current HTML logic

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
      // this.updateNavLinks(); // This call isn't strictly necessary if HTML drives link visibility
      if (!this.isMobile && this.isMenuOpen) { // Close mobile menu if resizing to desktop
        this.isMenuOpen = false;
      }
    };
    mobileQuery.addEventListener('change', this._mobileQueryListener);
  }

  ngOnInit(): void {
    this.subscriptions.add(
      this.isLoggedIn$.subscribe(loggedIn => {
        // this.updateNavLinks(); // This call isn't strictly necessary
        if (!loggedIn && this.isMenuOpen && this.isMobile) { // If user logs out while mobile menu is open
            this.isMenuOpen = false; // Close it
        }
      })
    );
    // this.updateNavLinks(); // Initial call isn't strictly necessary
  }

  ngOnDestroy(): void {
    this.subscriptions.unsubscribe();
    // Ensure to use the same query object for removing the listener
    this.mediaMatcher.matchMedia('(max-width: 768px)').removeEventListener('change', this._mobileQueryListener);
  }

  // private updateNavLinks(): void { ... } // This method is not used by the HTML for rendering links.

  toggleMenu() {
    this.isMenuOpen = !this.isMenuOpen;
    // The .open class on .menu-icon is now handled by [class.open]="isMenuOpen" in the HTML.
  }

  onLogout(): void {
    this.authService.logout();
    this.router.navigate(['/login']);
    if (this.isMobile) { // Only explicitly manage menu for mobile context
        this.isMenuOpen = false;
    }
    // The .open class on .menu-icon will update automatically due to isMenuOpen change.
  }
}