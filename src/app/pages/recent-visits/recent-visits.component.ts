import {ChangeDetectionStrategy, Component, OnInit} from '@angular/core';
import {AsyncPipe} from "@angular/common";
import {MatIconModule} from "@angular/material/icon";
import {TypeSpanComponent} from "../../components/spans/type-span/type-span.component";
import {combineLatest, map, Observable, of} from "rxjs";
import {getRedNodeKindName, RedNodeAst, RedNodeKind} from "../../../shared/red-ast/red-node.ast";
import {RedDumpService} from "../../../shared/services/red-dump.service";
import {RecentVisitItem, RecentVisitService} from "../../../shared/services/recent-visit.service";
import {MatButtonModule} from "@angular/material/button";
import {MatDividerModule} from "@angular/material/divider";
import {MatTooltipModule} from "@angular/material/tooltip";
import {PageService} from "../../../shared/services/page.service";

interface RecentVisitData {
  readonly node: RedNodeAst;
  readonly icon: string;
  readonly alt: string;
}

@Component({
  selector: 'ndb-page-recent-visits',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    AsyncPipe,
    MatIconModule,
    MatButtonModule,
    MatDividerModule,
    MatTooltipModule,
    TypeSpanComponent
  ],
  templateUrl: './recent-visits.component.html',
  styleUrl: './recent-visits.component.scss'
})
export class RecentVisitsComponent implements OnInit {

  recentVisits$: Observable<RecentVisitData[]> = of([]);
  cannotClearAll$: Observable<boolean> = of(true);

  constructor(private readonly dumpService: RedDumpService,
              private readonly pageService: PageService,
              private readonly recentVisitService: RecentVisitService) {
  }

  ngOnInit(): void {
    this.pageService.updateTitle('NativeDB');

    const items: RecentVisitItem[] = this.recentVisitService.getAll();

    items.sort((a, b) => b.visitedAt - a.visitedAt);
    const items$ = items.map((item) => this.dumpService.getById(item.id));

    this.cannotClearAll$ = of(items.length === 0);
    this.recentVisits$ = combineLatest(items$).pipe(
      map((nodes: (RedNodeAst | undefined)[]) => nodes
        .filter((node) => !!node)
        .map((node) => <RecentVisitData>{
          node: node,
          icon: RedNodeKind[node!.kind],
          alt: getRedNodeKindName(node!.kind)
        })
      )
    );
  }

  onClearAll(): void {
    this.recentVisitService.clear();
    this.cannotClearAll$ = of(true);
    this.recentVisits$ = of([]);
  }

}
