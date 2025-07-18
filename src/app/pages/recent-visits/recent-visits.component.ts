import {ChangeDetectionStrategy, Component, computed, inject, OnInit, signal} from '@angular/core';
import {MatIconModule} from "@angular/material/icon";
import {TypeSpanComponent} from "../../components/spans/type-span/type-span.component";
import {getRedNodeKindName, RedNodeAst, RedNodeKind} from "../../../shared/red-ast/red-node.ast";
import {RedDumpService} from "../../../shared/services/red-dump.service";
import {RecentVisitItem, RecentVisitService} from "../../../shared/services/recent-visit.service";
import {MatButtonModule} from "@angular/material/button";
import {MatDividerModule} from "@angular/material/divider";
import {MatTooltipModule} from "@angular/material/tooltip";
import {PageService} from "../../../shared/services/page.service";

interface VisitData {
  readonly node: RedNodeAst;
  readonly icon: string;
  readonly alt: string;
}

@Component({
  selector: 'ndb-page-recent-visits',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
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

  private readonly dumpService: RedDumpService = inject(RedDumpService);
  private readonly pageService = inject(PageService);
  private readonly recentVisitService: RecentVisitService = inject(RecentVisitService);

  readonly disableClearAll = signal<boolean>(true);

  readonly visits = computed<VisitData[]>(() => {
    const items: RecentVisitItem[] = this.recentVisitService.getAll();
    items.sort((a, b) => b.visitedAt - a.visitedAt);

    const nodes: RedNodeAst[] = this.dumpService.nodes();
    return items.map((item) => nodes.find((node) => node.id === item.id))
      .filter((node) => !!node)
      .map((node) => <VisitData>{
        node: node,
        icon: RedNodeKind[node!.kind],
        alt: getRedNodeKindName(node!.kind)
      });
  });

  ngOnInit(): void {
    this.pageService.updateTitle('NativeDB');
    const items: RecentVisitItem[] = this.recentVisitService.getAll();
    this.disableClearAll.set(items.length === 0);
  }

  onClearAll(): void {
    this.recentVisitService.clear();
    this.disableClearAll.set(true);
  }

}
