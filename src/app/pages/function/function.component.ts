import {ChangeDetectionStrategy, Component, Input} from '@angular/core';
import {MatIconModule} from "@angular/material/icon";
import {combineLatest, EMPTY, filter, map, Observable} from "rxjs";
import {RedDumpService} from "../../../shared/services/red-dump.service";
import {AsyncPipe} from "@angular/common";
import {FunctionSpanComponent} from "../../components/spans/function-span/function-span.component";
import {RedFunctionAst} from "../../../shared/red-ast/red-function.ast";
import {PageService} from "../../../shared/services/page.service";
import {NDBTitleBarComponent} from "../../components/ndb-title-bar/ndb-title-bar.component";
import {RecentVisitService} from "../../../shared/services/recent-visit.service";
import {MatTooltip} from "@angular/material/tooltip";
import {WikiService} from "../../../shared/services/wiki.service";
import {WikiGlobalDto} from "../../../shared/dtos/wiki.dto";

interface FunctionData {
  readonly function: RedFunctionAst;
  readonly documentation?: WikiGlobalDto;
}

@Component({
  selector: 'ndb-page-function',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    AsyncPipe,
    MatTooltip,
    MatIconModule,
    FunctionSpanComponent,
    NDBTitleBarComponent,
  ],
  templateUrl: './function.component.html',
  styleUrl: './function.component.scss'
})
export class FunctionComponent {

  data$: Observable<FunctionData | undefined> = EMPTY;

  constructor(private readonly dumpService: RedDumpService,
              private readonly wikiService: WikiService,
              private readonly pageService: PageService,
              private readonly recentVisitService: RecentVisitService) {
  }

  @Input()
  set id(id: string) {
    this.pageService.restoreScroll();
    this.recentVisitService.pushLastVisit(+id);
    this.data$ = combineLatest([
      this.dumpService.getFunctionById(+id),
      this.wikiService.getGlobal(+id)
    ]).pipe(
      filter(([func]) => !!func),
      map(([func, documentation]) => {
        if (func) {
          this.pageService.updateTitle(`NDB · ${func.fullName}`);
        }

        return <FunctionData>{
          function: func,
          documentation: documentation
        }
      }));
  }

}
