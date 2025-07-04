import {
  booleanAttribute,
  ChangeDetectionStrategy,
  Component,
  computed,
  effect,
  HostBinding,
  input,
  output,
  signal
} from '@angular/core';
import {MatButtonModule} from "@angular/material/button";
import {MatIconModule} from "@angular/material/icon";
import {Settings, SettingsService} from "../../../shared/services/settings.service";
import {takeUntilDestroyed} from "@angular/core/rxjs-interop";
import {take} from "rxjs";
import {RedNodeAst, RedNodeKind} from "../../../shared/red-ast/red-node.ast";
import {BookmarkService} from "../../../shared/services/bookmark.service";
import {MatTooltipModule} from "@angular/material/tooltip";
import {FilterBy, SearchService} from "../../../shared/services/search.service";

@Component({
  selector: 'ndb-title-bar',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    MatIconModule,
    MatButtonModule,
    MatTooltipModule
  ],
  templateUrl: './ndb-title-bar.component.html',
  styleUrl: './ndb-title-bar.component.scss'
})
export class NDBTitleBarComponent {

  readonly node = input<RedNodeAst | undefined>();
  readonly title = input.required<string>();
  readonly altTitle = input<string | undefined>();
  readonly hideDocumentation = input(false, {transform: booleanAttribute});
  readonly hasDocumentation = input(false, {transform: booleanAttribute});
  readonly hidden = input(false, {transform: booleanAttribute});

  readonly toggleDocumentation = output<void>();

  @HostBinding('class.pin')
  isPinned: boolean = true;

  useMarkdown: boolean = true;

  readonly isBookmarked = signal<boolean>(false);
  readonly canSearchByUsage = computed(() => {
    const node: RedNodeAst | undefined = this.node();

    return node && node.kind !== RedNodeKind.function;
  });

  protected readonly RedNodeKind = RedNodeKind;

  constructor(private readonly settingsService: SettingsService,
              private readonly bookmarkService: BookmarkService,
              private readonly searchService: SearchService) {
    this.settingsService.settings$.pipe(take(1), takeUntilDestroyed()).subscribe(this.onSettingsLoaded.bind(this));
    effect(() => {
      const node: RedNodeAst | undefined = this.node();

      if (!node) {
        return;
      }
      this.bookmarkService.isBookmarked(node.id);
    });
  }

  copyAltTitle(): void {
    const altTitle: string | undefined = this.altTitle();

    if (!altTitle) {
      return;
    }
    navigator.clipboard.writeText(altTitle);
  }

  searchByUsage(): void {
    this.searchService.requestSearch(this.title(), FilterBy.usage, true);
  }

  copyUrl(): void {
    const title: string = this.title();
    let data: string = `${window.location.origin}/${title}`;

    if (this.useMarkdown) {
      data = `[${title}](${data})`;
    }
    navigator.clipboard.writeText(data);
  }

  toggleBookmark(): void {
    const node: RedNodeAst | undefined = this.node();

    if (!node) {
      return;
    }
    this.isBookmarked.set(!this.isBookmarked);
    this.bookmarkService.toggleBookmark(node.id);
  }

  togglePin(): void {
    this.isPinned = !this.isPinned;
    this.settingsService.updateIsBarPinned(this.isPinned);
  }

  private onSettingsLoaded(settings: Settings): void {
    this.isPinned = settings.isBarPinned;
    this.useMarkdown = settings.formatShareLink;
  }
}
