import {RedFunctionAst} from "../red-ast/red-function.ast";
import {RedClassAst} from "../red-ast/red-class.ast";
import {CodeFormatter, CodeVariableFormat} from "./formatter";
import {RedTypeAst} from "../red-ast/red-type.ast";
import {NDBFormatCodePipe} from "../../app/pipes/ndb-format-code.pipe";
import {CodeSyntax} from "../services/settings.service";
import {RedPrimitiveDef} from "../red-ast/red-definitions.ast";

export class CppRedLibFormatter extends CodeFormatter {

  private readonly formatCodePipe: NDBFormatCodePipe;

  constructor() {
    super(true, 'close-only');
    this.formatCodePipe = new NDBFormatCodePipe();
  }

  protected override formatSelf(func: RedFunctionAst, memberOf?: RedClassAst | undefined): CodeVariableFormat | undefined {
    if (func.isStatic || !memberOf) {
      return undefined;
    }
    const name: string = memberOf.name;

    return {
      prefix: `Red::Handle<${name}> `,
      name: name.toLowerCase(),
      suffix: `;`
    };
  }

  protected override formatReturn(func: RedFunctionAst): CodeVariableFormat | undefined {
    return undefined;
  }

  protected override formatArguments(func: RedFunctionAst, selfName?: string): CodeVariableFormat[] {
    const argVars: CodeVariableFormat[] = [];

    if (func.returnType) {
      const type: string = this.formatType(func.returnType);
      const initializer: string = func.returnType.innerType === undefined && !RedTypeAst.isPrimitive(func.returnType) ? '{}' : '';

      argVars.push({
        prefix: `${type} `,
        name: this.formatReturnName(func),
        suffix: `${initializer};`
      });
    }
    for (const arg of func.arguments) {
      let type: string = this.formatType(arg.type);

      if (arg.isOptional) {
        type = `Red::Optional<${type}>`;
      }
      argVars.push({
        prefix: `${type} `,
        name: this.formatArgumentName(arg.name),
        suffix: ';'
      });
    }
    return argVars;
  }

  protected override formatMemberStaticCall(func: RedFunctionAst, memberOf: RedClassAst): string {
    let nextArg: string = '';

    if (func.returnType || func.arguments.length > 0) {
      nextArg = ', ';
    }
    return `Red::CallStatic("${memberOf.name}", "${func.fullName}"${nextArg}`;
  }

  protected override formatMemberCall(selfVar: CodeVariableFormat, func: RedFunctionAst): string {
    let nextArg: string = '';

    if (func.returnType || func.arguments.length > 0) {
      nextArg = ', ';
    }
    return `Red::CallVirtual(${selfVar.name}, "${func.fullName}"${nextArg}`;
  }

  protected override formatStaticCall(func: RedFunctionAst): string {
    let nextArg: string = '';

    if (func.returnType || func.arguments.length > 0) {
      nextArg = ', ';
    }
    return `Red::CallGlobal("${func.fullName}"${nextArg}`;
  }

  private formatType(type: RedTypeAst): string {
    let code: string = '';

    if (type.flag === undefined || !(type.flag >= RedPrimitiveDef.Void && type.flag <= RedPrimitiveDef.Double)) {
      code += 'Red::';
    }
    code += this.formatCodePipe.transform(type, CodeSyntax.cppRedLib);
    if (type.innerType) {
      code += '<';
      code += this.formatType(type.innerType);
      if (type.size !== undefined) {
        code += `, ${type.size}`;
      }
      code += '>';
    }
    return code;
  }

}
