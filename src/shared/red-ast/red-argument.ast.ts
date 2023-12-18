import {RedPropertyJson} from "./red-property.ast";
import {RedTypeAst} from "./red-type.ast";

export interface RedArgumentAst {
  //readonly isConst: boolean;
  readonly isOut: boolean;
  readonly isOptional: boolean;
  readonly name: string;
  readonly type: RedTypeAst;
}

export class RedArgumentAst {
  static fromJson(json: RedPropertyJson): RedArgumentAst {
    const flags: number = json.c;

    return {
      //isConst: ((flags >> RedArgumentFlags.isConst) & 1) !== 0,
      isOut: ((flags >> RedArgumentFlags.isOut) & 1) !== 0,
      isOptional: ((flags >> RedArgumentFlags.isOptional) & 1) !== 0,
      name: json.b ?? '',
      type: RedTypeAst.fromJson(json.a)
    };
  }
}

enum RedArgumentFlags {
  isConst,
  isOut,
  isOptional
}
