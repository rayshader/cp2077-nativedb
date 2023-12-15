import {Injectable} from "@angular/core";
import {BehaviorSubject, Observable} from "rxjs";

@Injectable({
  providedIn: 'root'
})
export class ResponsiveService {

  private readonly mediaQuery: MediaQueryList;
  private readonly mobileSubject: BehaviorSubject<boolean> = new BehaviorSubject(false);

  readonly mobile$: Observable<boolean> = this.mobileSubject.asObservable();

  constructor() {
    this.onWidthChanged();
    this.mediaQuery = window.matchMedia('(max-width: 1025px)');
    this.mediaQuery.addEventListener('change', this.onWidthChanged.bind(this));
  }

  private onWidthChanged(): void {
    this.mobileSubject.next(document.body.clientWidth < 1025);
  }

}
