import {ChangeDetectionStrategy, Component, computed, effect, inject, Renderer2} from '@angular/core';
import {MatIconModule} from "@angular/material/icon";
import {MatButtonModule} from "@angular/material/button";
import {Theme, ThemeService} from "../../../shared/services/theme.service";
import {MatTooltipModule} from "@angular/material/tooltip";

@Component({
  selector: 'ndb-theme-mode',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    MatIconModule,
    MatButtonModule,
    MatTooltipModule
  ],
  templateUrl: './ndb-theme-mode.component.html',
  styleUrl: './ndb-theme-mode.component.scss'
})
export class NDBThemeModeComponent {

  private readonly themeService: ThemeService = inject(ThemeService);
  private readonly renderer: Renderer2 = inject(Renderer2);

  private readonly theme = this.themeService.theme;
  readonly icon = computed(() => this.theme() === 'light-theme' ? 'dark_mode' : 'light_mode');
  readonly title = computed(() => `Switch to ${(this.theme() === 'light-theme') ? 'dark' : 'light'} mode`);

  constructor() {
    effect(() => {
      const theme: Theme = this.theme();

      if (theme === 'light-theme') {
        this.renderer.removeClass(document.body, 'dark-theme');
      } else {
        this.renderer.addClass(document.body, theme);
      }
    });
  }

  toggleTheme(): void {
    this.themeService.toggleTheme();
  }

}
