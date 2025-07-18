import {ChangeDetectionStrategy, Component, effect, inject, output, signal} from '@angular/core';
import {MatButtonModule} from "@angular/material/button";
import {MatChipsModule} from "@angular/material/chips";
import {MatIconModule} from "@angular/material/icon";
import {MatSidenavModule} from "@angular/material/sidenav";
import {MatToolbarModule} from "@angular/material/toolbar";
import {NDBIdeThemeComponent} from "../ndb-ide-theme/ndb-ide-theme.component";
import {NDBSearchComponent} from "../ndb-search/ndb-search.component";
import {NDBThemeModeComponent} from "../ndb-theme-mode/ndb-theme-mode.component";
import {NavigationEnd, Router, RouterLink} from "@angular/router";
import {ResponsiveService} from "../../../shared/services/responsive.service";
import {filter} from "rxjs";
import {takeUntilDestroyed} from "@angular/core/rxjs-interop";
import {MatTooltipModule} from "@angular/material/tooltip";
import {NDBSyntaxModeComponent} from "../ndb-syntax-mode/ndb-syntax-mode.component";
import {NDBMoreMenuComponent} from "../ndb-more-menu/ndb-more-menu.component";

@Component({
  selector: 'ndb-toolbar',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    RouterLink,
    MatIconModule,
    MatChipsModule,
    MatButtonModule,
    MatSidenavModule,
    MatToolbarModule,
    MatTooltipModule,
    NDBSearchComponent,
    NDBIdeThemeComponent,
    NDBThemeModeComponent,
    NDBSyntaxModeComponent,
    NDBMoreMenuComponent,
  ],
  templateUrl: './ndb-toolbar.component.html',
  styleUrl: './ndb-toolbar.component.scss'
})
export class NDBToolbarComponent {

  private readonly responsiveService: ResponsiveService = inject(ResponsiveService);
  private readonly router: Router = inject(Router);

  readonly toggle = output<void>();

  readonly isMobile = this.responsiveService.isMobile;
  readonly isTabsOpen = signal<boolean>(true);

  constructor() {
    this.router.events.pipe(
      filter((event) => event instanceof NavigationEnd),
      takeUntilDestroyed()
    ).subscribe(this.onRouteChanged.bind(this));

    effect(() => {
      const isMobile: boolean = this.isMobile();
      this.isTabsOpen.set(!isMobile);
    });
  }

  toggleTabs(): void {
    this.isTabsOpen.set(!this.isTabsOpen());
    this.toggle.emit();
  }

  onSearch(): void {
    if (!this.isMobile()) {
      return;
    }
    if (this.isTabsOpen()) {
      return;
    }
    this.isTabsOpen.set(true);
    this.toggle.emit();
  }

  private onRouteChanged(): void {
    if (!this.isMobile()) {
      return;
    }
    this.isTabsOpen.set(false);
  }

}
