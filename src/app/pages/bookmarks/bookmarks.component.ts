import {Component, OnInit} from '@angular/core';
import {RedDumpService} from "../../../shared/services/red-dump.service";
import {BookmarkService} from "../../../shared/services/bookmark.service";
import {delay, filter, map, mergeAll, Observable, of, scan, switchMap} from "rxjs";
import {getRedNodeKindName, RedNodeAst, RedNodeKind} from "../../../shared/red-ast/red-node.ast";
import {AsyncPipe} from "@angular/common";
import {MatIconModule} from "@angular/material/icon";
import {TypeSpanComponent} from "../../components/spans/type-span/type-span.component";

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
    TypeSpanComponent
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

    this.bookmarks$ = of(bookmarks).pipe(
      delay(1),
      mergeAll(),
      switchMap((id) => this.dumpService.getById(id)),
      filter((node) => node !== undefined),
      map((node) => <BookmarkItem>{
        node: node,
        icon: RedNodeKind[node!.kind],
        alt: getRedNodeKindName(node!.kind)
      }),
      scan((nodes: BookmarkItem[], node) => [...nodes, node], []),
      map((bookmarks) => {
        bookmarks.sort((a, b) => {
          let delta: number = a.node.kind - b.node.kind;

          if (delta !== 0) {
            return delta;
          }
          return a.node.name.localeCompare(b.node.name);
        });
        return bookmarks;
      })
    );
  }

}
