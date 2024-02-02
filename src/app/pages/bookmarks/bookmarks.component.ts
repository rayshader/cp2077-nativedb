import {Component, OnInit} from '@angular/core';
import {RedDumpService} from "../../../shared/services/red-dump.service";
import {BookmarkService} from "../../../shared/services/bookmark.service";
import {combineLatest, map, Observable, of} from "rxjs";
import {getRedNodeKindName, RedNodeAst, RedNodeKind} from "../../../shared/red-ast/red-node.ast";
import {AsyncPipe} from "@angular/common";
import {MatIconModule} from "@angular/material/icon";
import {TypeSpanComponent} from "../../components/spans/type-span/type-span.component";
import {MatDividerModule} from "@angular/material/divider";
import {MatTooltipModule} from "@angular/material/tooltip";

interface BookmarkItem {
  readonly node: RedNodeAst;
  readonly icon: string;
  readonly alt: string;
}

@Component({
  selector: 'bookmarks',
  standalone: true,
  imports: [
    AsyncPipe,
    MatIconModule,
    MatTooltipModule,
    TypeSpanComponent,
    MatDividerModule
  ],
  templateUrl: './bookmarks.component.html',
  styleUrl: './bookmarks.component.scss'
})
export class BookmarksComponent implements OnInit {

  bookmarks$: Observable<BookmarkItem[]> = of([]);

  constructor(private readonly dumpService: RedDumpService,
              private readonly bookmarkService: BookmarkService) {
  }

  ngOnInit(): void {
    const bookmarks: number[] = this.bookmarkService.getAll();
    const bookmarks$ = bookmarks.map((id) => this.dumpService.getById(id));

    this.bookmarks$ = combineLatest(bookmarks$).pipe(
      map((nodes: (RedNodeAst | undefined)[]) => nodes
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
        })
      )
    );
  }

}
