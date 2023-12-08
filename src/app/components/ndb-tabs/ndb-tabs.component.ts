import {Component} from '@angular/core';
import {MatTabsModule} from "@angular/material/tabs";
import {combineLatest, map, Observable} from "rxjs";
import {MatIconModule} from "@angular/material/icon";
import {AsyncPipe, NgTemplateOutlet} from "@angular/common";
import {RouterLink} from "@angular/router";
import {SearchService} from "../../../shared/services/search.service";

export interface TabItemNode {
  readonly id: number;
  readonly name: string;
  readonly isEmpty: boolean;
}

interface TabItem {
  readonly uri: string;
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
    RouterLink
  ],
  templateUrl: './ndb-tabs.component.html',
  styleUrl: './ndb-tabs.component.scss'
})
export class NDBTabsComponent {

  readonly tabs: Observable<TabItem[]>;

  constructor(searchService: SearchService) {
    this.tabs = combineLatest([
      searchService.enums$,
      searchService.bitfields$,
      searchService.classes$,
      searchService.structs$,
      searchService.functions$,
    ]).pipe(
      map(([enums, bitfields, classes, structs, functions]) => {
        return [
          {uri: 'c', icon: 'class', alt: 'Classes', nodes: classes},
          {uri: 's', icon: 'struct', alt: 'Structs', nodes: structs},
          {uri: 'f', icon: 'function', alt: 'Global functions', nodes: functions},
          {uri: 'e', icon: 'enum', alt: 'Enums', nodes: enums},
          {uri: 'b', icon: 'bitfield', alt: 'Bitfields', nodes: bitfields},
        ];
      })
    );
  }

}
