import {Pipe, PipeTransform} from '@angular/core';
import {DomSanitizer, SafeHtml} from "@angular/platform-browser";
import {RedPrimitiveDef, RedTemplateDef} from "../../shared/red-ast/red-definitions.ast";
import {cyrb53} from "../../shared/string";

interface Rule {
  readonly regex: RegExp;
  readonly format: (match: RegExpMatchArray, body: string) => string;
}

@Pipe({
  name: 'ndbFormatDocumentation',
  standalone: true
})
export class NDBFormatDocumentationPipe implements PipeTransform {

  private static readonly LINK_RULE: RegExp = RegExp(/\[(?<member>((?<local>this)|(?<class>[A-Za-z_]+))\.)?(?<type>[A-Za-z0-9 :_-]+)]/g);
  private static readonly URL_RULE: RegExp = RegExp(/\[(?<title>[^\]]+)]\((?<url>https:\/\/\S+\.[^()]+(?:\([^)]*\))*)\)/g);
  private static readonly CODE_RULE: RegExp = RegExp(/(?<start>`{1,3})(?<language>swift|lua)?(?<code>[^`]*)(?<end>`{1,3})/g);
  private static readonly PRIMITIVES: string[] = [];

  private readonly rules: Rule[] = [
    {regex: NDBFormatDocumentationPipe.URL_RULE, format: this.formatUrlRule.bind(this)},
    {regex: NDBFormatDocumentationPipe.LINK_RULE, format: this.formatLinkRule.bind(this)},
    {regex: NDBFormatDocumentationPipe.CODE_RULE, format: this.formatCodeRule.bind(this)},
  ];

  constructor(private readonly sanitizer: DomSanitizer) {
    if (NDBFormatDocumentationPipe.PRIMITIVES.length === 0) {
      for (let i = RedPrimitiveDef.Void; i <= RedTemplateDef.multiChannelCurve; i++) {
        if (i <= RedPrimitiveDef.Variant) {
          NDBFormatDocumentationPipe.PRIMITIVES.push(RedPrimitiveDef[i]);
        } else {
          NDBFormatDocumentationPipe.PRIMITIVES.push(RedTemplateDef[i]);
        }
      }
    }
  }

  transform(body: string): SafeHtml {
    body = body.replaceAll('\n', '<br>');
    for (const rule of this.rules) {
      const matches: RegExpMatchArray[] = [...body.matchAll(rule.regex)];

      matches.reverse();
      for (const match of matches) {
        body = rule.format(match, body);
      }
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

  private formatCodeRule(match: RegExpMatchArray, body: string): string {
    const code: string = match.groups!['code'];
    const $block: string = `<pre>${code}</pre>`;

    return body.replace(match[0], $block);
  }

  private createLink(type: string): string {
    const isPrimitive: boolean = NDBFormatDocumentationPipe.PRIMITIVES.some((primitive) => primitive === type);

    if (isPrimitive) {
      return `<span class="stx-primitive-type">${type}</span>`;
    }
    return `<a class="stx-type" title="Navigate to ${type}" data-route="/${type}" data-name="only">${type}</a>`;
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
