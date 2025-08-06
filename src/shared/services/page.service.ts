import {Injectable} from "@angular/core";
import {debounceTime, Observable, Subject} from "rxjs";
import {SettingsService} from "./settings.service";
import {takeUntilDestroyed} from "@angular/core/rxjs-interop";

export type PageScrollBehavior = ScrollBehavior | 'disabled';

@Injectable({
  providedIn: 'root'
})
export class PageService {

  private readonly scrollSubject: Subject<PageScrollBehavior> = new Subject();
  private scrollBehavior: PageScrollBehavior = 'smooth';

  readonly scroll$: Observable<PageScrollBehavior> = this.scrollSubject.asObservable().pipe(debounceTime(200));

  constructor(private readonly settingsService: SettingsService) {
    this.settingsService.scrollBehavior$.pipe(takeUntilDestroyed()).subscribe(this.onScrollBehaviorChanged.bind(this));
  }

  restoreScroll(): void {
    if (this.scrollBehavior === 'disabled') {
      return;
    }
    this.scrollSubject.next(this.scrollBehavior);
  }

  updateTitle(title: string): void {
    const $title = document.querySelector('head title')! as HTMLTitleElement;
    $title.textContent = title;
  }

  private onScrollBehaviorChanged(behavior: PageScrollBehavior): void {
    this.scrollBehavior = behavior;
  }

}
