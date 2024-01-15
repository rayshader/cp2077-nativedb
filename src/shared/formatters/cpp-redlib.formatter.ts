import {RedFunctionAst} from "../red-ast/red-function.ast";
import {RedClassAst} from "../red-ast/red-class.ast";
import {CodeFormatter, CodeVariableFormat} from "./formatter";
import {RedArgumentAst} from "../red-ast/red-argument.ast";

export class CppRedLibFormatter extends CodeFormatter {

  constructor() {
    super(true);
  }

  protected override formatSelf(func: RedFunctionAst, memberOf?: RedClassAst | undefined): CodeVariableFormat | undefined {
    throw new Error("Method not implemented.");
  }

  protected override formatReturn(func: RedFunctionAst): CodeVariableFormat | undefined {
    throw new Error("Method not implemented.");
  }

  protected override formatArguments(args: RedArgumentAst[], selfName?: string): CodeVariableFormat[] {
    throw new Error("Method not implemented.");
  }

  protected override formatMemberStaticCall(func: RedFunctionAst, memberOf: RedClassAst): string {
    throw new Error("Method not implemented.");
  }

  protected override formatMemberCall(selfVar: CodeVariableFormat, func: RedFunctionAst): string {
    throw new Error("Method not implemented.");
  }

  protected override formatStaticCall(func: RedFunctionAst): string {
    throw new Error("Method not implemented.");
  }

}
