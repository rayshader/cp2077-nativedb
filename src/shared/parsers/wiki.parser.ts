import {Injectable} from "@angular/core";
import {marked, Token, Tokens, TokensList} from "marked";
import {WikiClassDto, WikiFileDto, WikiFunctionDto, WikiGlobalDto} from "../dtos/wiki.dto";
import {cyrb53} from "../string";
import {RedTypeAst} from "../red-ast/red-type.ast";
import ListItem = Tokens.ListItem;

@Injectable({
  providedIn: 'root'
})
export class WikiParser {

  private readonly prototypeRule: RegExp = new RegExp(/(?<name>[A-Za-z_0-9]+)\((?<args>.*)\) -> (?<returnType>Void|.+)/);
  private readonly argumentRule: RegExp = new RegExp(/((?<flag>(const|out|opt) )?(?<name>[A-Za-z0-9_]+): ?[A-Za-z0-9_\\\[\]:]+,?)*/g);

  private readonly hintRule: RegExp = new RegExp(/\{% hint style="(info|success|warning|danger)" %}\n.*\n\{% endhint %}/gm);

  public parseClass(file: WikiFileDto, name: string): WikiClassDto {
    const tokens: TokensList = marked.lexer(file.markdown, {gfm: true});
    const stream: WikiTokenStream = new WikiTokenStream(tokens);
    const headerTitle: Tokens.Heading | undefined = stream.nextHeading(1);

    if (!headerTitle) {
      throw new WikiParserError(name, WikiParserErrorCode.noTitle);
    }
    const headerDescription: Tokens.Heading | undefined = stream.nextHeading(2, true);
    const comment: string = this.parseDescription(stream, headerDescription);
    const headerFunctions: Tokens.Heading | undefined = stream.nextHeading(2, true);
    let functions: WikiFunctionDto[] = [];

    if (this.isFunctions(headerFunctions)) {
      stream.nextHeading(2);
      functions = this.parseFunctions(stream);
    }
    if (!headerDescription && !headerFunctions) {
      throw new WikiParserError(name, WikiParserErrorCode.noContent);
    }
    return {
      id: cyrb53(name),
      sha: file.sha,
      name: name,
      comment: comment,
      functions: functions
    };
  }

  public parseGlobals(file: WikiFileDto): WikiGlobalDto[] {
    const tokens: TokensList = marked.lexer(file.markdown, {gfm: true});
    const stream: WikiTokenStream = new WikiTokenStream(tokens);
    const headerTitle: Tokens.Heading | undefined = stream.nextHeading(1);

    if (!headerTitle) {
      throw new WikiParserError('GLOBALS', WikiParserErrorCode.noTitle);
    }
    const functions: WikiFunctionDto[] = this.parseFunctions(stream);

    return functions.map((func) => {
      return {
        ...func,
        sha: file.sha
      };
    });
  }

  private parseDescription(stream: WikiTokenStream, header?: Tokens.Heading): string {
    if (!this.isDescription(header)) {
      return '';
    }
    stream.nextHeading(2);
    let description: string = '';

    while (stream.hasNext()) {
      const token: Token = stream.next(true);

      if (this.isFunctions(token)) {
        break;
      }
      const text: string = this.parseAsText(stream.next());

      if (!(text === '\n\n' && description.endsWith('\n\n'))) {
        description += text;
      }
    }
    return description.trim();
  }

  private parseFunctions(stream: WikiTokenStream): WikiFunctionDto[] {
    const functions: WikiFunctionDto[] = [];

    while (stream.hasNext()) {
      const token: Tokens.Heading | undefined = stream.nextHeading(4, true);

      if (!token) {
        break;
      }
      const headerFunction: Tokens.Heading = stream.nextHeading(4)!;
      const method: WikiFunctionDto | undefined = this.parseFunction(stream, headerFunction);

      if (method) {
        functions.push(method);
      }
    }
    return functions;
  }

  private parseFunction(stream: WikiTokenStream, header: Tokens.Heading): WikiFunctionDto | undefined {
    const prototype: string = header.text;
    const rule: RegExpMatchArray | null = prototype.match(this.prototypeRule);

    if (!rule || !rule.groups) {
      return undefined;
    }
    const name: string = rule.groups!['name'];
    let comment: string = '';

    while (stream.hasNext()) {
      const token: Token = stream.next(true);

      if (this.isFunction(token)) {
        break;
      }
      const text: string = this.parseAsText(stream.next());

      if (!(text === '\n\n' && comment.endsWith('\n\n'))) {
        comment += text;
      }
    }
    comment = comment.trim();
    return {
      id: this.computeHashFromPrototype(rule),
      name: name,
      comment: comment
    };
  }

  private parseAsText(token: Token): string {
    switch (token.type) {
      case 'paragraph':
        if (token.text.match(this.hintRule)) {
          return '';
        }
        return this.sanitizeText(token.text);
      case 'list':
        const items: string = token.items
          .map((item: ListItem) => `- ${item.text}`)
          .join('\n');

        return this.sanitizeText(items);
      case 'space':
        return '\n\n';
      default:
        return '';
    }
  }

  private isDescription(token?: Token): boolean {
    return this.isHeader('Description', token);
  }

  private isFunctions(token?: Token): boolean {
    return this.isHeader('Functions', token);
  }

  private isFunction(token: Token): boolean {
    return token.type === 'heading' && token.depth === 4;
  }

  private isHeader(text: string, token?: Token): boolean {
    if (!token) {
      return false;
    }
    return token.type === 'heading' && token.depth === 2 && token.text.trim().toLowerCase() === text.trim().toLowerCase();
  }

  private sanitizeText(text: string): string {
    text = text.replaceAll(/\\(?<symbol>[!"#$%&'()*+,\-./:;<=>?@\[\\\]^_{|}~`])/gm, '$<symbol>');
    return text;
  }

  private computeHashFromPrototype(prototypeMatch: RegExpMatchArray): number {
    const name: string = prototypeMatch.groups!['name'];
    const args: string[] = [];
    const argsMatch: IterableIterator<RegExpExecArray> = prototypeMatch.groups!['args'].matchAll(this.argumentRule);

    for (const argMatch of argsMatch) {
      const name: string | undefined = argMatch.groups?.['name'];

      if (name !== undefined) {
        args.push(name);
      }
    }
    const returnType: RedTypeAst | undefined = RedTypeAst.fromPseudocode(prototypeMatch.groups!['returnType']);
    let signature: string = name;

    signature += args.join(',');
    signature += returnType ? RedTypeAst.toString(returnType) : 'Void';
    return cyrb53(signature);
  }
}

export class WikiTokenStream {

  private index: number = 0;

  constructor(private readonly tokens: TokensList) {
  }

  public hasNext(): boolean {
    return this.index < this.tokens.length;
  }

  public next<T = Token>(shallow: boolean = false): T {
    if (shallow) {
      return this.tokens[this.index] as T;
    }
    return this.tokens[this.index++] as T;
  }

  public nextHeading(level: number, shallow: boolean = false): Tokens.Heading | undefined {
    if (!this.hasNext()) {
      return undefined;
    }
    const token: Tokens.Heading = this.next<Tokens.Heading>(shallow);

    if (token.type !== 'heading') {
      return undefined;
    }
    if (token.depth !== level) {
      return undefined;
    }
    return token;
  }

}

export enum WikiParserErrorCode {
  noTitle,
  noContent
}

export class WikiParserError extends Error {

  constructor(public readonly className: string,
              public readonly code: WikiParserErrorCode) {
    super();
  }

}
