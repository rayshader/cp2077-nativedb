import {Pipe, PipeTransform} from '@angular/core';
import {DomSanitizer, SafeHtml} from "@angular/platform-browser";
import {RedPrimitiveDef} from "../../shared/red-ast/red-definitions.ast";
import {cyrb53} from "../../shared/string";

@Pipe({
  name: 'ndbFormatDocumentation',
  standalone: true
})
export class NDBFormatDocumentationPipe implements PipeTransform {

  private static readonly LINK_RULE: RegExp = RegExp(/\[(?<member>((?<local>this)|(?<class>[A-Za-z_]+))\.)?(?<type>[A-Za-z0-9_-]+)]/g);
  private static readonly URL_RULE: RegExp = RegExp(/\[(?<title>[^\]]+)]\((?<url>https:\/\/\S+\.[^()]+(?:\([^)]*\))*)\)/g);
  private static readonly PRIMITIVES: string[] = [];

  constructor(private readonly sanitizer: DomSanitizer) {
    if (NDBFormatDocumentationPipe.PRIMITIVES.length === 0) {
      for (let i = RedPrimitiveDef.Void; i <= RedPrimitiveDef.Variant; i++) {
        NDBFormatDocumentationPipe.PRIMITIVES.push(RedPrimitiveDef[i]);
      }
    }
  }

  transform(body: string): SafeHtml {
    body = body.replaceAll('\n', '<br>');
    let matches: RegExpMatchArray[];

    matches = [...body.matchAll(NDBFormatDocumentationPipe.URL_RULE)];
    matches.reverse();
    for (const match of matches) {
      body = this.formatUrlRule(match, body);
    }
    matches = [...body.matchAll(NDBFormatDocumentationPipe.LINK_RULE)];
    matches.reverse();
    for (const match of matches) {
      body = this.formatLinkRule(match, body);
    }
    return this.sanitizer.bypassSecurityTrustHtml(body);
  }

  private formatUrlRule(match: RegExpMatchArray, body: string): string {
    const title: string = match.groups!['title'];
    const url: string = match.groups!['url'];
    const $link: string = `<a class="stx-lang" href="${url}" target="_blank">${title}</a>`;

    return body.replace(match[0], $link);
  }

  private formatLinkRule(match: RegExpMatchArray, body: string): string {
    const isMember: boolean = match.groups!['member']?.includes('.');
    const isLocal: boolean = match.groups!['local'] === 'this';
    const memberOf: string = match.groups!['class'];
    const type: string = match.groups!['type'];
    let $link: string;

    if (!isMember) {
      $link = this.createLink(type);
    } else {
      if (isLocal) {
        $link = this.createLocalLink(type);
      } else {
        $link = this.createMemberOfLink(type, memberOf);
      }
    }
    return body.replace(match[0], $link);
  }

  private createLink(type: string): string {
    const isPrimitive: boolean = NDBFormatDocumentationPipe.PRIMITIVES.some((primitive) => primitive === type);

    if (isPrimitive) {
      return `<span class="stx-type">${type}</span>`;
    }
    return `<a class="stx-type" title="Navigate to ${type}" data-route="/${type}">${type}</a>`;
  }

  private createLocalLink(type: string): string {
    const uri: string = `${window.location.pathname}#${cyrb53(type)}`;

    return `<a class="stx-type" title="Navigate to ${type}" data-route="${uri}">${type}</a>`;
  }

  private createMemberOfLink(type: string, memberOf: string): string {
    const uri: string = `/${memberOf}#${cyrb53(type)}`;

    return `<a class="stx-type" title="Navigate to ${type} of ${memberOf}" data-route="${uri}">${memberOf}.${type}</a>`;
  }

}
