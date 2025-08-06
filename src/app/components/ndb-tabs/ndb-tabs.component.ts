import {
  AfterViewInit,
  ApplicationRef,
  ChangeDetectionStrategy,
  Component,
  computed,
  DestroyRef,
  HostListener,
  inject,
  QueryList,
  Renderer2,
  ViewChild,
  ViewChildren
} from '@angular/core';
import {MatTabGroup, MatTabsModule} from "@angular/material/tabs";
import {filter, first} from "rxjs";
import {MatIconModule} from "@angular/material/icon";
import {RouterLink} from "@angular/router";
import {SearchService} from "../../../shared/services/search.service";
import {CdkFixedSizeVirtualScroll, CdkVirtualForOf, CdkVirtualScrollViewport} from "@angular/cdk/scrolling";
import {MatDividerModule} from "@angular/material/divider";
import {SettingsService} from "../../../shared/services/settings.service";
import {takeUntilDestroyed} from "@angular/core/rxjs-interop";
import {MatTooltipModule} from "@angular/material/tooltip";
import {ResponsiveService} from "../../../shared/services/responsive.service";
import {MatSlideToggle} from "@angular/material/slide-toggle";
import {FormControl, ReactiveFormsModule} from "@angular/forms";

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
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    RouterLink,
    CdkVirtualForOf,
    CdkFixedSizeVirtualScroll,
    CdkVirtualScrollViewport,
    MatIconModule,
    MatTabsModule,
    MatSlideToggle,
    MatDividerModule,
    MatTooltipModule,
    ReactiveFormsModule
  ],
  templateUrl: './ndb-tabs.component.html',
  styleUrl: './ndb-tabs.component.scss'
})
export class NDBTabsComponent implements AfterViewInit {

  private readonly searchService = inject(SearchService);
  private readonly settingsService = inject(SettingsService);
  private readonly responsiveService = inject(ResponsiveService);
  private readonly renderer = inject(Renderer2);
  private readonly app = inject(ApplicationRef);
  private readonly dr = inject(DestroyRef);

  readonly data = computed<ViewData>(() => {
    const enums = this.searchService.enums();
    const bitfields = this.searchService.bitfields();
    const classes = this.searchService.classes();
    const structs = this.searchService.structs();
    const globals = this.searchService.functions();

    const objects: TabItem[] = [];
    if (!this.settingsService.mergeObject()) {
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
    objects.push(
      {icon: 'function', alt: 'Global functions', nodes: globals},
      {icon: 'enum', alt: 'Enums', nodes: enums},
      {icon: 'bitfield', alt: 'Bitfields', nodes: bitfields}
    );
    return {
      tabs: objects,
      itemSize: this.responsiveService.isMobile() ? 47 : 35
    };
  });

  @ViewChild(MatTabGroup)
  readonly group?: MatTabGroup;

  @ViewChildren(CdkVirtualScrollViewport)
  readonly viewports?: QueryList<CdkVirtualScrollViewport>;

  readonly ignoreDuplicate: FormControl<boolean> = new FormControl<boolean>(false, {nonNullable: true});

  width: string = '320px';

  private isResizing: boolean = false;

  constructor() {
    const settings = this.settingsService.settings();

    this.ignoreDuplicate.setValue(settings.ignoreDuplicate, {emitEvent: false});
    this.width = `${settings.tabsWidth}px`;

    this.ignoreDuplicate.valueChanges.pipe(
      takeUntilDestroyed(this.dr)
    ).subscribe(this.onIgnoreDuplicateUpdated.bind(this));
  }

  ngAfterViewInit(): void {
    this.app.isStable.pipe(
      filter((stable: boolean) => stable),
      first(),
      takeUntilDestroyed(this.dr)
    ).subscribe(this.updateViewport.bind(this));
  }

  // NOTE: Fix an issue where viewport isn't filling its parent's height on the
  //       first session. Used on desktop and mobile. Issue only seems to arise
  //       when the project is built in production.
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

  private onIgnoreDuplicateUpdated(value: boolean) {
    this.settingsService.updateIgnoreDuplicate(value);
  }

}
