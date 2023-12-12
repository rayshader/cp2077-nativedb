import {Injectable} from '@angular/core';
import {BehaviorSubject, Observable} from 'rxjs';
import {LazyLoaderService} from "./lazy-loader.service";
import {takeUntilDestroyed} from "@angular/core/rxjs-interop";

export type Theme = 'light-theme' | 'dark-theme';

@Injectable({
  providedIn: 'root'
})
export class ThemeService {
  private theme: BehaviorSubject<Theme> = new BehaviorSubject<Theme>('light-theme');
  private currentTheme: Theme = 'light-theme';
  private isLoaded: boolean = false;

  private readonly mediaQuery: MediaQueryList;

  constructor(private readonly lazyLoaderService: LazyLoaderService) {
    this.mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    this.mediaQuery.addEventListener('change', this.onColorSchemeChanged.bind(this));
    this.currentTheme = this.getTheme(this.mediaQuery.matches);
    this.theme.next(this.currentTheme);
    this.onThemeChanged.pipe(takeUntilDestroyed()).subscribe(this.load.bind(this));
  }

  public get onThemeChanged(): Observable<Theme> {
    return this.theme.asObservable();
  }

  /**
   * Switch theme between 'light' and 'dark'. Emit new theme value.
   */
  public toggleTheme(): void {
    this.currentTheme = (this.currentTheme === 'light-theme') ? 'dark-theme' : 'light-theme';
    this.theme.next(this.currentTheme);
  }

  private onColorSchemeChanged(event: MediaQueryListEvent): void {
    const isDark: boolean = event.matches;
    const theme: Theme = this.getTheme(isDark);

    this.currentTheme = theme;
    this.theme.next(theme);
  }

  private load(theme: Theme): void {
    if (this.isLoaded || theme !== 'dark-theme') {
      return;
    }
    this.lazyLoaderService.loadStylesheet('dark-theme');
    this.isLoaded = true;
  }

  private getTheme(isDark: boolean): Theme {
    if (isDark) {
      return 'dark-theme';
    }
    return 'light-theme';
  }
}
