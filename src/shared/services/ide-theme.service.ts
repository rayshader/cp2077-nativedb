import {effect, inject, Injectable, Signal, signal} from '@angular/core';
import {Theme, ThemeService} from "./theme.service";
import {LazyLoaderService} from "./lazy-loader.service";

export enum IDETheme {
  legacy,
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
  private readonly themeService: ThemeService = inject(ThemeService);
  private readonly lazyLoaderService: LazyLoaderService = inject(LazyLoaderService);

  private readonly ideTheme = signal<IDEThemeChanged>({
    old: IDETheme.vscode,
    current: IDETheme.vscode,
  });

  private isDarkLoaded: boolean = false;

  constructor() {
    const localIdeTheme: string | null = localStorage.getItem('ide-theme');
    const ideTheme: IDETheme = (!localIdeTheme) ? IDETheme.vscode : +localIdeTheme;

    this.updateTheme(ideTheme);
    effect(() => {
      const theme: Theme = this.themeService.theme();

      if (theme === 'light-theme' || this.isDarkLoaded) {
        return;
      }
      this.lazyLoaderService.loadStylesheet('dark-ide-theme');
      this.isDarkLoaded = true;
    });
  }

  public get theme(): Signal<IDEThemeChanged> {
    return this.ideTheme;
  }

  /**
   * Update the IDE theme and emit changes with old and new value.
   */
  public updateTheme(theme: IDETheme): void {
    const oldTheme: IDETheme = this.ideTheme().current;

    this.ideTheme.set({
      old: oldTheme,
      current: theme
    });
    localStorage.setItem('ide-theme', `${theme}`);
  }
}
