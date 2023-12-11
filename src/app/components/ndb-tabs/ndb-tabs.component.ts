import {Component} from '@angular/core';
import {MatTabsModule} from "@angular/material/tabs";
import {combineLatest, map, Observable} from "rxjs";
import {MatIconModule} from "@angular/material/icon";
import {AsyncPipe, NgTemplateOutlet} from "@angular/common";
import {RouterLink} from "@angular/router";
import {SearchService} from "../../../shared/services/search.service";
import {CdkFixedSizeVirtualScroll, CdkVirtualForOf, CdkVirtualScrollViewport} from "@angular/cdk/scrolling";
import {MatDividerModule} from "@angular/material/divider";
import {SettingsService} from "../../../shared/services/settings.service";

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

@Component({
  selector: 'ndb-tabs',
  standalone: true,
  imports: [
    MatTabsModule,
    MatIconModule,
    NgTemplateOutlet,
    AsyncPipe,
    RouterLink,
    CdkVirtualScrollViewport,
    CdkFixedSizeVirtualScroll,
    CdkVirtualForOf,
    MatDividerModule
  ],
  templateUrl: './ndb-tabs.component.html',
  styleUrl: './ndb-tabs.component.scss'
})
export class NDBTabsComponent {

  readonly tabs$: Observable<TabItem[]>;
  readonly skeletons: TabItem[] = [
    {icon: 'class', alt: 'Classes', nodes: []},
    {icon: 'struct', alt: 'Structs', nodes: []},
    {icon: 'function', alt: 'Global functions', nodes: []},
    {icon: 'enum', alt: 'Enums', nodes: []},
    {icon: 'bitfield', alt: 'Bitfields', nodes: []},
  ];

  constructor(searchService: SearchService,
              settingsService: SettingsService) {
    this.tabs$ = combineLatest([
      searchService.enums$,
      searchService.bitfields$,
      searchService.classes$,
      searchService.structs$,
      searchService.functions$,
      settingsService.mergeObject$,
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
