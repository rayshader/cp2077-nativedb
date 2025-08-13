import {
  AfterViewInit,
  ChangeDetectionStrategy,
  Component,
  computed,
  DestroyRef,
  effect,
  ElementRef,
  HostListener,
  inject,
  OnInit,
  signal,
  viewChild
} from '@angular/core';

import {NavigationEnd, Router, RouterOutlet} from '@angular/router';
import {MatToolbarModule} from "@angular/material/toolbar";
import {NDBTabsComponent} from "./components/ndb-tabs/ndb-tabs.component";
import {IconsService} from "../shared/services/icons.service";
import {MatChipsModule} from "@angular/material/chips";
import {PageScrollBehavior, PageService} from "../shared/services/page.service";
import {MatButtonModule} from "@angular/material/button";
import {MatIconModule} from "@angular/material/icon";
import {SwUpdate, VersionEvent, VersionReadyEvent} from "@angular/service-worker";
import {MatDialog} from "@angular/material/dialog";
import {NDBUpdateDialogComponent} from "./components/ndb-update-dialog/ndb-update-dialog.component";
import {takeUntilDestroyed} from "@angular/core/rxjs-interop";
import {MAT_FORM_FIELD_DEFAULT_OPTIONS} from "@angular/material/form-field";
import {MatSidenavModule} from "@angular/material/sidenav";
import {NDBToolbarComponent} from "./components/ndb-toolbar/ndb-toolbar.component";
import {NDBBottomBarComponent} from "./components/ndb-bottom-bar/ndb-bottom-bar.component";
import {filter} from "rxjs";
import {ResponsiveService} from "../shared/services/responsive.service";
import {ShortcutService} from "../shared/services/shortcut.service";

export interface AppData {
  appVersion: string;
  gameVersion: string;
}

@Component({
  selector: 'app',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    RouterOutlet,
    MatIconModule,
    MatChipsModule,
    MatButtonModule,
    MatToolbarModule,
    MatSidenavModule,
    NDBTabsComponent,
    NDBToolbarComponent,
    NDBBottomBarComponent
],
  providers: [
    {provide: MAT_FORM_FIELD_DEFAULT_OPTIONS, useValue: {appearance: 'outline'}}
  ],
  templateUrl: './app.component.html',
  styleUrl: './app.component.scss'
})
export class AppComponent implements OnInit, AfterViewInit {

  private readonly iconsService = inject(IconsService);
  private readonly pageService = inject(PageService);
  private readonly responsiveService = inject(ResponsiveService);
  private readonly shortcutService = inject(ShortcutService);
  private readonly dialog = inject(MatDialog);
  private readonly router = inject(Router);
  private readonly swService = inject(SwUpdate);
  private readonly dr = inject(DestroyRef);

  readonly tabs = viewChild(NDBTabsComponent);
  readonly page = viewChild<ElementRef>('page');

  readonly showTabs = signal<boolean>(true);
  readonly isMobile = signal<boolean>(false);

  readonly displayTabs = computed<string>(() => {
    if (!this.isMobile()) {
      return '';
    }
    return (!this.showTabs()) ? 'none' : '';
  })
  readonly displayPage = computed<string>(() => {
    if (!this.isMobile()) {
      return '';
    }
    return (this.showTabs()) ? 'none' : '';
  })

  constructor() {
    effect(() => {
      const scroll = this.pageService.scroll();
      this.scroll(scroll);
    });
  }

  ngOnInit(): void {
    this.iconsService.load();

    this.router.events.pipe(
      filter((event) => event instanceof NavigationEnd),
      takeUntilDestroyed(this.dr)
    ).subscribe(this.onRouteChanged.bind(this));

    if (this.swService.isEnabled) {
      this.swService.versionUpdates
        .pipe(takeUntilDestroyed(this.dr))
        .subscribe(this.onUpdate.bind(this));
    }
  }

  ngAfterViewInit(): void {
    this.isMobile.set(this.responsiveService.isMobile());
    if (this.isMobile()) {
      this.showTabs.set(false);
    }
  }

  @HostListener('document:keydown', ['$event'])
  onKeyPress(event: KeyboardEvent): void {
    this.shortcutService.pushKey(event.key);
  }

  @HostListener('document:keyup')
  onKeyRelease(): void {
    this.shortcutService.pushKey('');
  }

  toggleTabs(): void {
    if (!this.isMobile()) {
      return;
    }
    this.showTabs.set(!this.showTabs());
    if (this.showTabs()) {
      setTimeout(() => {
        this.tabs()?.updateViewport();
      });
    }
  }

  private scroll(behavior: PageScrollBehavior): void {
    if (behavior === 'disabled') {
      return;
    }
    setTimeout(() => {
      this.page()?.nativeElement.scrollTo({top: 0, behavior: behavior});
    });
  }

  private onRouteChanged(): void {
    if (!this.isMobile()) {
      return;
    }

    this.showTabs.set(false);
  }

  private onUpdate(event: VersionEvent): void {
    if (event.type === 'VERSION_READY') {
      const readyEvent: VersionReadyEvent = event as VersionReadyEvent;
      const current: AppData = readyEvent.currentVersion.appData as AppData;
      const latest: AppData = readyEvent.latestVersion.appData as AppData;

      this.dialog.open(NDBUpdateDialogComponent, {
        data: {
          current: current,
          latest: latest
        }
      }).afterClosed()
        .pipe(takeUntilDestroyed(this.dr))
        .subscribe(this.onRefresh.bind(this));
    }
  }

  private onRefresh(state?: boolean): void {
    state ??= false;
    if (!state) {
      return;
    }
    window.location.reload();
  }

}
