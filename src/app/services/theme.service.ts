// src/app/services/theme.service.ts
import { Injectable, Renderer2, RendererFactory2 } from '@angular/core';

export type Theme = 'light' | 'dark' | 'auto';

@Injectable({
  providedIn: 'root'
})
export class ThemeService {
  private renderer: Renderer2;
  private currentTheme: Theme = 'auto'; // 'auto' pode ser o padrão
  private readonly THEME_KEY = 'app-theme';

  constructor(rendererFactory: RendererFactory2) {
    this.renderer = rendererFactory.createRenderer(null, null);
    this.loadTheme();
  }

  private loadTheme(): void {
    const storedTheme = localStorage.getItem(this.THEME_KEY) as Theme | null;
    if (storedTheme) {
      this.setTheme(storedTheme);
    } else {
      this.setTheme('auto'); // Ou 'light' como padrão inicial
    }
  }

  private applyTheme(theme: Theme): void {
    let effectiveTheme: 'light' | 'dark';

    if (theme === 'auto') {
      effectiveTheme = window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
    } else {
      effectiveTheme = theme;
    }

    if (effectiveTheme === 'dark') {
      this.renderer.setAttribute(document.documentElement, 'data-bs-theme', 'dark');
      this.renderer.addClass(document.body, 'dark-mode-active'); // Classe opcional para estilos customizados
    } else {
      this.renderer.removeAttribute(document.documentElement, 'data-bs-theme');
      this.renderer.removeClass(document.body, 'dark-mode-active');
    }
    this.currentTheme = theme; // Armazena a ESCOLHA do usuário (light, dark, ou auto)
  }

  setTheme(theme: Theme): void {
    localStorage.setItem(this.THEME_KEY, theme);
    this.applyTheme(theme);
  }

  toggleTheme(): void {
    // Lógica simples de alternância: light -> dark -> auto -> light
    if (this.currentTheme === 'light') {
      this.setTheme('dark');
    } else if (this.currentTheme === 'dark') {
      this.setTheme('auto');
    } else { // auto
      this.setTheme('light');
    }
  }

  getCurrentTheme(): Theme {
    return this.currentTheme;
  }

  // Opcional: Observar mudanças de preferência do sistema se 'auto' estiver selecionado
  watchSystemThemeChanges(): void {
    window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', e => {
      if (this.currentTheme === 'auto') {
        this.applyTheme('auto');
      }
    });
  }
}
