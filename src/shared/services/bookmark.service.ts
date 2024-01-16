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

  isBookmarked(id: number): boolean {
    return this.bookmarks.find((bookmarkId) => bookmarkId === id) !== undefined;
  }

  toggleBookmark(id: number): void {
    let bookmark: boolean = this.isBookmarked(id);

    if (!bookmark) {
      this.bookmarks.push(id);
    } else {
      const i: number = this.bookmarks.indexOf(id);

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
