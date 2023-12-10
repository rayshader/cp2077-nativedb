import {Component, Renderer2} from '@angular/core';
import {MatButtonModule} from "@angular/material/button";
import {MatIconModule} from "@angular/material/icon";
import {MatMenuModule} from "@angular/material/menu";
import {IDETheme, IDEThemeChanged, IDEThemeService} from "../../../shared/services/ide-theme.service";
import {takeUntilDestroyed} from "@angular/core/rxjs-interop";

interface ThemeItem {
  isSelected: boolean;
  value: IDETheme;
  name: string;
}

@Component({
  selector: 'ndb-ide-theme',
  standalone: true,
  imports: [
    MatButtonModule,
    MatIconModule,
    MatMenuModule
  ],
  templateUrl: './ndb-ide-theme.component.html',
  styleUrl: './ndb-ide-theme.component.scss'
})
export class NDBIdeThemeComponent {

  readonly themes: ThemeItem[] = [
    {isSelected: true, value: IDETheme.vanilla, name: 'Vanilla'},
    {isSelected: false, value: IDETheme.vscode, name: 'VS Code · Modern'},
    {isSelected: false, value: IDETheme.intellij, name: 'IntelliJ · Dracula'},
  ];

  constructor(private readonly themeService: IDEThemeService,
              private readonly renderer: Renderer2) {
    this.themeService.onThemeChanged.pipe(takeUntilDestroyed()).subscribe(this.onThemeChanged.bind(this));
  }

  selectTheme(theme: ThemeItem): void {
    this.themeService.updateTheme(theme.value);
  }

  private onThemeChanged(event: IDEThemeChanged): void {
    this.themes.forEach((item) => item.isSelected = false);
    const theme: ThemeItem | undefined = this.themes.find((item) => item.value === event.current);

    if (theme) {
      theme.isSelected = true;
    }
    this.renderer.removeClass(document.body, `ide-${IDETheme[event.old]}-theme`);
    this.renderer.addClass(document.body, `ide-${IDETheme[event.current]}-theme`);
  }

}
