import {RedFunctionAst} from "../red-ast/red-function.ast";
import {RedClassAst} from "../red-ast/red-class.ast";
import {CodeFormatter, CodeVariableFormat} from "./formatter";
import {RedTypeAst} from "../red-ast/red-type.ast";
import {RedArgumentAst} from "../red-ast/red-argument.ast";
import {CodeSyntax} from "../services/settings.service";

export enum LuaPrimitiveDef {
  Void = 'void',
  Bool = 'Bool',
  Int8 = 'Int8',
  Uint8 = 'Uint8',
  Int16 = 'Int16',
  Uint16 = 'Uint16',
  Int32 = 'Int32',
  Uint32 = 'Uint32',
  Int64 = 'Int64',
  Uint64 = 'Uint64',
  Float = 'Float',
  Double = 'Double',
  String = 'String',
  LocalizationString = 'LocalizationString',
  CName = 'string | CName',
  TweakDBID = 'TweakDBID',
  NodeRef = 'NodeRef',
  DataBuffer = 'DataBuffer',
  serializationDeferredDataBuffer = 'serializationDeferredDataBuffer',
  SharedDataBuffer = 'SharedDataBuffer',
  CDateTime = 'CDateTime',
  CGUID = 'CGUID',
  CRUID = 'CRUID',
  //CRUIDRef = 'any',
  EditorObjectID = 'EditorObjectID',
  //GamedataLocKeyWrapper = 'any',
  MessageResourcePath = 'MessageResourcePath',
  //RuntimeEntityRef = 'RuntimeEntityRef',
  Variant = 'Variant'
}

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
    let luadoc: string = '';
    let callback: string = '';

    if (!func.isStatic) {
      luadoc += `---@param this ${memberOf.aliasName ?? memberOf.name}`;
      callback += 'this';
      if (func.arguments.length > 0) {
        luadoc += '\n';
        callback += ', ';
      }
    }
    luadoc += func.arguments
      .map((arg) => `---@param ${arg.name}${arg.isOptional ? '?' : ''} ${RedTypeAst.toLuadoc(arg.type)}`)
      .join('\n');
    callback += func.arguments
      .map((arg) => arg.name)
      .join(', ');
    let code: string = '';
    let after: string = isAfter ? 'After' : '';

    code += `Observe${after}("${memberOf.aliasName ?? memberOf.name}", "${funcName}",\n`;
    code += `${luadoc}\n`;
    code += `function(${callback})\n`;
    if (!isAfter) {
      code += `    -- method has just been called\n`;
    } else {
      code += `    -- method has been called and fully executed\n`;
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
    let luadoc: string = '';
    let callback: string = '';

    if (!func.isStatic) {
      luadoc += `---@param this ${memberOf.aliasName ?? memberOf.name}`;
      callback += 'this';
      if (func.arguments.length > 0) {
        luadoc += '\n';
        callback += ', ';
      }
    }
    luadoc += func.arguments
      .map((arg) => `---@param ${arg.name}${arg.isOptional ? '?' : ''} ${RedTypeAst.toLuadoc(arg.type)}`)
      .join('\n');
    callback += func.arguments
      .map((arg) => arg.name)
      .join(', ');
    luadoc += '\n';
    luadoc += `---@param wrappedMethod function`;
    if (func.returnType) {
      luadoc += '\n';
      luadoc += `---@return ${RedTypeAst.toLuadoc(func.returnType)}`;
    }
    if (callback.length !== 0) {
      callback += ', ';
    }
    callback += 'wrappedMethod';
    const args: string = func.arguments.map((arg) => arg.name).join(', ');
    let code: string = '';

    code += `Override("${memberOf.aliasName ?? memberOf.name}", "${funcName}",\n`;
    code += `${luadoc}\n`;
    code += `function(${callback})\n`;
    code += '    -- rewrite method\n';
    if (func.returnType) {
      code += `    local result = wrappedMethod(${args})\n`;
      code += '    \n';
      code += `    return result\n`;
    } else {
      code += `    wrappedMethod(${args})\n`;
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
    code += '            -- do stuff\n';
    code += '        end\n';
    code += '    }\n';
    code += '})\n';
    return code;
  }

}
