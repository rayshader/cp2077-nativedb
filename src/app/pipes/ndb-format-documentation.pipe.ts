import {Pipe, PipeTransform} from '@angular/core';
import {DomSanitizer, SafeHtml} from "@angular/platform-browser";

@Pipe({
  name: 'ndbFormatDocumentation',
  standalone: true
})
export class NDBFormatDocumentationPipe implements PipeTransform {

  private static readonly LINK_RULE: RegExp = RegExp(/\[(?<type>[A-Za-z_-]*)]/g);

  constructor(private readonly sanitizer: DomSanitizer) {
  }

  transform(body: string): SafeHtml {
    const matches: RegExpMatchArray[] = [...body.matchAll(NDBFormatDocumentationPipe.LINK_RULE)];

    body = body.replaceAll('\n', '<br>');
    matches.reverse();
    for (const match of matches) {
      const type: string = match.groups!['type'];
      const $link: string = this.createLink(type);

      body = body.replace(match[0], $link);
    }
    return this.sanitizer.bypassSecurityTrustHtml(body);
  }

  private createLink(type: string): string {
    return `<a class="stx-type" title="Navigate to ${type}" data-route="/${type}">${type}</a>`;
  }

}
