import {RedObjectAst} from "./red-object.ast";
import {RedPropertyAst, RedPropertyJson} from "./red-property.ast";
import {RedFunctionAst, RedFunctionJson} from "./red-function.ast";
import {RedOriginDef, RedScopeDef} from "./red-definitions.ast";
import {cyrb53} from "../string";
import {RedNodeKind} from "./red-node.ast";

export interface RedClassJson {
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

export interface RedClassAst extends RedObjectAst {
  readonly scope: RedScopeDef;
  readonly isAbstract: boolean;
  readonly isFinal: boolean;
  readonly origin: RedOriginDef;
  readonly parent?: string;
}

export class RedClassAst {
  static fromJson(json: RedClassJson): RedClassAst {
    const flags: number = json.d ?? 0;
    const scope: RedScopeDef = flags & 3;
    const origin: RedOriginDef = (flags >> 2) & 3;
    const isAbstract: boolean = ((flags >> 4) & 1) != 0;
    const isFinal: boolean = ((flags >> 5) & 1) != 0;

    return {
      id: cyrb53(json.a),
      kind: RedNodeKind.class,
      name: json.a,
      scope: scope,
      isAbstract: isAbstract,
      isFinal: isFinal,
      origin: origin,
      parent: json.f,
      properties: json.g?.map((item) => RedPropertyAst.fromJson(item)) ?? [],
      functions: json.h?.map((item) => RedFunctionAst.fromJson(item)) ?? [],
    };
  }
}
