import {
  AfterViewInit,
  ApplicationRef,
  Component,
  DestroyRef,
  HostListener,
  QueryList,
  Renderer2,
  ViewChild,
  ViewChildren
} from '@angular/core';
import {MatTabGroup, MatTabsModule} from "@angular/material/tabs";
import {combineLatest, filter, first, map, Observable} from "rxjs";
import {MatIconModule} from "@angular/material/icon";
import {AsyncPipe, NgTemplateOutlet} from "@angular/common";
import {RouterLink} from "@angular/router";
import {SearchService} from "../../../shared/services/search.service";
import {CdkFixedSizeVirtualScroll, CdkVirtualForOf, CdkVirtualScrollViewport} from "@angular/cdk/scrolling";
import {MatDividerModule} from "@angular/material/divider";
import {SettingsService} from "../../../shared/services/settings.service";
import {takeUntilDestroyed} from "@angular/core/rxjs-interop";
import {MatTooltipModule} from "@angular/material/tooltip";
import {ResponsiveService} from "../../../shared/services/responsive.service";

export interface TabItemNode {
  readonly id: number;
  readonly uri: string;
  readonly name: string;
  readonly isEmpty: boolean;
}

interface TabItem {
  readonly icon: string;
  readonly alt: string;
  readonly nodes: TabItemNode[];
}

interface ViewData {
  readonly tabs: TabItem[];
  readonly itemSize: number;
}

@Component({
  selector: 'ndb-tabs',
  standalone: true,
  imports: [
    AsyncPipe,
    RouterLink,
    NgTemplateOutlet,
    CdkVirtualForOf,
    CdkFixedSizeVirtualScroll,
    CdkVirtualScrollViewport,
    MatIconModule,
    MatTabsModule,
    MatDividerModule,
    MatTooltipModule
  ],
  templateUrl: './ndb-tabs.component.html',
  styleUrl: './ndb-tabs.component.scss'
})
export class NDBTabsComponent implements AfterViewInit {

  @ViewChild(MatTabGroup)
  readonly group?: MatTabGroup;

  @ViewChildren(CdkVirtualScrollViewport)
  readonly viewports?: QueryList<CdkVirtualScrollViewport>;

  readonly data$: Observable<ViewData>;

  width: string = '320px';

  private isResizing: boolean = false;

  constructor(private readonly app: ApplicationRef,
              private readonly renderer: Renderer2,
              private readonly searchService: SearchService,
              private readonly settingsService: SettingsService,
              private readonly responsiveService: ResponsiveService,
              private readonly dr: DestroyRef) {
    this.settingsService.tabsWidth$.pipe(first(), takeUntilDestroyed()).subscribe(this.onWidthLoaded.bind(this));
    this.data$ = combineLatest([
      this.getTabs(),
      this.responsiveService.mobile$
    ]).pipe(
      map(([tabs, isMobile]: [TabItem[], boolean]) => {
        return <ViewData>{
          tabs: tabs,
          itemSize: isMobile ? 47 : 35
        };
      })
    );
  }

  ngAfterViewInit(): void {
    this.app.isStable.pipe(
      filter((stable: boolean) => stable),
      first(),
      takeUntilDestroyed(this.dr)
    ).subscribe(this.updateViewport.bind(this));
  }

  // NOTE: Fix issue where viewport isn't filling its parent's height on first
  //       session. Used on desktop and mobile. Issue only seems to arise when
  //       project is build in production.
  updateViewport(): void {
    const viewports: CdkVirtualScrollViewport[] = this.viewports?.toArray() ?? [];

    if (viewports.length === 0) {
      return;
    }
    viewports[0].checkViewportSize();
  }

  protected onStartResizing(): void {
    this.isResizing = true;
    this.renderer.setStyle(document.body, 'user-select', 'none');
    this.renderer.setStyle(document.body, 'cursor', 'col-resize');
  }

  @HostListener('window:mousemove', ['$event'])
  protected onResizing(event: MouseEvent): void {
    if (!this.isResizing) {
      return;
    }
    if (event.x < 320 || event.x > document.body.clientWidth / 2) {
      return;
    }
    this.width = `${event.x}px`;
  }

  @HostListener('window:mouseup')
  protected onStopResizing(): void {
    if (!this.isResizing) {
      return;
    }
    this.renderer.removeStyle(document.body, 'user-select');
    this.renderer.removeStyle(document.body, 'cursor');
    this.settingsService.updateTabsWidth(parseInt(this.width));
    this.isResizing = false;
  }

  protected onRestoreDefault(): void {
    this.width = '320px';
    this.settingsService.updateTabsWidth(320);
  }

  private onWidthLoaded(width: number): void {
    this.width = `${width}px`;
  }

  private getTabs(): Observable<TabItem[]> {
    return combineLatest([
      this.searchService.enums$,
      this.searchService.bitfields$,
      this.searchService.classes$,
      this.searchService.structs$,
      this.searchService.functions$,
      this.settingsService.mergeObject$,
    ]).pipe(
      map(([
             enums,
             bitfields,
             classes,
             structs,
             functions,
             merge
           ]) => {
        const objects: TabItem[] = [];

        if (!merge) {
          objects.push(
            {icon: 'class', alt: 'Classes', nodes: classes},
            {icon: 'struct', alt: 'Structs', nodes: structs}
          );
        } else {
          const nodes: TabItemNode[] = [...classes, ...structs];

          nodes.sort((a, b) => a.name.localeCompare(b.name));
          objects.push(
            {icon: '', alt: 'Classes & structs', nodes: nodes},
          );
        }
        return [
          ...objects,
          {icon: 'function', alt: 'Global functions', nodes: functions},
          {icon: 'enum', alt: 'Enums', nodes: enums},
          {icon: 'bitfield', alt: 'Bitfields', nodes: bitfields},
        ];
      })
    );
  }

}
