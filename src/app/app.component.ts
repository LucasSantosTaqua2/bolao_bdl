import { Component, OnInit } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { NavBarComponent } from './pages/shared/nav-bar/nav-bar.component';
import { ThemeService } from './services/theme.service';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [RouterOutlet, NavBarComponent],
  templateUrl: './app.component.html',
  styleUrl: './app.component.css'
})
export class AppComponent implements OnInit {
  title = 'bolao-bdl';

  constructor(private themeService: ThemeService) {} // Injete o ThemeService

  ngOnInit(): void {
    this.themeService.watchSystemThemeChanges(); // Para atualizar o tema 'auto' dinamicamente
  }
}
