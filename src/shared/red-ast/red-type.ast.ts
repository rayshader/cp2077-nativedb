import {RedNodeAst, RedNodeKind} from "./red-node.ast";
import {cyrb53} from "../string";

export interface RedTypeJson {
  readonly a: string; // name
  readonly b?: RedTypeJson; // inner type
  readonly c?: number; // array size
}

export interface RedTypeAst extends RedNodeAst {
  //readonly name: string;
  readonly innerType?: RedTypeAst;
  readonly size?: number;
}

export class RedTypeAst {
  static readonly PRIMITIVE_RULE = RegExp(
    "^(Void|Bool|Int8|Uint8|Int16|Uint16|Int32|Uint32|Int64|Uint64|Float|Double|String|LocalizationString|CName|ResRef|TweakDBID|Variant)$"
  );

  static isPrimitive(type: RedTypeAst): boolean {
    return this.PRIMITIVE_RULE.test(type.name);
  }

  static toString(type: RedTypeAst): string {
    let str: string = '';

    // TODO: ignore script_ref<T> when syntax is for Redscript / Lua ?
    if (type.innerType !== undefined) {
      str += `${type.name}<`;
      str += RedTypeAst.toString(type.innerType);
      if (type.size !== undefined) {
        str += `; ${type.size}`;
      }
      str += '>';
    } else {
      str = type.name;
    }
    return str;
  }

  static fromJson(json: RedTypeJson): RedTypeAst {
    return {
      id: cyrb53(json.a),
      kind: RedNodeKind.type,
      name: json.a,
      innerType: (json.b !== undefined) ? RedTypeAst.fromJson(json.b) : undefined,
      size: json.c,
    };
  }
}
