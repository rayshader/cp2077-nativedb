import {AfterViewInit, Component, ElementRef, HostListener, ViewChild} from '@angular/core';
import {MatFormFieldModule} from "@angular/material/form-field";
import {MatInputModule} from "@angular/material/input";
import {NDBFormatDocumentationPipe} from "../../../pipes/ndb-format-documentation.pipe";
import {FormControl, ReactiveFormsModule} from "@angular/forms";
import {TextFieldModule} from "@angular/cdk/text-field";
import {DomSanitizer, SafeHtml} from "@angular/platform-browser";
import {Router} from "@angular/router";

@Component({
  selector: 'ndb-guideline',
  standalone: true,
  imports: [
    MatInputModule,
    TextFieldModule,
    MatFormFieldModule,
    ReactiveFormsModule,
    NDBFormatDocumentationPipe
  ],
  templateUrl: './ndb-guideline.component.html',
  styleUrl: './ndb-guideline.component.scss'
})
export class NDBGuidelineComponent implements AfterViewInit {

  private static readonly NEWLINE: string = String.fromCharCode(8);

  @ViewChild('example', {static: true})
  example?: ElementRef;

  readonly help: FormControl<string | null> = new FormControl<string>('');

  private readonly formatDocumentation: NDBFormatDocumentationPipe;

  constructor(private readonly router: Router,
              sanitizer: DomSanitizer) {
    this.formatDocumentation = new NDBFormatDocumentationPipe(sanitizer);
  }

  ngAfterViewInit(): void {
    if (!this.example) {
      return;
    }
    const $container: HTMLParagraphElement = this.example.nativeElement;
    const $example: HTMLParagraphElement | null = $container.querySelector('p');

    if (!$example) {
      return;
    }
    let text: string = $example.textContent ?? '';

    if (!text) {
      return;
    }
    text = text.trim();
    text = this.replaceNewline(text, '\n');
    this.help.setValue(text);
    const html: SafeHtml = this.formatDocumentation.transform(text);

    // @ts-ignore
    text = html.changingThisBreaksApplicationSecurity.trim();
    $container.innerHTML = text;
  }

  @HostListener('click', ['$event'])
  onLinkClicked(event: Event): void {
    const $element: HTMLElement = event.target as HTMLElement;

    if ($element.tagName !== 'A') {
      return;
    }
    let route: string | null = $element.getAttribute('data-route');

    if (!route) {
      return;
    }
    const isLocal: boolean = route.startsWith(window.location.pathname);

    if (isLocal) {
      $element.scrollIntoView({block: 'center'});
    }
    const nameOnly: boolean = $element.getAttribute('data-name') === 'only';

    if (nameOnly) {
      route += '?name=only';
    }
    this.router.navigateByUrl(route, {replaceUrl: isLocal});
  }

  private replaceNewline(text: string, char: string): string {
    text = text.replaceAll(`${NDBGuidelineComponent.NEWLINE} `, char);
    return text;
  }

}
