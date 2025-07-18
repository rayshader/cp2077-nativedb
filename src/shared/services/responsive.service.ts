import {Injectable, signal} from "@angular/core";

@Injectable({
  providedIn: 'root'
})
export class ResponsiveService {

  private readonly mediaQuery: MediaQueryList;

  readonly isMobile = signal<boolean>(false);

  constructor() {
    this.onWidthChanged();
    this.mediaQuery = window.matchMedia('(max-width: 1025px)');
    this.mediaQuery.addEventListener('change', this.onWidthChanged.bind(this));
  }

  private onWidthChanged(): void {
    this.isMobile.set(document.body.clientWidth < 1025);
  }

}
