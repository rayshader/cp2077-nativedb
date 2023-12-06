import {RedOriginDef, RedVisibilityDef} from "./red-definitions.ast";
import {RedNodeAst, RedNodeKind} from "./red-node.ast";
import {cyrb53} from "../string";
import {RedPropertyAst, RedPropertyJson} from "./red-property.ast";
import {RedFunctionAst, RedFunctionJson} from "./red-function.ast";

export interface RedClassJson {
  readonly a?: string; // parent
  readonly b: string; // name
  readonly c: number; // class flags
  readonly f?: true; // is struct
  readonly d?: RedPropertyJson[]; // properties
  readonly e?: RedFunctionJson[]; // functions
}

export interface RedClassAst extends RedNodeAst {
  readonly visibility: RedVisibilityDef;
  readonly isAbstract: boolean;
  readonly origin: RedOriginDef;
  //readonly name: string;
  readonly isStruct: boolean;
  readonly parent?: string;
  readonly properties: RedPropertyAst[];
  readonly functions: RedFunctionAst[];
}

export class RedClassAst {
  static sort(a: RedClassAst, b: RedClassAst): number {
    return a.name.localeCompare(b.name);
  }

  static fromJson(json: RedClassJson): RedClassAst {
    const flags: number = json.c;
    const name: string = json.b;

    return {
      id: cyrb53(name),
      kind: (json.f === true) ? RedNodeKind.struct : RedNodeKind.class,
      visibility: getVisibilityFromClassFlags(flags),
      isAbstract: (flags & RedClassFlags.isAbstract) === RedClassFlags.isAbstract,
      origin: getOriginFromClassFlags(flags),
      name: name,
      isStruct: json.f === true,
      parent: json.a,
      properties: json.d?.map(RedPropertyAst.fromJson) ?? [],
      functions: json.e?.map(RedFunctionAst.fromJson) ?? []
    };
  }
}

enum RedClassFlags {
  isPrivate,
  isProtected,
  isAbstract,
  isNative,
  isImportOnly
}

function getVisibilityFromClassFlags(flags: number): RedVisibilityDef {
  if (((flags >> RedClassFlags.isPrivate) & 1) !== 0) {
    return RedVisibilityDef.private;
  } else if (((flags >> RedClassFlags.isProtected) & 1) !== 0) {
    return RedVisibilityDef.protected;
  } else {
    return RedVisibilityDef.public;
  }
}

function getOriginFromClassFlags(flags: number): RedOriginDef {
  if (((flags >> RedClassFlags.isNative) & 1) !== 0) {
    return RedOriginDef.native;
  } else if (((flags >> RedClassFlags.isImportOnly) & 1) !== 0) {
    return RedOriginDef.importOnly;
  } else {
    return RedOriginDef.script;
  }
}
