import {Component, Input} from '@angular/core';
import {MatButtonModule} from "@angular/material/button";
import {MatIconModule} from "@angular/material/icon";
import {EMPTY, Observable} from "rxjs";
import {RedDumpService} from "../../../shared/services/red-dump.service";
import {AsyncPipe} from "@angular/common";
import {RedBitfieldAst} from "../../../shared/red-ast/red-bitfield.ast";
import {PageService} from "../../../shared/services/page.service";
import {NDBTitleBarComponent} from "../../components/ndb-title-bar/ndb-title-bar.component";
import {RecentVisitService} from "../../../shared/services/recent-visit.service";

@Component({
  selector: 'bitfield',
  standalone: true,
  imports: [
    MatButtonModule,
    MatIconModule,
    AsyncPipe,
    NDBTitleBarComponent
  ],
  templateUrl: './bitfield.component.html',
  styleUrl: './bitfield.component.scss'
})
export class BitfieldComponent {

  bitfield$: Observable<RedBitfieldAst | undefined> = EMPTY;

  constructor(private readonly dumpService: RedDumpService,
              private readonly pageService: PageService,
              private readonly recentVisitService: RecentVisitService) {
  }

  @Input()
  set id(id: string) {
    this.pageService.restoreScroll();
    this.recentVisitService.pushLastVisit(+id);
    this.bitfield$ = this.dumpService.getBitfieldById(+id);
  }

  protected async copyClipboard(node: RedBitfieldAst, key: string): Promise<void> {
    let data: string = `${node.name}.${key}`;

    await navigator.clipboard.writeText(data);
  }

}
