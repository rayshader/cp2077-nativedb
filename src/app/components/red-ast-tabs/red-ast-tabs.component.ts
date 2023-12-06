import {Component, OnDestroy, ViewChild} from '@angular/core';
import {MatTabGroup, MatTabsModule} from "@angular/material/tabs";
import {combineLatest, Observable, Subscription} from "rxjs";
import {MatIconModule} from "@angular/material/icon";
import {AsyncPipe, NgTemplateOutlet} from "@angular/common";
import {RouterLink} from "@angular/router";
import {SearchService} from "../../../shared/services/search-service";
import {RedEnumAst} from "../../../shared/red-ast/red-enum.ast";
import {RedBitfieldAst} from "../../../shared/red-ast/red-bitfield.ast";
import {RedClassAst} from "../../../shared/red-ast/red-class.ast";
import {RedFunctionAst} from "../../../shared/red-ast/red-function.ast";

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
export class RedAstTabsComponent implements OnDestroy {
  @ViewChild(MatTabGroup)
  tabGroup?: MatTabGroup;

  tabIndex: number = 2;

  readonly tabs: TabItem[];

  private readonly tabSelectionS: Subscription;

  constructor(searchService: SearchService) {
    this.tabs = [
      {uri: 'e', icon: 'enum', alt: 'Enums', nodes$: searchService.enums$},
      {uri: 'b', icon: 'bitfield', alt: 'Bitfields', nodes$: searchService.bitfields$},
      {uri: 'c', icon: 'class', alt: 'Classes', nodes$: searchService.classes$},
      {uri: 's', icon: 'struct', alt: 'Structs', nodes$: searchService.structs$},
      {uri: 'f', icon: 'function', alt: 'Global functions', nodes$: searchService.functions$},
    ];
    this.tabSelectionS = combineLatest([
      searchService.enums$,
      searchService.bitfields$,
      searchService.classes$,
      searchService.structs$,
      searchService.functions$,
    ]).subscribe(this.onLastQuery.bind(this));
  }

  ngOnDestroy(): void {
    this.tabSelectionS.unsubscribe();
  }

  private onLastQuery([
                        enums,
                        bitfields,
                        classes,
                        structs,
                        functions
                      ]: [RedEnumAst[], RedBitfieldAst[], RedClassAst[], RedClassAst[], RedFunctionAst[]]): void {
    const lengthByType: number[] = [enums.length, bitfields.length, classes.length, structs.length, functions.length];
    let count: number = 0;
    let id: number = -1;

    for (let i = 0; i < lengthByType.length; i++) {
      const length: number = lengthByType[i];

      if (length > 0) {
        count++;
        id = i;
      }
    }
    if (count > 1 || id === -1) {
      return;
    }
    this.tabIndex = id;
    this.tabGroup?.focusTab(id);
  }
}
