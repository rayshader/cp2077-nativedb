import {Injectable} from '@angular/core';
import {BehaviorSubject, Observable} from 'rxjs';
import {LazyLoaderService} from "./lazy-loader.service";
import {takeUntilDestroyed} from "@angular/core/rxjs-interop";

export enum IDETheme {
  vanilla,
  vscode,
  intellij
}

export interface IDEThemeChanged {
  old: IDETheme;
  current: IDETheme;
}

interface IDEItem {
  theme: IDETheme;
  isLoaded: boolean;
  font?: string;
}

@Injectable({
  providedIn: 'root'
})
export class IDEThemeService {
  private theme: BehaviorSubject<IDEThemeChanged> = new BehaviorSubject<IDEThemeChanged>({
    old: IDETheme.vscode,
    current: IDETheme.vscode,
  });
  private currentTheme: IDETheme = IDETheme.vscode;

  private readonly themes: IDEItem[] = [
    {
      theme: IDETheme.vanilla,
      isLoaded: false,
      font: 'https://fonts.googleapis.com/css2?family=Fira+Code&display=swap'
    },
    {theme: IDETheme.vscode, isLoaded: false},
    {
      theme: IDETheme.intellij,
      isLoaded: false,
      font: 'https://fonts.googleapis.com/css2?family=JetBrains+Mono&display=swap'
    }
  ];

  constructor(private readonly lazyLoaderService: LazyLoaderService) {
    this.onThemeChanged.pipe(takeUntilDestroyed()).subscribe(this.load.bind(this));
    const localIdeTheme: string | null = localStorage.getItem('ide-theme');
    let ideTheme: IDETheme;

    if (!localIdeTheme) {
      ideTheme = IDETheme.vscode;
    } else {
      ideTheme = +localIdeTheme;
    }
    this.updateTheme(ideTheme);
  }

  public get onThemeChanged(): Observable<IDEThemeChanged> {
    return this.theme.asObservable();
  }

  /**
   * Update IDE theme and emit it. Lazy load IDE theme when required.
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

  private load(event: IDEThemeChanged): void {
    const item: IDEItem | undefined = this.themes.find((item) => item.theme === event.current);

    if (!item) {
      return;
    }
    if (item.isLoaded) {
      return;
    }
    this.lazyLoaderService.loadStylesheet(`ide-${IDETheme[item.theme]}-theme`)
    if (item.font) {
      this.lazyLoaderService.loadFont(item.font);
    }
    item.isLoaded = true;
  }
}
