import {RedNodeAst, RedNodeKind} from "./red-node.ast";
import {cyrb53} from "../string";
import {RedPrimitiveDef, RedTemplateDef} from "./red-definitions.ast";
import {CodeSyntax} from "../services/settings.service";
import {LuaPrimitiveDef} from "../formatters/lua.formatter";

export interface RedTypeJson {
  readonly a?: number; // flag
  readonly b?: string; // name
  readonly c?: RedTypeJson; // inner type
  readonly d?: number; // array size
}

export interface RedTypeAst extends RedNodeAst {
  readonly flag?: RedPrimitiveDef | RedTemplateDef;
  readonly innerType?: RedTypeAst;
  readonly size?: number;
}

export class RedTypeAst {
  static isPrimitive(type: RedTypeAst): boolean {
    return type.flag !== undefined && type.flag >= RedPrimitiveDef.Void && type.flag <= RedPrimitiveDef.Variant;
  }

  static isTemplate(type: RedTypeAst): boolean {
    return type.flag !== undefined && type.flag >= RedTemplateDef.ref && type.flag <= RedTemplateDef.multiChannelCurve;
  }

  static testType(type: RedTypeAst, rule: RegExp): boolean {
    if (RedTypeAst.isPrimitive(type)) {
      return false;
    }
    if (type.innerType) {
      return this.testType(type.innerType, rule);
    }
    const name: string = type.name.toLowerCase();
    const aliasName: string | undefined = type.aliasName?.toLowerCase();

    return rule.test(name) || (!!aliasName && rule.test(aliasName));
  }

  static hasType(type: RedTypeAst, words: string[]): boolean {
    if (RedTypeAst.isPrimitive(type)) {
      return false;
    }
    if (type.innerType) {
      return this.hasType(type.innerType, words);
    }
    const name: string = type.name.toLowerCase();
    const aliasName: string | undefined = type.aliasName?.toLowerCase();

    return words.every((word) => name.includes(word)) ||
      (!!aliasName && words.every((word) => aliasName.includes(word)));
  }

  static primitiveToString(flag: RedPrimitiveDef): string {
    return RedPrimitiveDef[flag];
  }

  static templateToString(flag: RedTemplateDef): string {
    switch (flag) {
      case RedTemplateDef.ref:
        return 'handle';
      case RedTemplateDef.wref:
        return 'whandle';
      case RedTemplateDef.ResRef:
        return 'rRef';
      case RedTemplateDef.ResAsyncRef:
        return 'raRef';
      default:
        return RedTemplateDef[flag];
    }
  }

  static primitiveToLuadoc(flag: RedPrimitiveDef): string {
    // @ts-ignore
    return LuaPrimitiveDef[RedPrimitiveDef[flag]];
  }

  static toString(type: RedTypeAst, syntax?: CodeSyntax): string {
    let name: string = type.name;
    let str: string = '';

    if ((syntax === CodeSyntax.lua || syntax === CodeSyntax.redscript) && type.aliasName) {
      name = type.aliasName;
    }
    if (type.innerType !== undefined) {
      if (syntax === CodeSyntax.pseudocode) {
        if (this.isPrimitive(type)) {
          name = this.primitiveToString(type.flag as RedPrimitiveDef);
        } else if (this.isTemplate(type)) {
          name = this.templateToString(type.flag as RedTemplateDef);
        }
        if (type.size === undefined) {
          str += `${name}:`;
        } else {
          str += `[${type.size}]`;
        }
      } else {
        if (type.size === undefined) {
          str += `${name}<`;
        } else {
          str += '[';
        }
      }
      str += RedTypeAst.toString(type.innerType, syntax);
      if (type.size !== undefined && syntax !== CodeSyntax.pseudocode) {
        str += `; ${type.size}`;
      }
      if (syntax !== CodeSyntax.pseudocode) {
        str += (type.size === undefined) ? '>' : ']';
      }
    } else {
      str = name;
    }
    return str;
  }

  static toLuadoc(type: RedTypeAst): string {
    let name: string = type.name;
    let str: string = '';

    if (type.aliasName) {
      name = type.aliasName;
    }
    if (this.isPrimitive(type)) {
      name = this.primitiveToLuadoc(type.flag as RedPrimitiveDef);
    } else if (this.isTemplate(type)) {
      name = '';
    }
    if (type.innerType !== undefined) {
      str += name;
      str += RedTypeAst.toLuadoc(type.innerType);
      if (type.flag === RedTemplateDef.array) {
        str += '[]';
      }
    } else {
      str = name;
    }
    return str;
  }

  static fromJson(json: RedTypeJson): RedTypeAst {
    const flag: RedPrimitiveDef | RedTemplateDef | undefined = json.a;
    const name: string = (flag === undefined) ? json.b! : ((flag <= RedPrimitiveDef.Variant) ? RedPrimitiveDef[flag] : RedTemplateDef[flag]);

    return {
      id: cyrb53(name),
      kind: RedNodeKind.type,
      name: name,
      flag: flag,
      innerType: (json.c !== undefined) ? RedTypeAst.fromJson(json.c) : undefined,
      size: json.d,
    };
  }

  static loadAlias(nodes: RedNodeAst[], type: RedTypeAst): void {
    if (this.isPrimitive(type)) {
      return;
    }
    if (type.innerType) {
      return this.loadAlias(nodes, type.innerType);
    }
    const alias: RedNodeAst | undefined = nodes.find((node) => node.name === type.name);

    if (!alias) {
      return;
    }
    type.aliasName = alias.aliasName;
  }

  static fromPseudocode(code: string): RedTypeAst | undefined {
    const tokens: string[] = code.split(':').reverse();
    let currentType: RedTypeAst | undefined = undefined;
    let innerType: RedTypeAst | undefined = undefined;

    for (const token of tokens) {
      const innerDef: any = {};
      const primitiveDef: RedPrimitiveDef | undefined = this.pseudocodeToPrimitive(token);
      const templateDef: RedTemplateDef | undefined = this.pseudocodeToTemplate(token, innerDef);
      let name: string;

      if (primitiveDef !== undefined) {
        name = RedPrimitiveDef[primitiveDef];
      } else if (templateDef !== undefined) {
        name = RedTemplateDef[templateDef];
      } else {
        name = token;
      }
      currentType = {
        id: cyrb53(name),
        kind: RedNodeKind.type,
        name: name,
        flag: primitiveDef || templateDef,
        innerType: innerType,
        size: innerDef?.size
      };
      innerType = currentType;
    }
    return currentType;
  }

  static pseudocodeToPrimitive(code: string): RedPrimitiveDef | undefined {
    try {
      return RedPrimitiveDef[code as keyof typeof RedPrimitiveDef];
    } catch (error) {
      return undefined;
    }
  }

  static pseudocodeToTemplate(code: string, innerDef: any): RedTemplateDef | undefined {
    const staticArrayMatch: RegExpMatchArray | null = code.match(/\\\\\[(?<size>[0-9]+)].*/);

    if (staticArrayMatch) {
      innerDef.size = +staticArrayMatch.groups!['size'];
      return RedTemplateDef.array;
    }
    switch (code) {
      case 'handle':
        return RedTemplateDef.ref;
      case 'whandle':
        return RedTemplateDef.wref;
      case 'rRef':
        return RedTemplateDef.ResRef;
      case 'raRef':
        return RedTemplateDef.ResAsyncRef;
      default:
        try {
          return RedTemplateDef[code as keyof typeof RedTemplateDef];
        } catch (error) {
          return undefined;
        }
    }
  }

}
