import {RedFunctionAst} from "../red-ast/red-function.ast";
import {RedClassAst} from "../red-ast/red-class.ast";
import {RedArgumentAst} from "../red-ast/red-argument.ast";

export interface CodeVariableFormat {
  readonly prefix: string;
  readonly name: string;
  readonly suffix: string;
}

export type ParenthesisRule = 'open-close' | 'close-only';

export abstract class CodeFormatter {

  protected constructor(private readonly withSemiColon: boolean,
                        private readonly withParenthesis: ParenthesisRule = 'open-close') {

  }

  /**
   * Format call of a function to code based on implementation syntax.
   * @param func to call and format to code.
   * @param memberOf optionally provide scope of the function: static, member of a class/struct or global when
   * undefined.
   */
  formatCode(func: RedFunctionAst, memberOf?: RedClassAst): string {
    const hasFullName: boolean = func.name !== func.fullName;
    const selfVar: CodeVariableFormat | undefined = this.formatSelf(func, memberOf);
    const selfName: string | undefined = (hasFullName && selfVar && !func.isStatic) ? selfVar.name : undefined;
    const argVars: CodeVariableFormat[] = this.formatArguments(func, selfName);
    const returnVar: CodeVariableFormat | undefined = this.formatReturn(func);
    let code: string = '';

    if (selfVar) {
      code += `${selfVar.prefix}${selfVar.name}${selfVar.suffix}\n`;
    }
    argVars.filter((argVar) => argVar.prefix.length > 0 && argVar.suffix.length > 0)
      .forEach((argVar) => {
        code += `${argVar.prefix}${argVar.name}${argVar.suffix}\n`;
      });
    if (returnVar) {
      code += `${returnVar.prefix}${returnVar.name}${returnVar.suffix}\n`;
    }
    if (selfVar || argVars.length > 0 || returnVar) {
      code += '\n';
    }
    if (returnVar) {
      code += `${returnVar.name} = `;
    }
    if (memberOf) {
      if (func.isStatic) {
        code += this.formatMemberStaticCall(func, memberOf);
      } else {
        code += this.formatMemberCall(selfVar!, func);
      }
    } else if (func.isStatic) {
      code += this.formatStaticCall(func);
    }
    if (this.withParenthesis !== 'close-only') {
      code += '(';
    }
    code += argVars.map((argVar) => argVar.name).join(', ');
    code += ')';
    if (this.withSemiColon) {
      code += ';';
    }
    code += '\n';
    return code;
  }

  protected formatReturnName(func: RedFunctionAst): string {
    let fnName: string = func.name;
    let offset: number = -1;
    let name: string = fnName;

    if (fnName.startsWith('Get') || fnName.startsWith('Has')) {
      offset = 3;
    } else if (fnName.startsWith('Find')) {
      let by: number = fnName.indexOf('By');

      offset = 4;
      if (by !== -1) {
        fnName = fnName.substring(0, by);
      }
    }
    if (offset !== -1) {
      name = fnName.substring(offset);
    }
    name = `${name[0].toLowerCase()}${name.substring(1)}`;
    return name;
  }

  protected formatArgumentName(name: string): string {
    return `${name[0].toLowerCase()}${name.substring(1)}`;
  }

  protected abstract formatSelf(func: RedFunctionAst, memberOf?: RedClassAst): CodeVariableFormat | undefined;

  protected abstract formatReturn(func: RedFunctionAst): CodeVariableFormat | undefined;

  protected abstract formatArguments(func: RedFunctionAst, selfName?: string): CodeVariableFormat[];

  protected abstract formatMemberStaticCall(func: RedFunctionAst, memberOf: RedClassAst): string;

  protected abstract formatMemberCall(selfVar: CodeVariableFormat, func: RedFunctionAst): string;

  protected abstract formatStaticCall(func: RedFunctionAst): string;

}
