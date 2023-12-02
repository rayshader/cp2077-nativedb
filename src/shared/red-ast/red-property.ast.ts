import {RedTypeAst, RedTypeJson} from "./red-type.ast";
import {RedAnnotationAst, RedAnnotationJson} from "./red-annotation.ast";
import {RedScopeDef} from "./red-definitions.ast";

export interface RedPropertyJson {
  // annotations
  readonly l?: RedAnnotationJson[];

  // flags
  readonly d?: number;

  // type
  readonly e: RedTypeJson;

  // name;
  readonly a: string;
}

export interface RedPropertyAst {
  readonly annotations: RedAnnotationAst[];
  readonly scope: RedScopeDef;
  readonly isInline: boolean;
  readonly isEdit: boolean;
  readonly isNative: boolean;
  readonly isPersistent: boolean;
  readonly isReplicated: boolean;
  readonly isConst: boolean;
  readonly type: RedTypeAst;
  readonly name: string;
}

export class RedPropertyAst {
  static fromJson(json: RedPropertyJson): RedPropertyAst {
    const flags: number = json.d ?? 0;
    const scope: RedScopeDef = flags & 3;
    const isInline: boolean = ((flags >> 2) & 1) != 0;
    const isEdit: boolean = ((flags >> 3) & 1) != 0;
    const isNative: boolean = ((flags >> 4) & 1) != 0;
    const isPersistent: boolean = ((flags >> 5) & 1) != 0;
    const isReplicated: boolean = ((flags >> 6) & 1) != 0;
    const isConst: boolean = ((flags >> 7) & 1) != 0;

    return {
      annotations: json.l?.map((item) => RedAnnotationAst.fromJson(item)) ?? [],
      scope: scope,
      isInline: isInline,
      isEdit: isEdit,
      isNative: isNative,
      isPersistent: isPersistent,
      isReplicated: isReplicated,
      isConst: isConst,
      type: RedTypeAst.fromJson(json.e),
      name: json.a,
    };
  }
}
