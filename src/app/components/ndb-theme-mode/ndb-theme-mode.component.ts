import {ChangeDetectionStrategy, Component, DestroyRef, OnInit, Renderer2} from '@angular/core';
import {MatIconModule} from "@angular/material/icon";
import {MatButtonModule} from "@angular/material/button";
import {Theme, ThemeService} from "../../../shared/services/theme.service";
import {takeUntilDestroyed} from "@angular/core/rxjs-interop";
import {MatTooltipModule} from "@angular/material/tooltip";

@Component({
  selector: 'ndb-theme-mode',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    MatIconModule,
    MatButtonModule,
    MatTooltipModule
  ],
  templateUrl: './ndb-theme-mode.component.html',
  styleUrl: './ndb-theme-mode.component.scss'
})
export class NDBThemeModeComponent implements OnInit {

  themeModeIcon: string = 'dark_mode';
  themeModeTitle: string = 'Switch to dark mode';

  private theme: Theme = 'light-theme';

  constructor(private readonly themeService: ThemeService,
              private readonly renderer: Renderer2,
              private readonly dr: DestroyRef) {
  }

  ngOnInit(): void {
    this.themeService.onThemeChanged.pipe(takeUntilDestroyed(this.dr)).subscribe(this.onThemeChanged.bind(this));
  }

  toggleTheme(): void {
    this.themeService.toggleTheme();
  }

  private onThemeChanged(theme: Theme): void {
    this.theme = theme;
    this.themeModeIcon = (this.theme === 'light-theme') ? 'dark_mode' : 'light_mode';
    this.themeModeTitle = `Switch to ${(this.theme === 'light-theme') ? 'dark' : 'light'} mode`;
    if (theme === 'light-theme') {
      this.renderer.removeClass(document.body, 'dark-theme');
    } else {
      this.renderer.addClass(document.body, theme);
    }
  }
}
