import {RedPrimitiveDef, RedTemplateDef} from "./red-definitions.ast";

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

export interface RedTypeAst {
  readonly name: string;
  readonly primitive?: RedPrimitiveDef;
  readonly template?: RedTemplateDef;
  readonly size: number | -1;
  readonly child?: RedTypeAst;
}

export class RedTypeAst {
  static fromJson(json: RedTypeJson): RedTypeAst {
    let name: string;

    if (json.n) {
      name = RedPrimitiveDef[json.n];
    } else if (json.o) {
      name = RedTemplateDef[json.o];
    } else {
      name = json.a!;
    }
    return {
      name: name,
      primitive: json.n,
      template: json.o,
      size: json.m ?? -1,
      child: (json.p) ? RedTypeAst.fromJson(json.p) : undefined,
    };
  }
}
