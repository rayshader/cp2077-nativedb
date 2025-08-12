import {RedOriginDef, RedVisibilityDef} from "./red-definitions.ast";
import {RedNodeAst, RedNodeKind} from "./red-node.ast";
import {cyrb53} from "../string";
import {RedPropertyAst, RedPropertyJson} from "./red-property.ast";
import {RedFunctionAst, RedFunctionJson} from "./red-function.ast";
import {RedTypeAst} from "./red-type.ast";
import {InheritData} from "../../app/pages/object/object.component";

export interface RedClassJson {
  readonly a?: string; // parent
  readonly b: string; // name
  readonly c?: string; // alias name
  readonly d: number; // class flags
  readonly e?: RedPropertyJson[]; // properties
  readonly f?: RedFunctionJson[]; // functions
  readonly g?: true; // is struct
}

export interface RedClassAst extends RedNodeAst {
  readonly visibility: RedVisibilityDef;
  readonly isAbstract: boolean;
  readonly origin: RedOriginDef;
  readonly isStruct: boolean;
  readonly parent?: string;
  readonly properties: RedPropertyAst[];
  readonly functions: RedFunctionAst[];

  // Load parents/children on first visit using WebWorker.
  readonly parents: InheritData[];
  readonly children: InheritData[];
  isInheritanceLoaded: boolean;
}

export class RedClassAst {
  static sort(a: RedClassAst, b: RedClassAst): number {
    return a.name.localeCompare(b.name);
  }

  static fromJson(json: RedClassJson): RedClassAst {
    const flags: number = json.d;
    const name: string = json.b;

    // NOTE: workaround because RTTI declaration is wrong on the CDPR side.
    //       - TweakDBInterface is declared without a static qualifier in RTTI, but implementation and script import
    //         expect a static qualifier.
    //       - structs can't have member functions. Therefore, the static qualifier of functions is always set.
    const isStaticFix: boolean = json.g === true || name === 'gamedataTweakDBInterface';

    return {
      id: cyrb53(name),
      kind: (json.g === true) ? RedNodeKind.struct : RedNodeKind.class,
      visibility: getVisibilityFromClassFlags(flags),
      isAbstract: (flags & RedClassFlags.isAbstract) === RedClassFlags.isAbstract,
      origin: getOriginFromClassFlags(flags),
      name: name,
      aliasName: json.c,
      isStruct: json.g === true,
      parent: json.a,
      properties: json.e?.map(RedPropertyAst.fromJson) ?? [],
      functions: json.f?.map((json) => RedFunctionAst.fromJson(json, isStaticFix)) ?? [],
      parents: [],
      children: [],
      isInheritanceLoaded: false
    };
  }

  static loadAliases(nodes: RedNodeAst[], object: RedClassAst): void {
    object.properties.forEach((property) => RedTypeAst.loadAlias(nodes, property.type));
    object.functions.forEach((func) => RedFunctionAst.loadAlias(nodes, func));
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
