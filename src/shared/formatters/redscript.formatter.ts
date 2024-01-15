import {RedFunctionAst} from "../red-ast/red-function.ast";
import {RedClassAst} from "../red-ast/red-class.ast";
import {RedTypeAst} from "../red-ast/red-type.ast";
import {CodeFormatter, CodeVariableFormat} from "./formatter";
import {RedArgumentAst} from "../red-ast/red-argument.ast";

export class RedscriptFormatter extends CodeFormatter {

  constructor() {
    super(true);
  }

  protected override formatSelf(func: RedFunctionAst, memberOf?: RedClassAst): CodeVariableFormat | undefined {
    if (func.isStatic || !memberOf) {
      return undefined;
    }
    return {
      prefix: 'let ',
      name: memberOf.name.toLowerCase(),
      suffix: `: ${memberOf.name};`
    };
  }

  protected override formatReturn(func: RedFunctionAst): CodeVariableFormat | undefined {
    if (!func.returnType) {
      return undefined;
    }
    const type: string = RedTypeAst.toString(func.returnType);

    return {
      prefix: 'let ',
      name: this.formatReturnName(func),
      suffix: `: ${type};`
    };
  }

  protected override formatArguments(args: RedArgumentAst[], selfName?: string): CodeVariableFormat[] {
    return args.map((arg: RedArgumentAst) => {
      const type: string = RedTypeAst.toString(arg.type);
      const optional: string = arg.isOptional ? ' # Optional' : '';

      return {
        prefix: 'let ',
        name: this.formatArgumentName(arg.name),
        suffix: `: ${type};${optional}`
      };
    });
  }

  protected override formatMemberStaticCall(func: RedFunctionAst, memberOf: RedClassAst): string {
    return `${memberOf.name}.${func.name}`;
  }

  protected override formatMemberCall(selfVar: CodeVariableFormat, func: RedFunctionAst): string {
    return `${selfVar.name}.${func.name}`;
  }

  protected override formatStaticCall(func: RedFunctionAst): string {
    return func.name;
  }

}
