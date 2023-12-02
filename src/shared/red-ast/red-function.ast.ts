import {RedTypeAst, RedTypeJson} from "./red-type.ast";
import {RedArgumentAst, RedArgumentJson} from "./red-argument.ast";
import {RedScopeDef} from "./red-definitions.ast";

export interface RedFunctionJson {
  // name
  readonly a: string;
  // flags
  readonly d?: number;
  // arguments
  readonly k?: RedArgumentJson[];
  // returnType
  readonly j: RedTypeJson;
}

export interface RedFunctionAst {
  readonly name: string;
  readonly scope: RedScopeDef;
  readonly isFinal: boolean;
  readonly isStatic: boolean;
  readonly isNative: boolean;
  readonly isConst: boolean;
  readonly isQuest: boolean;
  readonly isCallback: boolean;
  readonly arguments: RedArgumentAst[];
  readonly returnType: RedTypeAst;
}

export class RedFunctionAst {
  static fromJson(json: RedFunctionJson): RedFunctionAst {
    const flags: number = json.d ?? 0;
    const scope: RedScopeDef = flags & 3;
    const isFinal: boolean = ((flags >> 2) & 1) != 0;
    const isStatic: boolean = ((flags >> 3) & 1) != 0;
    const isNative: boolean = ((flags >> 4) & 1) != 0;
    const isConst: boolean = ((flags >> 5) & 1) != 0;
    const isQuest: boolean = ((flags >> 6) & 1) != 0;
    const isCallback: boolean = ((flags >> 7) & 1) != 0;

    return {
      name: json.a,
      scope: scope,
      isFinal: isFinal,
      isStatic: isStatic,
      isNative: isNative,
      isConst: isConst,
      isQuest: isQuest,
      isCallback: isCallback,
      arguments: json.k?.map((item) => RedArgumentAst.fromJson(item)) ?? [],
      returnType: RedTypeAst.fromJson(json.j)
    };
  }
}
