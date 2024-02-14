import {Component, EventEmitter, HostBinding, Input, Output} from '@angular/core';
import {MatButtonModule} from "@angular/material/button";
import {MatIconModule} from "@angular/material/icon";
import {SettingsService} from "../../../shared/services/settings.service";
import {takeUntilDestroyed} from "@angular/core/rxjs-interop";
import {take} from "rxjs";
import {RedNodeAst} from "../../../shared/red-ast/red-node.ast";
import {BookmarkService} from "../../../shared/services/bookmark.service";
import {AsyncPipe} from "@angular/common";
import {MatTooltipModule} from "@angular/material/tooltip";

@Component({
  selector: 'ndb-title-bar',
  standalone: true,
  imports: [
    AsyncPipe,
    MatIconModule,
    MatButtonModule,
    MatTooltipModule
  ],
  templateUrl: './ndb-title-bar.component.html',
  styleUrl: './ndb-title-bar.component.scss'
})
export class NDBTitleBarComponent {

  @Input()
  title: string = '';

  @Input()
  altTitle?: string;

  @Input()
  hideDocumentation: boolean = false;

  @Input()
  hasDocumentation: boolean = false;

  @Input()
  hidden: boolean = false;

  @Output()
  toggleDocumentation: EventEmitter<void> = new EventEmitter();

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
    this.isBookmarked = this.bookmarkService.isBookmarked(value.id);
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
    this.bookmarkService.toggleBookmark(this._node.id);
  }

  copyAltTitle(): void {
    if (!this.altTitle) {
      return;
    }
    navigator.clipboard.writeText(this.altTitle);
  }

  copyUrl(): void {
    const data: string = `${window.location.origin}/${this.title}`;

    navigator.clipboard.writeText(data);
  }

  private onSettingsLoaded(state: boolean): void {
    this.isPinned = state;
  }

}
