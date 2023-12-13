import {Injectable} from "@angular/core";
import {RedNodeAst} from "../red-ast/red-node.ast";

@Injectable({
  providedIn: 'root'
})
export class BookmarkService {

  private readonly bookmarks: number[] = [];

  constructor() {
    const json: string = localStorage.getItem('bookmarks') ?? '[]';

    this.bookmarks.push(...JSON.parse(json));
  }

  getAll(): number[] {
    return this.bookmarks;
  }

  isBookmarked(node: RedNodeAst): boolean {
    return this.bookmarks.find((id) => id === node.id) !== undefined;
  }

  toggleBookmark(node: RedNodeAst): void {
    let bookmark: boolean = this.isBookmarked(node);

    if (!bookmark) {
      this.bookmarks.push(node.id);
    } else {
      const i: number = this.bookmarks.indexOf(node.id);

      if (i >= 0) {
        this.bookmarks.splice(i, 1);
      }
    }
    this.save();
  }

  private save(): void {
    const json: string = JSON.stringify(this.bookmarks);

    localStorage.setItem('bookmarks', json);
  }

}
