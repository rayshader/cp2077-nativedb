import {Injectable} from '@angular/core';
import {BehaviorSubject, Observable} from 'rxjs';
import {LazyLoaderService} from "./lazy-loader.service";

export type Theme = 'light-theme' | 'dark-theme';

@Injectable({
  providedIn: 'root'
})
export class ThemeService {
  private theme: BehaviorSubject<Theme> = new BehaviorSubject<Theme>('light-theme');
  private currentTheme: Theme = 'light-theme';

  private readonly mediaQuery: MediaQueryList;

  constructor(private readonly lazyLoaderService: LazyLoaderService) {
    this.mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    this.mediaQuery.addEventListener('change', this.onColorSchemeChanged.bind(this));
    this.currentTheme = this.getTheme(this.mediaQuery.matches);
    this.theme.next(this.currentTheme);
  }

  public get onThemeChanged(): Observable<Theme> {
    return this.theme.asObservable();
  }

  /**
   * Lazy load supplemental styles per theme at application startup.
   */
  public load(): void {
    this.lazyLoaderService.loadAsset('dark-theme');
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

  private getTheme(isDark: boolean): Theme {
    if (isDark) {
      return 'dark-theme';
    }
    return 'light-theme';
  }
}
