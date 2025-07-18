import {ChangeDetectionStrategy, Component, computed, inject, OnInit} from '@angular/core';
import {RedDumpService} from "../../../shared/services/red-dump.service";
import {BookmarkService} from "../../../shared/services/bookmark.service";
import {getRedNodeKindName, RedNodeAst, RedNodeKind} from "../../../shared/red-ast/red-node.ast";
import {MatIconModule} from "@angular/material/icon";
import {TypeSpanComponent} from "../../components/spans/type-span/type-span.component";
import {MatDividerModule} from "@angular/material/divider";
import {MatTooltipModule} from "@angular/material/tooltip";
import {PageService} from "../../../shared/services/page.service";

interface BookmarkItem {
  readonly node: RedNodeAst;
  readonly icon: string;
  readonly alt: string;
}

@Component({
  selector: 'ndb-page-bookmarks',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    MatIconModule,
    MatTooltipModule,
    TypeSpanComponent,
    MatDividerModule
  ],
  templateUrl: './bookmarks.component.html',
  styleUrl: './bookmarks.component.scss'
})
export class BookmarksComponent implements OnInit {

  private readonly dumpService: RedDumpService = inject(RedDumpService);
  private readonly pageService = inject(PageService);
  private readonly bookmarkService: BookmarkService = inject(BookmarkService);

  readonly bookmarks = computed<BookmarkItem[]>(() => {
    const bookmarks = this.bookmarkService.getAll();
    const nodes: RedNodeAst[] = this.dumpService.nodes();

    return bookmarks.map((bookmark) => nodes.find((node) => node.id === bookmark))
      .filter((node) => !!node)
      .map((node) => <BookmarkItem>{
        node: node,
        icon: RedNodeKind[node!.kind],
        alt: getRedNodeKindName(node!.kind)
      })
      .sort((a, b) => {
        let delta: number = a.node.kind - b.node.kind;
        if (delta !== 0) {
          return delta;
        }

        return a.node.name.localeCompare(b.node.name);
      });
  });

  ngOnInit(): void {
    this.pageService.updateTitle(`NativeDB`);
  }

}
