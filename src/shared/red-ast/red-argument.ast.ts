import {RedPropertyJson} from "./red-property.ast";
import {RedTypeAst} from "./red-type.ast";
import {CodeSyntax} from "../services/settings.service";

export interface RedArgumentAst {
  readonly isConst: boolean;
  readonly isOut: boolean;
  readonly isOptional: boolean;
  readonly name: string;
  readonly type: RedTypeAst;
}

export class RedArgumentAst {
  static toString(argument: RedArgumentAst, syntax?: CodeSyntax): string {
    let flag: string = '';

    if (argument.isConst) {
      flag = 'const ';
    } else if (argument.isOut) {
      flag = 'out ';
    } else if (argument.isOptional) {
      flag = 'opt ';
    }
    return `${flag}${argument.name}: ${RedTypeAst.toString(argument.type, syntax)}`;
  }

  static fromJson(json: RedPropertyJson): RedArgumentAst {
    const flags: number = json.c === undefined ? 0 : json.c;

    return {
      isConst: ((flags >> RedArgumentFlags.isConst) & 1) !== 0,
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
