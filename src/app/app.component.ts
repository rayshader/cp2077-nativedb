import {
  ApplicationRef,
  ChangeDetectionStrategy,
  Component,
  DestroyRef,
  ElementRef,
  HostListener,
  OnInit,
  ViewChild
} from '@angular/core';
import {CommonModule} from '@angular/common';
import {NavigationEnd, Router, RouterLink, RouterOutlet} from '@angular/router';
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
import {combineLatestWith, filter, first, map, OperatorFunction, pipe} from "rxjs";
import {ResponsiveService} from "../shared/services/responsive.service";
import {ShortcutService} from "../shared/services/shortcut.service";

export interface AppData {
  appVersion: string;
  gameVersion: string;
}

@Component({
  selector: 'app',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    CommonModule,
    RouterOutlet,
    RouterLink,
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
export class AppComponent implements OnInit {
  @ViewChild(NDBTabsComponent)
  readonly tabs?: NDBTabsComponent;

  @ViewChild('page')
  readonly page?: ElementRef;

  showTabs: boolean = true;
  isMobile: boolean = false;

  constructor(private readonly iconsService: IconsService,
              private readonly pageService: PageService,
              private readonly responsiveService: ResponsiveService,
              private readonly shortcutService: ShortcutService,
              private readonly app: ApplicationRef,
              private readonly dialog: MatDialog,
              private readonly router: Router,
              private readonly swService: SwUpdate,
              private readonly dr: DestroyRef) {
  }

  get displayTabs(): string {
    if (!this.isMobile) {
      return '';
    }
    return (!this.showTabs) ? 'none' : '';
  }

  get displayPage(): string {
    if (!this.isMobile) {
      return '';
    }
    return (this.showTabs) ? 'none' : '';
  }

  ngOnInit(): void {
    this.iconsService.load();
    this.router.events.pipe(
      filter((event) => event instanceof NavigationEnd),
      takeUntilDestroyed(this.dr)
    ).subscribe(this.onRouteChanged.bind(this));
    this.responsiveService.mobile$.pipe(
      this.isReady(),
      takeUntilDestroyed(this.dr)
    ).subscribe(this.onMobile.bind(this));
    this.pageService.scroll$.pipe(takeUntilDestroyed(this.dr)).subscribe(this.scroll.bind(this));
    if (this.swService.isEnabled) {
      this.swService.versionUpdates.pipe(takeUntilDestroyed(this.dr)).subscribe(this.onUpdate.bind(this));
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

  onToggleTabs(): void {
    if (!this.isMobile) {
      return;
    }
    this.showTabs = !this.showTabs;
    if (this.showTabs) {
      setTimeout(() => {
        this.tabs?.updateViewport();
      });
    }
  }

  private onRouteChanged(): void {
    if (!this.isMobile) {
      return;
    }
    this.showTabs = false;
  }

  private onMobile(isMobile: boolean): void {
    this.isMobile = isMobile;
    if (isMobile) {
      this.showTabs = false;
    }
  }

  private scroll(behavior: PageScrollBehavior): void {
    this.page?.nativeElement.scrollTo({top: 0, behavior: behavior});
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
      }).afterClosed().pipe(takeUntilDestroyed(this.dr)).subscribe(this.onRefresh.bind(this));
    }
  }

  private onRefresh(state?: boolean): void {
    state ??= false;
    if (!state) {
      return;
    }
    window.location.reload();
  }

  private isReady(): OperatorFunction<boolean, boolean> {
    return pipe(
      combineLatestWith(
        this.app.isStable.pipe(
          filter((stable: boolean) => stable),
          first()
        )
      ),
      map(([isMobile,]) => isMobile)
    );
  }

}
