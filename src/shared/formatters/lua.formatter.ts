import {RedFunctionAst} from "../red-ast/red-function.ast";
import {RedClassAst} from "../red-ast/red-class.ast";
import {CodeFormatter, CodeVariableFormat} from "./formatter";
import {RedTypeAst} from "../red-ast/red-type.ast";
import {RedArgumentAst} from "../red-ast/red-argument.ast";

export class LuaFormatter extends CodeFormatter {

  constructor() {
    super(false);
  }

  protected override formatSelf(func: RedFunctionAst, memberOf?: RedClassAst): CodeVariableFormat | undefined {
    if (func.isStatic || !memberOf) {
      return undefined;
    }
    const name: string = memberOf.name;

    return {
      prefix: 'local ',
      name: name.toLowerCase(),
      suffix: ` -- ${name}`
    };
  }

  protected override formatReturn(func: RedFunctionAst): CodeVariableFormat | undefined {
    if (!func.returnType) {
      return undefined;
    }
    const type: string = RedTypeAst.toString(func.returnType);

    return {
      prefix: 'local ',
      name: this.formatReturnName(func),
      suffix: ` -- ${type}`
    };
  }

  protected override formatArguments(args: RedArgumentAst[], selfName?: string): CodeVariableFormat[] {
    const argVars: CodeVariableFormat[] = args.filter((arg: RedArgumentAst) => {
      return arg.name !== 'self';
    }).map((arg: RedArgumentAst) => {
      const type: string = RedTypeAst.toString(arg.type);
      const optional: string = arg.isOptional ? ', optional' : '';

      return {
        prefix: 'local ',
        name: this.formatArgumentName(arg.name),
        suffix: ` -- ${type}${optional}`
      };
    });

    if (selfName) {
      argVars.splice(0, 0, {
        prefix: '',
        name: selfName,
        suffix: ''
      });
    }
    return argVars;
  }

  protected override formatMemberStaticCall(func: RedFunctionAst, memberOf: RedClassAst): string {
    const name: string = this.formatAlias(memberOf.name);
    const hasFullName: boolean = func.name !== func.fullName;

    if (!hasFullName) {
      return `${name}.${func.name}`;
    }
    return `${name}['${func.fullName}']`;
  }

  protected override formatMemberCall(selfVar: CodeVariableFormat, func: RedFunctionAst): string {
    const hasFullName: boolean = func.name !== func.fullName;

    if (!hasFullName) {
      return `${selfVar.name}:${func.name}`;
    }
    return `${selfVar.name}['${func.fullName}']`;
  }

  protected override formatStaticCall(func: RedFunctionAst): string {
    return `Game.${func.name}`;
  }

  private formatAlias(name: string): string {
    if (name === 'ScriptGameInstance') {
      return 'Game';
    }
    return name;
  }

}
