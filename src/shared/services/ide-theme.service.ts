import {Injectable} from '@angular/core';
import {BehaviorSubject, Observable} from 'rxjs';
import {Theme, ThemeService} from "./theme.service";
import {takeUntilDestroyed} from "@angular/core/rxjs-interop";
import {LazyLoaderService} from "./lazy-loader.service";

export enum IDETheme {
  vanilla,
  vscode,
  intellij
}

export interface IDEThemeChanged {
  old: IDETheme;
  current: IDETheme;
}

@Injectable({
  providedIn: 'root'
})
export class IDEThemeService {
  private theme: BehaviorSubject<IDEThemeChanged> = new BehaviorSubject<IDEThemeChanged>({
    old: IDETheme.vanilla,
    current: IDETheme.vanilla,
  });
  private currentTheme: IDETheme = IDETheme.vanilla;
  private isDarkLoaded: boolean = false;

  constructor(private readonly themeService: ThemeService,
              private readonly lazyLoaderService: LazyLoaderService) {
    const localIdeTheme: string | null = localStorage.getItem('ide-theme');
    let ideTheme: IDETheme;

    if (!localIdeTheme) {
      ideTheme = IDETheme.vanilla;
    } else {
      ideTheme = +localIdeTheme;
    }
    this.updateTheme(ideTheme);
    this.themeService.onThemeChanged.pipe(takeUntilDestroyed()).subscribe(this.onThemeModeChanged.bind(this));
  }

  public get onThemeChanged(): Observable<IDEThemeChanged> {
    return this.theme.asObservable();
  }

  /**
   * Update IDE theme and emit changes with old and new value.
   */
  public updateTheme(theme: IDETheme): void {
    const oldTheme: IDETheme = this.currentTheme;

    this.currentTheme = theme;
    this.theme.next({
      old: oldTheme,
      current: this.currentTheme
    });
    localStorage.setItem('ide-theme', `${theme}`);
  }

  private onThemeModeChanged(theme: Theme): void {
    if (theme === 'light-theme' || this.isDarkLoaded) {
      return;
    }
    this.lazyLoaderService.loadStylesheet('dark-ide-theme');
    this.isDarkLoaded = true;
  }
}
