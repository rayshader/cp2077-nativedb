import {effect, inject, Injectable, Signal, signal} from '@angular/core';
import {LazyLoaderService} from "./lazy-loader.service";

export type Theme = 'light-theme' | 'dark-theme';

@Injectable({
  providedIn: 'root'
})
export class ThemeService {
  private readonly lazyLoaderService: LazyLoaderService = inject(LazyLoaderService);

  private readonly currentTheme = signal<Theme>('light-theme');
  private readonly mediaQuery: MediaQueryList;

  private isLoaded: boolean = false;

  constructor() {
    this.mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    this.mediaQuery.addEventListener('change', this.onColorSchemeChanged.bind(this));
    this.currentTheme.set(this.getTheme(this.mediaQuery.matches));
    effect(() => {
      const theme: Theme = this.currentTheme();

      if (this.isLoaded || theme !== 'dark-theme') {
        return;
      }
      this.lazyLoaderService.loadStylesheet('dark-theme');
      this.isLoaded = true;
    });
  }

  public get theme(): Signal<Theme> {
    return this.currentTheme;
  }

  /**
   * Switch the theme between 'light' and 'dark'. Emit new theme value.
   */
  public toggleTheme(): void {
    const theme: Theme = this.currentTheme();

    this.currentTheme.set(theme === 'light-theme' ? 'dark-theme' : 'light-theme');
  }

  private onColorSchemeChanged(event: MediaQueryListEvent): void {
    const isDark: boolean = event.matches;
    const theme: Theme = this.getTheme(isDark);

    this.currentTheme.set(theme);
  }

  private getTheme(isDark: boolean): Theme {
    return isDark ? 'dark-theme' : 'light-theme';
  }
}
