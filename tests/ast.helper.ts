import {RedFunctionAst} from "../src/shared/red-ast/red-function.ast";
import {RedNodeKind} from "../src/shared/red-ast/red-node.ast";
import {
  RedOriginDef,
  RedPrimitiveDef,
  RedTemplateDef,
  RedVisibilityDef
} from "../src/shared/red-ast/red-definitions.ast";
import {RedTypeAst} from "../src/shared/red-ast/red-type.ast";
import {RedArgumentAst} from "../src/shared/red-ast/red-argument.ast";
import {cyrb53} from "../src/shared/string";
import {RedClassAst} from "../src/shared/red-ast/red-class.ast";
import {RedEnumAst, RedEnumMemberAst} from "../src/shared/red-ast/red-enum.ast";
import {RedBitfieldAst, RedBitfieldMemberAst} from "../src/shared/red-ast/red-bitfield.ast";

export class AstHelper {

  static readonly Bool: RedTypeAst = this.buildPrimitive(RedPrimitiveDef.Bool);
  static readonly Float: RedTypeAst = this.buildPrimitive(RedPrimitiveDef.Float);

  static buildEnum(name: string, members: RedEnumMemberAst[] = []): RedEnumAst {
    return {
      kind: RedNodeKind.enum,
      id: cyrb53(name),
      name: name,
      members: members
    };
  }

  static buildBitfield(name: string, members: RedBitfieldMemberAst[] = []): RedBitfieldAst {
    return {
      kind: RedNodeKind.bitfield,
      id: cyrb53(name),
      name: name,
      members: members
    };
  }

  static buildClass(name: string, aliasName?: string): RedClassAst {
    return {
      kind: RedNodeKind.class,
      id: cyrb53(name),
      name: name,
      aliasName: aliasName,
      origin: RedOriginDef.native,
      visibility: RedVisibilityDef.public,
      isAbstract: false,
      isStruct: false,
      functions: [],
      properties: [],
      parents: [],
      children: [],
      isInheritanceLoaded: false
    };
  }

  static buildStruct(name: string, aliasName?: string): RedClassAst {
    return {
      kind: RedNodeKind.struct,
      id: cyrb53(name),
      name: name,
      aliasName: aliasName,
      origin: RedOriginDef.native,
      visibility: RedVisibilityDef.public,
      isAbstract: false,
      isStruct: true,
      functions: [],
      properties: [],
      parents: [],
      children: [],
      isInheritanceLoaded: false
    };
  }

  static buildFunction(name: string,
                       returnType?: RedTypeAst | string,
                       isStatic: boolean = false,
                       visibility: RedVisibilityDef = RedVisibilityDef.public,
                       args: RedArgumentAst[] = [],
                       fullName?: string,
                       flags?: any): RedFunctionAst {
    let type: RedTypeAst | undefined;

    if (typeof returnType === 'string') {
      type = AstHelper.buildType(returnType as string);
    } else {
      type = returnType;
    }
    return {
      kind: RedNodeKind.function,
      id: 0,
      name: name,
      fullName: fullName ?? name,
      visibility: visibility ?? RedVisibilityDef.public,
      returnType: type,
      arguments: args ?? [],
      isNative: flags?.isNative ?? false,
      isStatic: isStatic ?? false,
      isFinal: flags?.isFinal ?? false,
      isThreadSafe: flags?.isThreadSafe ?? false,
      isCallback: flags?.isCallback ?? false,
      isConst: flags?.isConst ?? false,
      isQuest: flags?.isQuest ?? false,
      isTimer: flags?.isTimer ?? false
    };
  }

  static buildArg(name: string,
                  type: RedTypeAst | string,
                  isOptional: boolean = false,
                  isOut: boolean = false): RedArgumentAst {
    let argType: RedTypeAst | undefined;

    if (typeof type === 'string') {
      argType = AstHelper.buildType(type as string);
    } else {
      argType = type;
    }
    return {
      name: name,
      type: argType,
      isOptional: isOptional,
      isOut: isOut
    };
  }

  static buildType(name: string, aliasName?: string): RedTypeAst {
    return {
      kind: RedNodeKind.type,
      id: cyrb53(name),
      name: name,
      aliasName: aliasName
    };
  }

  static buildRef(name: string, aliasName?: string): RedTypeAst {
    return {
      kind: RedNodeKind.type,
      id: cyrb53('ref'),
      name: 'ref',
      flag: RedTemplateDef.ref,
      innerType: this.buildType(name, aliasName)
    };
  }

  static buildWeakRef(name: string, aliasName?: string): RedTypeAst {
    return {
      kind: RedNodeKind.type,
      id: cyrb53('wref'),
      name: 'wref',
      flag: RedTemplateDef.wref,
      innerType: this.buildType(name, aliasName)
    };
  }

  static buildArray(innerType: RedTypeAst): RedTypeAst {
    return {
      kind: RedNodeKind.type,
      id: cyrb53('array'),
      name: 'array',
      flag: RedTemplateDef.array,
      innerType: innerType
    };
  }

  private static buildPrimitive(primitive: RedPrimitiveDef): RedTypeAst {
    const name: string = RedPrimitiveDef[primitive];

    return {
      kind: RedNodeKind.type,
      id: cyrb53(name),
      name: name,
      flag: primitive
    };
  }

}
