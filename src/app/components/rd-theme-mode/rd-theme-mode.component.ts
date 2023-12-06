import {Component, OnDestroy, OnInit, Renderer2} from '@angular/core';
import {MatIconModule} from "@angular/material/icon";
import {MatButtonModule} from "@angular/material/button";
import {Theme, ThemeService} from "../../../shared/services/theme.service";
import {Subscription} from "rxjs";

@Component({
  selector: 'rd-theme-mode',
  standalone: true,
  imports: [
    MatIconModule,
    MatButtonModule
  ],
  templateUrl: './rd-theme-mode.component.html',
  styleUrl: './rd-theme-mode.component.scss'
})
export class RdThemeModeComponent implements OnInit, OnDestroy {

  private readonly themeS: Subscription;
  private theme: Theme = 'light-theme';

  constructor(private readonly themeService: ThemeService,
              private readonly renderer: Renderer2) {
    this.themeS = this.themeService.onThemeChanged.subscribe(this.onThemeChanged.bind(this));
  }

  get themeModeIcon(): string {
    return (this.theme === 'light-theme') ? 'dark_mode' : 'light_mode';
  }

  get themeModeTitle(): string {
    return `Switch to ${(this.theme === 'light-theme') ? 'dark' : 'light'} mode`;
  }

  ngOnInit(): void {
    this.themeService.load();
  }

  ngOnDestroy(): void {
    this.themeS.unsubscribe();
  }

  toggleTheme(): void {
    this.themeService.toggleTheme();
  }

  private onThemeChanged(theme: Theme): void {
    this.theme = theme;
    if (theme === 'light-theme') {
      this.renderer.removeClass(document.body, 'dark-theme');
    } else {
      this.renderer.addClass(document.body, theme);
    }
  }
}
