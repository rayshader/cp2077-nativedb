import {Component, OnDestroy, OnInit, Renderer2} from '@angular/core';
import {CommonModule} from '@angular/common';
import {RouterLink, RouterOutlet} from '@angular/router';
import {MatToolbarModule} from "@angular/material/toolbar";
import {RedAstTabsComponent} from "./components/red-ast-tabs/red-ast-tabs.component";
import {IconsService} from "../shared/services/icons.service";
import {HttpClientModule} from "@angular/common/http";
import {Theme, ThemeService} from "../shared/services/theme.service";
import {Subscription} from "rxjs";

@Component({
  selector: 'app',
  standalone: true,
  imports: [CommonModule, RouterOutlet, MatToolbarModule, RedAstTabsComponent, HttpClientModule, RouterLink],
  templateUrl: './app.component.html',
  styleUrl: './app.component.scss'
})
export class AppComponent implements OnInit, OnDestroy {
  private readonly themeS: Subscription;

  constructor(private readonly iconsService: IconsService,
              private readonly themeService: ThemeService,
              private readonly renderer: Renderer2) {
    this.themeS = this.themeService.onThemeChanged.subscribe(this.onThemeChanged.bind(this));
  }

  ngOnInit(): void {
    this.iconsService.load();
    this.themeService.load();
  }

  ngOnDestroy(): void {
    this.themeS.unsubscribe();
  }

  private onThemeChanged(theme: Theme): void {
    if (theme === 'light-theme') {
      this.renderer.removeClass(document.body, 'dark-theme');
    } else {
      this.renderer.addClass(document.body, theme);
    }
  }
}
