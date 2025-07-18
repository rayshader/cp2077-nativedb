import {inject, Injectable, Signal, signal} from "@angular/core";
import {SettingsService} from "./settings.service";

export type PageScrollBehavior = ScrollBehavior | 'disabled';

@Injectable({
  providedIn: 'root'
})
export class PageService {

  private readonly settingsService: SettingsService = inject(SettingsService);

  private readonly _scroll = signal<PageScrollBehavior>('disabled', {equal: () => false});
  private readonly _behavior: Signal<PageScrollBehavior> = this.settingsService.scrollBehavior;

  readonly scroll: Signal<PageScrollBehavior> = this._scroll;

  restoreScroll(): void {
    const behavior: PageScrollBehavior = this._behavior();
    if (behavior === 'disabled') {
      return;
    }

    this._scroll.set(behavior);
  }

  updateTitle(title: string): void {
    const $title = document.querySelector('head title')! as HTMLTitleElement;
    $title.textContent = title;
  }

}
