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
    if (type.startsWith('Observe')) {
      return this.formatObserve(func, memberOf, type === 'ObserveAfter');
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

  private formatObserve(func: RedFunctionAst, memberOf: RedClassAst, isAfter: boolean): string {
    let funcName: string = func.isStatic ? func.fullName : func.name;
    let nativePrefix: number = funcName.indexOf('::');

    if (nativePrefix !== -1) {
      funcName = funcName.substring(nativePrefix + 2);
    }
    let callback: string = '';

    if (!func.isStatic) {
      callback += 'this';
      if (func.arguments.length > 0) {
        callback += ', ';
      }
    }
    callback += func.arguments.map((arg) => arg.name).join(', ');
    let code: string = '';
    let after: string = isAfter ? 'After' : '';

    code += `Observe${after}('${memberOf.aliasName ?? memberOf.name}', '${funcName}', function(${callback})\n`;
    if (!isAfter) {
      code += `    -- method has just been called with:\n`;
    } else {
      code += `    -- method has been called and fully executed with:\n`;
    }
    if (!func.isStatic) {
      code += `    -- this: ${memberOf.aliasName ?? memberOf.name}\n`;
    }
    for (const argument of func.arguments) {
      code += `    -- ${argument.name}: ${RedTypeAst.toString(argument.type, CodeSyntax.redscript)}\n`;
    }
    code += 'end)\n';
    return code;
  }

  private formatOverride(func: RedFunctionAst, memberOf: RedClassAst): string {
    let funcName: string = func.isStatic ? func.fullName : func.name;
    let nativePrefix: number = funcName.indexOf('::');

    if (nativePrefix !== -1) {
      funcName = funcName.substring(nativePrefix + 2);
    }
    let callback: string = '';

    if (!func.isStatic) {
      callback += 'this';
      if (func.arguments.length > 0) {
        callback += ', ';
      }
    }
    callback += func.arguments.map((arg) => arg.name).join(', ');
    if (callback.length !== 0) {
      callback += ', ';
    }
    callback += 'wrappedMethod';
    const args: string = func.arguments.map((arg) => arg.name).join(', ');
    let code: string = '';

    code += `Override('${memberOf.aliasName ?? memberOf.name}', '${funcName}', function(${callback})\n`;
    code += '    -- rewrite method with:\n';
    if (!func.isStatic) {
      code += `    -- this: ${memberOf.aliasName ?? memberOf.name}\n`;
    }
    for (const argument of func.arguments) {
      code += `    -- ${argument.name}: ${RedTypeAst.toString(argument.type, CodeSyntax.redscript)}\n`;
    }
    code += '    \n';
    if (func.returnType) {
      code += `    -- Do stuff before\n`;
      code += `    local result = wrappedMethod(${args})\n`;
      code += '    \n';
      code += `    -- Do stuff after\n`;
      code += `    return result\n`;
    } else {
      code += `    -- Do stuff before\n`;
      code += `    wrappedMethod(${args})\n`;
      code += `    -- Do stuff after\n`;
    }
    code += 'end)\n';
    return code;
  }

  private formatNewProxy(func: RedFunctionAst, memberOf: RedClassAst): string {
    const pseudoArgs: string = func.arguments
      .map((arg) => RedTypeAst.toString(arg.type, CodeSyntax.pseudocode))
      .map((arg) => `"${arg}"`)
      .join(', ');
    const args: string = func.arguments.map((arg) => arg.name).join(', ');
    let code: string = '';

    code += `listener = NewProxy("${memberOf.aliasName ?? memberOf.name}", {\n`;
    code += `    ${func.name} = {\n`;
    code += `        args = {${pseudoArgs}},\n`;
    code += `        callback = function(${args})\n`;
    code += '            -- Do stuff\n';
    code += '        end\n';
    code += '    }\n';
    code += '})\n';
    return code;
  }

}
