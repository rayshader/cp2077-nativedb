import {RedNodeAst, RedNodeKind} from "./red-node.ast";
import {cyrb53} from "../string";
import {RedPrimitiveDef, RedTemplateDef} from "./red-definitions.ast";
import {CodeSyntax} from "../services/settings.service";

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

  static toString(type: RedTypeAst, syntax?: CodeSyntax): string {
    let name: string = type.name;
    let str: string = '';

    if ((syntax === CodeSyntax.lua || syntax === CodeSyntax.redscript) && type.aliasName) {
      name = type.aliasName;
    }
    // TODO: ignore script_ref<T> when syntax is for Redscript / Lua ?
    if (type.innerType !== undefined) {
      str += `${type.name}<`;
      str += RedTypeAst.toString(type.innerType, syntax);
      if (type.size !== undefined) {
        str += `; ${type.size}`;
      }
      str += '>';
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
}
