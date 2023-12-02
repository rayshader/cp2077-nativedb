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
  readonly size: number | -1;
  readonly child?: RedTypeAst;
}

export class RedTypeAst {
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
      size: json.m ?? -1,
      child: (json.p) ? RedTypeAst.fromJson(json.p) : undefined,
    };
  }
}
