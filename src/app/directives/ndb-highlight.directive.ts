import {Directive, ElementRef, HostBinding, HostListener} from '@angular/core';
import {ActivatedRoute, Router} from "@angular/router";

@Directive({
  selector: '[ndbHighlight]',
  standalone: true
})
export class NDBHighlightDirective {

  constructor(private readonly route: ActivatedRoute,
              private readonly router: Router,
              private readonly el: ElementRef) {
  }

  get id(): number {
    const $element: HTMLElement = this.el.nativeElement;

    return +$element.id;
  }

  @HostBinding('class.highlight')
  get isHighlight(): boolean {
    const fragment: number = parseInt(this.route.snapshot.fragment ?? '-1');

    return fragment === this.id;
  }

  @HostListener('mouseenter')
  onHover(): void {
    if (!this.isHighlight) {
      return;
    }
    this.router.navigateByUrl(window.location.pathname, {replaceUrl: true});
  }

  @HostListener('click')
  onTap(): void {
    if (!this.isHighlight) {
      return;
    }
    this.router.navigateByUrl(window.location.pathname, {replaceUrl: true});
  }

}
