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

export class AstHelper {

  static get Bool(): RedTypeAst {
    return this.buildPrimitive(RedPrimitiveDef.Bool);
  }

  static get Float(): RedTypeAst {
    return this.buildPrimitive(RedPrimitiveDef.Float);
  }

  static buildClass(name: string): RedClassAst {
    return {
      kind: RedNodeKind.class,
      id: cyrb53(name),
      name: name,
      origin: RedOriginDef.native,
      visibility: RedVisibilityDef.public,
      isAbstract: false,
      isStruct: false,
      functions: [],
      properties: []
    };
  }

  static buildFunction(name: string,
                       returnType?: RedTypeAst | string,
                       isStatic: boolean = false,
                       visibility: RedVisibilityDef = RedVisibilityDef.public,
                       args: RedArgumentAst[] = [],
                       fullName?: string): RedFunctionAst {
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
      isNative: false,
      isStatic: isStatic ?? false,
      isFinal: false,
      isThreadSafe: false,
      isCallback: false,
      isConst: false,
      isQuest: false,
      isTimer: false
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

  static buildType(name: string): RedTypeAst {
    return {
      kind: RedNodeKind.type,
      id: cyrb53(name),
      name: name
    };
  }

  static buildRef(name: string): RedTypeAst {
    return {
      kind: RedNodeKind.type,
      id: cyrb53('ref'),
      name: 'ref',
      flag: RedTemplateDef.ref,
      innerType: this.buildType(name)
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
