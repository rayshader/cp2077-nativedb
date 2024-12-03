import {ChangeDetectionStrategy, Component, Input} from '@angular/core';
import {MatButtonModule} from "@angular/material/button";
import {MatIconModule} from "@angular/material/icon";
import {combineLatest, EMPTY, filter, map, Observable} from "rxjs";
import {RedDumpService} from "../../../shared/services/red-dump.service";
import {AsyncPipe} from "@angular/common";
import {RedBitfieldAst} from "../../../shared/red-ast/red-bitfield.ast";
import {PageService} from "../../../shared/services/page.service";
import {NDBTitleBarComponent} from "../../components/ndb-title-bar/ndb-title-bar.component";
import {RecentVisitService} from "../../../shared/services/recent-visit.service";
import {cyrb53} from "../../../shared/string";
import {NDBHighlightDirective} from "../../directives/ndb-highlight.directive";
import {MatTooltip} from "@angular/material/tooltip";
import {CodeSyntax, SettingsService} from "../../../shared/services/settings.service";

interface BitfieldData {
  readonly node: RedBitfieldAst;
  readonly name: string;
  readonly altName?: string;
}

@Component({
  selector: 'ndb-page-bitfield',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    AsyncPipe,
    MatTooltip,
    MatIconModule,
    MatButtonModule,
    NDBTitleBarComponent,
    NDBHighlightDirective
  ],
  templateUrl: './bitfield.component.html',
  styleUrl: './bitfield.component.scss'
})
export class BitfieldComponent {

  data$: Observable<BitfieldData> = EMPTY;

  protected readonly cyrb53 = cyrb53;

  constructor(private readonly dumpService: RedDumpService,
              private readonly settingsService: SettingsService,
              private readonly pageService: PageService,
              private readonly recentVisitService: RecentVisitService) {
  }

  @Input()
  set id(id: string) {
    this.pageService.restoreScroll();
    this.recentVisitService.pushLastVisit(+id);
    this.data$ = combineLatest([
      this.dumpService.getBitfieldById(+id),
      this.settingsService.code$
    ]).pipe(
      filter(([node,]) => !!node),
      map(([node, syntax]) => {
        let name: string = node!.name;
        let altName: string | undefined = node!.aliasName;

        if (syntax === CodeSyntax.redscript && node!.aliasName) {
          name = node!.aliasName;
          altName = node!.name;
        }
        return <BitfieldData>{
          node: node,
          name: name,
          altName: altName
        };
      })
    );
  }

  protected async copyClipboard(node: RedBitfieldAst, key: string): Promise<void> {
    let data: string = `${node.name}.${key}`;

    await navigator.clipboard.writeText(data);
  }

}
