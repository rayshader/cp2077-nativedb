import {ChangeDetectionStrategy, Component, Input} from '@angular/core';
import {RedDumpService} from "../../../shared/services/red-dump.service";
import {combineLatest, EMPTY, filter, map, Observable} from "rxjs";
import {AsyncPipe} from "@angular/common";
import {MatIconModule} from "@angular/material/icon";
import {MatButtonModule} from "@angular/material/button";
import {RedEnumAst} from "../../../shared/red-ast/red-enum.ast";
import {PageService} from "../../../shared/services/page.service";
import {NDBTitleBarComponent} from "../../components/ndb-title-bar/ndb-title-bar.component";
import {RecentVisitService} from "../../../shared/services/recent-visit.service";
import {NDBHighlightDirective} from "../../directives/ndb-highlight.directive";
import {cyrb53} from "../../../shared/string";
import {MatTooltip} from "@angular/material/tooltip";
import {CodeSyntax, SettingsService} from "../../../shared/services/settings.service";

interface EnumData {
  readonly node: RedEnumAst;
  readonly name: string;
  readonly altName?: string;
}

@Component({
  selector: 'ndb-page-enum',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    AsyncPipe,
    MatTooltip,
    MatIconModule,
    MatButtonModule,
    NDBTitleBarComponent,
    NDBHighlightDirective
  ],
  templateUrl: './enum.component.html',
  styleUrl: './enum.component.scss'
})
export class EnumComponent {

  data$: Observable<EnumData> = EMPTY;

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
      this.dumpService.getEnumById(+id),
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
        return <EnumData>{
          node: node,
          name: name,
          altName: altName
        };
      })
    );
  }

  protected async copyClipboard(node: RedEnumAst, key: string): Promise<void> {
    let data: string = `${node.name}.${key}`;

    await navigator.clipboard.writeText(data);
  }

}
