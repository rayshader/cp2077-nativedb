import {RedFunctionAst} from "../red-ast/red-function.ast";
import {RedClassAst} from "../red-ast/red-class.ast";

export interface CodeFormatter {
  /**
   * Format call of a function to code based on implementation syntax.
   * @param func to call and format to code.
   * @param memberOf optionally provide scope of the function: static, member of a class/struct or global when
   * undefined.
   */
  formatCode(func: RedFunctionAst, memberOf?: RedClassAst): string;
}
