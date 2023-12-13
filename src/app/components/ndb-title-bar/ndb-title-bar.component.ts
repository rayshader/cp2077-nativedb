import {Component, HostBinding, Input} from '@angular/core';
import {MatButtonModule} from "@angular/material/button";
import {MatIconModule} from "@angular/material/icon";
import {SettingsService} from "../../../shared/services/settings.service";
import {takeUntilDestroyed} from "@angular/core/rxjs-interop";
import {take} from "rxjs";
import {RedNodeAst} from "../../../shared/red-ast/red-node.ast";
import {BookmarkService} from "../../../shared/services/bookmark.service";
import {AsyncPipe} from "@angular/common";

@Component({
  selector: 'ndb-title-bar',
  standalone: true,
  imports: [
    MatButtonModule,
    MatIconModule,
    AsyncPipe
  ],
  templateUrl: './ndb-title-bar.component.html',
  styleUrl: './ndb-title-bar.component.scss'
})
export class NDBTitleBarComponent {

  @Input()
  title: string = '';

  @Input()
  hidden: boolean = false;

  isPinned: boolean = true;
  isBookmarked: boolean = false;

  constructor(private readonly settingsService: SettingsService,
              private readonly bookmarkService: BookmarkService) {
    this.settingsService.isBarPinned$.pipe(take(1), takeUntilDestroyed()).subscribe(this.onSettingsLoaded.bind(this));
  }

  protected _node?: RedNodeAst;

  @Input()
  set node(value: RedNodeAst) {
    this._node = value;
    this.isBookmarked = this.bookmarkService.isBookmarked(value);
  }

  @HostBinding('class.pin')
  get classPin(): boolean {
    return this.isPinned;
  }

  togglePin(): void {
    this.isPinned = !this.isPinned;
    this.settingsService.updateIsBarPinned(this.isPinned);
  }

  toggleBookmark(): void {
    if (!this._node) {
      return;
    }
    this.isBookmarked = !this.isBookmarked;
    this.bookmarkService.toggleBookmark(this._node);
  }

  private onSettingsLoaded(state: boolean): void {
    this.isPinned = state;
  }

}
