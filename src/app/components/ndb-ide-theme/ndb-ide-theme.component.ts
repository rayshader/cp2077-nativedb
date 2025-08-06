import {ChangeDetectionStrategy, Component, effect, inject, Renderer2} from '@angular/core';
import {MatButtonModule} from "@angular/material/button";
import {MatIconModule} from "@angular/material/icon";
import {MatMenuModule} from "@angular/material/menu";
import {IDETheme, IDEThemeChanged, IDEThemeService} from "../../../shared/services/ide-theme.service";
import {MatTooltipModule} from "@angular/material/tooltip";

interface ThemeItem {
  isSelected: boolean;
  value: IDETheme;
  name: string;
}

@Component({
  selector: 'ndb-ide-theme',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    MatIconModule,
    MatMenuModule,
    MatButtonModule,
    MatTooltipModule
  ],
  templateUrl: './ndb-ide-theme.component.html',
  styleUrl: './ndb-ide-theme.component.scss'
})
export class NDBIdeThemeComponent {

  private readonly themeService = inject(IDEThemeService);
  private readonly renderer = inject(Renderer2);

  readonly themes: ThemeItem[] = [
    {isSelected: true, value: IDETheme.legacy, name: 'Legacy'},
    {isSelected: false, value: IDETheme.vscode, name: 'VS Code · Modern'},
    {isSelected: false, value: IDETheme.intellij, name: 'IntelliJ · Dracula'},
  ];

  constructor() {
    effect(() => {
      const event: IDEThemeChanged = this.themeService.theme();

      this.themes.forEach((item) => item.isSelected = false);
      const theme: ThemeItem | undefined = this.themes.find((item) => item.value === event.current);

      if (theme) {
        theme.isSelected = true;
      }
      this.renderer.removeClass(document.body, `ide-${IDETheme[event.old]}-theme`);
      this.renderer.addClass(document.body, `ide-${IDETheme[event.current]}-theme`);
    });
  }

  selectTheme(theme: ThemeItem): void {
    this.themeService.updateTheme(theme.value);
  }

}
