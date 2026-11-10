import {RedFunctionAst} from "../red-ast/red-function.ast";
import {RedClassAst} from "../red-ast/red-class.ast";
import {RedTypeAst} from "../red-ast/red-type.ast";
import {CodeFormatter, CodeVariableFormat} from "./formatter";
import {RedArgumentAst} from "../red-ast/red-argument.ast";
import {CodeSyntax} from "../services/settings.service";
import {RedVisibilityDef} from "../red-ast/red-definitions.ast";

export class RedmodFormatter extends CodeFormatter {

  constructor() {
    super(true);
  }

  override formatPrototype(func: RedFunctionAst): string {
    const args: string = this.formatPrototypeArguments(func);
    const returnType: string = this.formatType(func.returnType);

    return `${func.name}(${args}) : ${returnType}`;
  }

  override formatSpecial(type: string, func: RedFunctionAst, memberOf?: RedClassAst): string {
    if (type === 'wrapMethod') {
      return this.formatWrapMethod(func, memberOf!);
    } else if (type === 'replaceMethod') {
      return this.formatReplaceMethod(func, memberOf!);
    }/* else if (type === 'replaceGlobal') {
      return this.formatReplaceGlobal(func);
    }*/
    return '';
  }

  protected override formatSelf(func: RedFunctionAst, memberOf?: RedClassAst): CodeVariableFormat | undefined {
    if (func.isStatic || !memberOf) {
      return undefined;
    }
    let name: string = memberOf.aliasName ?? memberOf.name;

    return {
      prefix: 'var ',
      name: name.toLowerCase(),
      suffix: `: ${name};`
    };
  }

  protected override formatReturn(func: RedFunctionAst): CodeVariableFormat | undefined {
    if (!func.returnType) {
      return undefined;
    }
    const type: string = RedTypeAst.toString(func.returnType, CodeSyntax.redmod);

    return {
      prefix: 'var ',
      name: this.formatReturnName(func),
      suffix: `: ${type};`
    };
  }

  protected override formatArguments(func: RedFunctionAst, selfName?: string): CodeVariableFormat[] {
    return func.arguments.map((arg: RedArgumentAst) => {
      const type: string = RedTypeAst.toString(arg.type, CodeSyntax.redmod);
      const optional: string = arg.isOptional ? ' // Optional' : '';

      return {
        prefix: 'var ',
        name: this.formatArgumentName(arg.name),
        suffix: `: ${type};${optional}`
      };
    });
  }

  protected override formatMemberStaticCall(func: RedFunctionAst, memberOf: RedClassAst): string {
    let name: string = memberOf.aliasName ?? memberOf.name;

    return `${name}.${func.name}`;
  }

  protected override formatMemberCall(selfVar: CodeVariableFormat, func: RedFunctionAst): string {
    return `${selfVar.name}.${func.name}`;
  }

  protected override formatStaticCall(func: RedFunctionAst): string {
    return func.name;
  }

  private formatWrapMethod(func: RedFunctionAst, memberOf: RedClassAst): string {
    if (func.isNative) {
      return '';
    }
    const args: string = this.formatPrototypeArguments(func);
    const flags: string = this.formatFlags(func);
    const callArgs: string = this.formatCallArguments(func);
    const returnType: string = this.formatType(func.returnType);
    let code: string = '';

    code += `@wrapMethod(${memberOf.aliasName ?? memberOf.name})\n`;
    code += `${RedVisibilityDef[func.visibility]} ${flags}function ${func.name}(${args}) : ${returnType} {\n`;
    if (func.returnType) {
      code += `    var result: ${returnType} = ${func.name}(${callArgs});\n`;
      code += '    \n';
      code += '    return result;\n';
    } else {
      code += `    ${func.name}(${callArgs});\n`;
    }
    code += '}';
    return code;
  }

  private formatReplaceMethod(func: RedFunctionAst, memberOf: RedClassAst): string {
    if (func.isNative) {
      return '';
    }
    const args: string = this.formatPrototypeArguments(func);
    const flags: string = this.formatFlags(func);
    const returnType: string = this.formatType(func.returnType);
    let code: string = '';

    code += `@replaceMethod(${memberOf.aliasName ?? memberOf.name})\n`;
    code += `${RedVisibilityDef[func.visibility]} ${flags}function ${func.name}(${args}) : ${returnType} {\n`;
    if (func.returnType) {
      code += `    var result: ${returnType};\n`;
      code += '    \n';
      code += '    return result;\n';
    } else {
      code += '    \n';
    }
    code += '}';
    return code;
  }

  /* NOTE: as of 2026-11-10 replacing global functions is not supported.
           See `ModdingReference.script` for more information.
  private formatReplaceGlobal(func: RedFunctionAst): string {
    if (func.isNative) {
      return '';
    }
    const args: string = this.formatPrototypeArguments(func);
    const flags: string = this.formatFlags(func);
    const returnType: string = this.formatType(func.returnType);
    let code: string = '';

    code += `@replaceGlobal()\n`;
    code += `${RedVisibilityDef[func.visibility]} ${flags}function ${func.name}(${args}) -> ${returnType} {\n`;
    if (func.returnType) {
      code += `    let result: ${returnType};\n`;
      code += '    \n';
      code += '    return result;\n';
    } else {
      code += '    \n';
    }
    code += '}';
    return code;
  }
  */

  private formatPrototypeArguments(func: RedFunctionAst): string {
    return func.arguments.map((arg) => RedArgumentAst.toString(arg, CodeSyntax.redmod)).join(', ');
  }

  private formatCallArguments(func: RedFunctionAst): string {
    return func.arguments.map((arg) => arg.name).join(', ');
  }

  private formatType(type?: RedTypeAst): string {
    return type ? RedTypeAst.toString(type, CodeSyntax.redmod) : 'Void';
  }

  private formatFlags(func: RedFunctionAst): string {
    let flags: string = '';

    if (func.isFinal) {
      flags += 'final ';
    }
    if (func.isStatic) {
      flags += 'static ';
    }
    if (func.isConst) {
      flags += 'const ';
    }
    if (func.isQuest) {
      flags += 'quest ';
    }
    if (func.isCallback) {
      flags += 'event ';
    }
    return flags;
  }

}
