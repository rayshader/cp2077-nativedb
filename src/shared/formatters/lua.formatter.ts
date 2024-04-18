import {RedFunctionAst} from "../red-ast/red-function.ast";
import {RedClassAst} from "../red-ast/red-class.ast";
import {CodeFormatter, CodeVariableFormat} from "./formatter";
import {RedTypeAst} from "../red-ast/red-type.ast";
import {RedArgumentAst} from "../red-ast/red-argument.ast";
import {CodeSyntax} from "../services/settings.service";

export class LuaFormatter extends CodeFormatter {

  constructor() {
    super(false);
  }

  override formatPrototype(func: RedFunctionAst): string {
    const args: string = func.arguments.map((arg) => RedArgumentAst.toString(arg, CodeSyntax.lua)).join(', ');
    const returnType: string = func.returnType ? RedTypeAst.toString(func.returnType, CodeSyntax.lua) : 'Void';

    return `${func.name}(${args}) -> ${returnType}`;
  }

  override formatSpecial(type: string, func: RedFunctionAst, memberOf: RedClassAst): string {
    if (type === 'Observable') {
      return this.formatObservable(func, memberOf);
    } else if (type === 'Override') {
      return this.formatOverride(func, memberOf);
    } else if (type === 'NewProxy') {
      return this.formatNewProxy(func, memberOf);
    }
    return '';
  }

  protected override formatSelf(func: RedFunctionAst, memberOf?: RedClassAst): CodeVariableFormat | undefined {
    if (func.isStatic || !memberOf) {
      return undefined;
    }
    const name: string = memberOf.aliasName ?? memberOf.name;

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
    const type: string = RedTypeAst.toString(func.returnType, CodeSyntax.lua);

    return {
      prefix: 'local ',
      name: this.formatReturnName(func),
      suffix: ` -- ${type}`
    };
  }

  protected override formatArguments(func: RedFunctionAst, selfName?: string): CodeVariableFormat[] {
    const argVars: CodeVariableFormat[] = func.arguments.filter((arg: RedArgumentAst) => {
      return arg.name !== 'self';
    }).map((arg: RedArgumentAst) => {
      const type: string = RedTypeAst.toString(arg.type, CodeSyntax.lua);
      const optional: string = arg.isOptional ? ', optional' : '';

      return {
        prefix: 'local ',
        name: this.formatArgumentName(arg.name),
        suffix: ` -- ${type}${optional}`
      };
    });

    return argVars;
  }

  protected override formatMemberStaticCall(func: RedFunctionAst, memberOf: RedClassAst): string {
    const name: string = this.formatAlias(memberOf.aliasName ?? memberOf.name);

    return `${name}.${func.name}`;
  }

  protected override formatMemberCall(selfVar: CodeVariableFormat, func: RedFunctionAst): string {
    return `${selfVar.name}:${func.name}`;
  }

  protected override formatStaticCall(func: RedFunctionAst): string {
    return `Game.${func.name}`;
  }

  private formatAlias(name: string): string {
    if (name === 'GameInstance') {
      return 'Game';
    }
    return name;
  }

  private formatObservable(func: RedFunctionAst, memberOf: RedClassAst): string {
    return '';
  }

  private formatOverride(func: RedFunctionAst, memberOf: RedClassAst): string {
    return '';
  }

  private formatNewProxy(func: RedFunctionAst, memberOf: RedClassAst): string {
    return '';
  }

}
