import {ChangeDetectionStrategy, Component, computed, effect, inject, input, signal} from '@angular/core';
import {MatIconModule} from "@angular/material/icon";
import {RedDumpService} from "../../../shared/services/red-dump.service";
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
    MatTooltip,
    MatIconModule,
    FunctionSpanComponent,
    NDBTitleBarComponent,
  ],
  templateUrl: './function.component.html',
  styleUrl: './function.component.scss'
})
export class FunctionComponent {

  private readonly dumpService: RedDumpService = inject(RedDumpService);
  private readonly wikiService: WikiService = inject(WikiService);
  private readonly pageService: PageService = inject(PageService);
  private readonly recentVisitService: RecentVisitService = inject(RecentVisitService);

  readonly id = input.required<string>();
  readonly global = computed<RedFunctionAst | undefined>(() => {
    return this.dumpService.getFunctionById(+this.id());
  });
  readonly documentation = signal<WikiGlobalDto | undefined>(undefined);

  constructor() {
    effect(() => {
      const id = +this.id();
      this.pageService.restoreScroll();
      this.recentVisitService.pushLastVisit(id);

      this.wikiService.getGlobal(id).then((global) => {
        this.documentation.set(global);
      });

      const global = this.global();
      if (global) {
        this.pageService.updateTitle(`NDB · ${global.fullName}`);
      }
    });
  }

}
