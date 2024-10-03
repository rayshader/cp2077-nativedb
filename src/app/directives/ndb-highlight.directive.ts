import {DestroyRef, Directive, ElementRef, HostBinding, HostListener, OnInit} from '@angular/core';
import {ActivatedRoute, Router} from "@angular/router";
import {takeUntilDestroyed} from "@angular/core/rxjs-interop";

@Directive({
  selector: '[ndbHighlight]',
  standalone: true
})
export class NDBHighlightDirective implements OnInit {

  @HostBinding('class.highlight')
  isHighlight: boolean = false;

  constructor(private readonly route: ActivatedRoute,
              private readonly router: Router,
              private readonly dr: DestroyRef,
              private readonly el: ElementRef) {
  }

  get id(): number {
    const $element: HTMLElement = this.el.nativeElement;

    return +$element.id;
  }

  ngOnInit(): void {
    this.route.fragment.pipe(
      takeUntilDestroyed(this.dr)
    ).subscribe((fragment) => {
      const id: number = parseInt(fragment ?? '-1');

      this.isHighlight = id === this.id;
    });
  }

  @HostListener('mouseenter')
  @HostListener('click')
  onHover(): void {
    if (!this.isHighlight) {
      return;
    }
    const url: string = this.getUrlWithoutFragment();

    this.router.navigateByUrl(url, {replaceUrl: true});
    this.isHighlight = false;
  }

  private getUrlWithoutFragment(): string {
    const url: string = this.router.url;

    if (url.indexOf('#') === -1) {
      return url;
    }
    return url.substring(0, url.indexOf('#'));
  }

}
