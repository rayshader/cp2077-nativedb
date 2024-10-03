import {RedTypeAst, RedTypeJson} from "./red-type.ast";
import {RedVisibilityDef} from "./red-definitions.ast";
import {RedNodeAst, RedNodeKind} from "./red-node.ast";
import {cyrb53} from "../string";

export interface RedPropertyJson {
  readonly a: RedTypeJson; // type
  readonly b?: string; // name
  readonly c: number; // flags
}

export interface RedPropertyAst extends RedNodeAst {
  readonly visibility: RedVisibilityDef;
  readonly isPersistent: boolean;
  //readonly isReplicated: boolean;
  //readonly isInline: boolean;
  //readonly isEdit: boolean;
  //readonly isConst: boolean;
  //readonly name: string;
  readonly type: RedTypeAst;
}

export class RedPropertyAst {
  static sort(a: RedPropertyAst, b: RedPropertyAst): number {
    let delta: number = a.visibility - b.visibility;

    if (delta != 0) {
      return delta;
    }
    return a.name.localeCompare(b.name);
  }

  static testByUsage(prop: RedPropertyAst, rule: RegExp): boolean {
    return RedTypeAst.testType(prop.type, rule);
  }

  static filterByUsage(prop: RedPropertyAst, words: string[]): boolean {
    return RedTypeAst.hasType(prop.type, words);
  }

  static computeBadges(prop: RedPropertyAst): number {
    let badges: number = 1;

    if (prop.isPersistent) badges++;
    /*
    if (prop.isReplicated) badges++;
    if (prop.isInline) badges++;
    if (prop.isEdit) badges++;
    if (prop.isConst) badges++;
    */
    return badges;
  }

  static fromJson(json: RedPropertyJson): RedPropertyAst {
    const flags: number = json.c;
    const name: string = json.b ?? '';

    return {
      id: cyrb53(name),
      kind: RedNodeKind.property,
      visibility: getVisibilityFromPropertyFlags(flags),
      isPersistent: ((flags >> RedPropertyFlags.isPersistent) & 1) !== 0,
      name: name,
      type: RedTypeAst.fromJson(json.a)
    };
  }
}

enum RedPropertyFlags {
  isPrivate,
  isProtected,
  isPersistent,
  isReplicated,
  isInline,
  isEdit,
  isConst,
}

function getVisibilityFromPropertyFlags(flags: number): RedVisibilityDef {
  if (((flags >> RedPropertyFlags.isPrivate) & 1) !== 0) {
    return RedVisibilityDef.private;
  } else if (((flags >> RedPropertyFlags.isProtected) & 1) !== 0) {
    return RedVisibilityDef.protected;
  } else {
    return RedVisibilityDef.public;
  }
}
