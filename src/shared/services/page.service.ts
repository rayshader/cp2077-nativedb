import {Injectable} from "@angular/core";
import {debounceTime, Observable, Subject} from "rxjs";

@Injectable({
  providedIn: 'root'
})
export class PageService {

  private readonly scrollSubject: Subject<void> = new Subject();

  readonly scroll$: Observable<void> = this.scrollSubject.asObservable().pipe(debounceTime(200));

  restoreScroll(): void {
    // TODO: let user enable/disable auto scrolling to the top.
    this.scrollSubject.next();
  }

}
