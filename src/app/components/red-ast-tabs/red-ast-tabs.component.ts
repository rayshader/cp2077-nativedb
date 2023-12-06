import {Component} from '@angular/core';
import {MatTabsModule} from "@angular/material/tabs";
import {Observable} from "rxjs";
import {MatIconModule} from "@angular/material/icon";
import {AsyncPipe, NgTemplateOutlet} from "@angular/common";
import {RouterLink} from "@angular/router";
import {SearchService} from "../../../shared/services/search-service";

interface RedNode {
  readonly id: number;
  readonly name: string;
}

interface TabItem {
  readonly uri: string;
  readonly icon: string;
  readonly alt: string;
  readonly nodes$: Observable<RedNode[]>;
}

@Component({
  selector: 'red-ast-tabs',
  standalone: true,
  imports: [
    MatTabsModule,
    MatIconModule,
    NgTemplateOutlet,
    AsyncPipe,
    RouterLink
  ],
  templateUrl: './red-ast-tabs.component.html',
  styleUrl: './red-ast-tabs.component.scss'
})
export class RedAstTabsComponent {
  readonly tabs: TabItem[];

  constructor(searchService: SearchService) {
    this.tabs = [
      {uri: 'e', icon: 'enum', alt: 'Enums', nodes$: searchService.enums$},
      {uri: 'b', icon: 'bitfield', alt: 'Bitfields', nodes$: searchService.bitfields$},
      {uri: 'c', icon: 'class', alt: 'Classes', nodes$: searchService.classes$},
      {uri: 's', icon: 'struct', alt: 'Structs', nodes$: searchService.structs$},
      {uri: 'f', icon: 'function', alt: 'Global functions', nodes$: searchService.functions$},
    ];
  }
}
