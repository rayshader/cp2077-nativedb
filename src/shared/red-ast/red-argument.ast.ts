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
      //isConst: (flags & RedArgumentFlags.isConst) === RedArgumentFlags.isConst,
      isOut: (flags & RedArgumentFlags.isOut) === RedArgumentFlags.isOut,
      isOptional: (flags & RedArgumentFlags.isOptional) === RedArgumentFlags.isOptional,
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
