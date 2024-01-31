import {RedVisibilityDef} from "./red-definitions.ast";
import {cyrb53} from "../string";
import {RedNodeAst, RedNodeKind} from "./red-node.ast";
import {RedPropertyJson} from "./red-property.ast";
import {RedTypeAst, RedTypeJson} from "./red-type.ast";
import {RedArgumentAst} from "./red-argument.ast";

export interface RedFunctionJson {
  readonly a: string; // full name
  readonly b?: string; // short name
  readonly c?: RedTypeJson; // return type
  readonly d: number; // flags
  readonly e?: RedPropertyJson[]; // parameters
}

export interface RedFunctionAst extends RedNodeAst {
  readonly visibility: RedVisibilityDef;
  readonly isNative: boolean;
  readonly isStatic: boolean;
  readonly isFinal: boolean;
  readonly isThreadSafe: boolean;
  readonly isCallback: boolean;
  readonly isConst: boolean;
  readonly isQuest: boolean;
  readonly isTimer: boolean;

  //readonly name: string;
  readonly fullName: string;
  readonly arguments: RedArgumentAst[];
  readonly returnType?: RedTypeAst;
}

export class RedFunctionAst {
  static sort(a: RedFunctionAst, b: RedFunctionAst): number {
    let delta: number = a.visibility - b.visibility;

    if (delta != 0) {
      return delta;
    }
    return a.name.localeCompare(b.name);
  }

  static computeBadges(func: RedFunctionAst): number {
    let badges: number = 1;

    if (func.isNative) badges++;
    if (func.isStatic) badges++;
    if (func.isFinal) badges++;
    if (func.isCallback) badges++;
    if (func.isTimer) badges++;
    if (func.isConst) badges++;
    if (func.isQuest) badges++;
    if (func.isThreadSafe) badges++;
    return badges;
  }

  static fromJson(json: RedFunctionJson): RedFunctionAst {
    const flags: number = json.d;
    const name: string = json.b ?? json.a;
    const args: RedArgumentAst[] = json.e?.map(RedArgumentAst.fromJson) ?? [];
    const returnType: RedTypeAst | undefined = (json.c !== undefined) ? RedTypeAst.fromJson(json.c) : undefined;
    let signature: string = name;

    signature += args.map((arg) => arg.name).join(',');
    signature += returnType ? RedTypeAst.toString(returnType) : 'Void';
    return {
      id: cyrb53(signature),
      kind: RedNodeKind.function,
      visibility: getVisibilityFromFunctionFlags(flags),
      isNative: ((flags >> RedFunctionFlags.isNative) & 1) !== 0,
      isStatic: ((flags >> RedFunctionFlags.isStatic) & 1) !== 0,
      isFinal: ((flags >> RedFunctionFlags.isFinal) & 1) !== 0,
      isThreadSafe: ((flags >> RedFunctionFlags.isThreadSafe) & 1) !== 0,
      isCallback: ((flags >> RedFunctionFlags.isEvent) & 1) !== 0,
      isConst: ((flags >> RedFunctionFlags.isConst) & 1) !== 0,
      isQuest: ((flags >> RedFunctionFlags.isQuest) & 1) !== 0,
      isTimer: ((flags >> RedFunctionFlags.isTimer) & 1) !== 0,
      name: name,
      fullName: json.a,
      arguments: args,
      returnType: returnType
    };
  }

  static loadAlias(nodes: RedNodeAst[], func: RedFunctionAst): void {
    if (func.returnType) {
      RedTypeAst.loadAlias(nodes, func.returnType);
    }
    func.arguments.forEach((argument) => RedTypeAst.loadAlias(nodes, argument.type));
  }
}

enum RedFunctionFlags {
  isPrivate,
  isProtected,
  isNative,
  isStatic,
  isFinal,
  isThreadSafe,
  isEvent,
  isConst,
  isQuest,
  isTimer,
}

function getVisibilityFromFunctionFlags(flags: number): RedVisibilityDef {
  if (((flags >> RedFunctionFlags.isPrivate) & 1) !== 0) {
    return RedVisibilityDef.private;
  } else if (((flags >> RedFunctionFlags.isProtected) & 1) !== 0) {
    return RedVisibilityDef.protected;
  } else {
    return RedVisibilityDef.public;
  }
}
