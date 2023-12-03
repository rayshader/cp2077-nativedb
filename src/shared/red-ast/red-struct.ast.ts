import {RedObjectAst} from "./red-object.ast";
import {RedPropertyAst, RedPropertyJson} from "./red-property.ast";
import {RedFunctionAst, RedFunctionJson} from "./red-function.ast";
import {RedOriginDef, RedScopeDef} from "./red-definitions.ast";
import {cyrb53} from "../string";
import {RedNodeKind} from "./red-node.ast";

export interface RedStructJson {
  // name
  readonly a: string;
  // flags
  readonly d?: number;
  // parent
  readonly f?: string;
  // properties
  readonly g?: RedPropertyJson[];
  // functions
  readonly h?: RedFunctionJson[];
}

export interface RedStructAst extends RedObjectAst {
  readonly scope: RedScopeDef;
  readonly origin: RedOriginDef;
}

export class RedStructAst {
  static fromJson(json: RedStructJson): RedStructAst {
    const flags: number = json.d ?? 0;
    const scope: RedScopeDef = flags & 3;
    const origin: RedOriginDef = (flags >> 2) & 3;

    return {
      id: cyrb53(json.a),
      kind: RedNodeKind.struct,
      name: json.a,
      scope: scope,
      origin: origin,
      parent: json.f,
      properties: json.g?.map((item) => RedPropertyAst.fromJson(item)) ?? [],
      functions: json.h?.map((item) => RedFunctionAst.fromJson(item)) ?? [],
    };
  }
}
