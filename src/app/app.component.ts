import {Component, DestroyRef, ElementRef, OnInit, ViewChild} from '@angular/core';
import {CommonModule} from '@angular/common';
import {RouterLink, RouterOutlet} from '@angular/router';
import {MatToolbarModule} from "@angular/material/toolbar";
import {NDBTabsComponent} from "./components/ndb-tabs/ndb-tabs.component";
import {IconsService} from "../shared/services/icons.service";
import {HttpClientModule} from "@angular/common/http";
import {NDBSearchComponent} from "./components/ndb-search/ndb-search.component";
import {NDBThemeModeComponent} from "./components/ndb-theme-mode/ndb-theme-mode.component";
import {MatChipsModule} from "@angular/material/chips";
import {PageScrollBehavior, PageService} from "../shared/services/page.service";
import {MatButtonModule} from "@angular/material/button";
import {MatIconModule} from "@angular/material/icon";
import {SwUpdate, VersionEvent, VersionReadyEvent} from "@angular/service-worker";
import {MatDialog} from "@angular/material/dialog";
import {UpdateDialogComponent} from "./components/update-dialog/update-dialog.component";
import {takeUntilDestroyed} from "@angular/core/rxjs-interop";
import {NDBIdeThemeComponent} from "./components/ndb-ide-theme/ndb-ide-theme.component";
import {MAT_FORM_FIELD_DEFAULT_OPTIONS} from "@angular/material/form-field";

interface AppData {
  gameVersion: string;
}

@Component({
  selector: 'app',
  standalone: true,
  imports: [
    CommonModule,
    RouterOutlet,
    RouterLink,
    HttpClientModule,
    MatIconModule,
    MatChipsModule,
    MatButtonModule,
    MatToolbarModule,
    NDBTabsComponent,
    NDBSearchComponent,
    NDBThemeModeComponent,
    NDBIdeThemeComponent
  ],
  providers: [
    {provide: MAT_FORM_FIELD_DEFAULT_OPTIONS, useValue: {appearance: 'outline'}}
  ],
  templateUrl: './app.component.html',
  styleUrl: './app.component.scss'
})
export class AppComponent implements OnInit {
  @ViewChild('page')
  page?: ElementRef;

  constructor(private readonly iconsService: IconsService,
              private readonly pageService: PageService,
              private readonly dialog: MatDialog,
              private readonly swService: SwUpdate,
              private readonly dr: DestroyRef) {
  }

  ngOnInit(): void {
    this.iconsService.load();
    this.pageService.scroll$.pipe(takeUntilDestroyed(this.dr)).subscribe(this.scroll.bind(this));
    if (this.swService.isEnabled) {
      this.swService.versionUpdates.pipe(takeUntilDestroyed(this.dr)).subscribe(this.onUpdate.bind(this));
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

      this.dialog.open(UpdateDialogComponent, {
        data: {
          current: current.gameVersion,
          latest: latest.gameVersion
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

}
