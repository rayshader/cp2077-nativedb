import {RedPrimitiveDef, RedTemplateDef} from "./red-definitions.ast";
import {RedNodeAst, RedNodeKind} from "./red-node.ast";
import {cyrb53} from "../string";

export interface RedTypeJson {
  // name
  readonly a?: string;
  // primitive
  readonly n?: RedPrimitiveDef;
  // template
  readonly o?: RedTemplateDef;
  // size
  readonly m?: number;
  // child
  readonly p?: RedTypeJson;
}

export interface RedTypeAst extends RedNodeAst {
  readonly name: string;
  readonly primitive?: RedPrimitiveDef;
  readonly template?: RedTemplateDef;
  readonly size?: number;
  readonly child?: RedTypeAst;
}

export class RedTypeAst {
  static toString(type: RedTypeAst): string {
    let str: string = '';

    // TODO: ignore script_ref<T> when syntax is for Redscript / Lua ?
    if (typeof type.template === 'number' && type.child) {
      str += `${type.name}<`;
      str += RedTypeAst.toString(type.child);
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
    let name: string;

    if (typeof json.n === 'number') {
      name = RedPrimitiveDef[json.n];
    } else if (typeof json.o === 'number') {
      name = RedTemplateDef[json.o];
    } else {
      name = json.a!;
    }
    return {
      id: cyrb53(name),
      kind: RedNodeKind.type,
      name: name,
      primitive: json.n,
      template: json.o,
      size: json.m,
      child: (json.p) ? RedTypeAst.fromJson(json.p) : undefined,
    };
  }
}
