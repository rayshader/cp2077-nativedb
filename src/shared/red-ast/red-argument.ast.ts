import {RedTypeAst, RedTypeJson} from "./red-type.ast";
import {cyrb53} from "../string";
import {RedNodeAst, RedNodeKind} from "./red-node.ast";

export interface RedArgumentJson {
  // flags
  readonly d?: number;
  // name
  readonly a: string;
  // type
  readonly e: RedTypeJson;
}

export interface RedArgumentAst extends RedNodeAst {
  readonly isOut: boolean;
  readonly isConst: boolean;
  readonly isOptional: boolean;
  readonly name: string;
  readonly type: RedTypeAst;
}

export class RedArgumentAst {
  static fromJson(json: RedArgumentJson): RedArgumentAst {
    const flags: number = json.d ?? 0;
    const isOut: boolean = (flags & 1) != 0;
    const isConst: boolean = ((flags >> 1) & 1) != 0;
    const isOptional: boolean = ((flags >> 2) & 1) != 0;

    return {
      id: cyrb53(json.a),
      kind: RedNodeKind.argument,
      isOut: isOut,
      isConst: isConst,
      isOptional: isOptional,
      name: json.a,
      type: RedTypeAst.fromJson(json.e),
    };
  }
}
