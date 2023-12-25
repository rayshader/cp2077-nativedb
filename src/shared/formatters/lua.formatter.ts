import {RedFunctionAst} from "../red-ast/red-function.ast";
import {RedClassAst} from "../red-ast/red-class.ast";
import {CodeFormatter} from "./formatter";
import {RedTypeAst} from "../red-ast/red-type.ast";
import {RedArgumentAst} from "../red-ast/red-argument.ast";
import {RedPrimitiveDef, RedTemplateDef} from "../red-ast/red-definitions.ast";

export class LuaFormatter implements CodeFormatter {

  formatCode(node: RedFunctionAst, memberOf?: RedClassAst): string {
    let data: string = '';
    let hasReturn: boolean = node.returnType !== undefined;

    if (memberOf && !node.isStatic) {
      data += `local ${memberOf.name.toLowerCase()} = nil\n`;
    }
    for (let i: number = 0; i < node.arguments.length; i++) {
      const arg: RedArgumentAst = node.arguments[i];

      if (!memberOf || (memberOf.name === 'ScriptGameInstance' && i > 0)) {
        data += `${this.formatArgument(arg)}\n`;
      }
    }
    if (hasReturn) {
      data += `local ${this.formatResultName(node.name)} = ${this.formatType(node.returnType!)}\n`;
    }
    if (memberOf || hasReturn || node.arguments.length > 0) {
      data += '\n';
    }
    if (hasReturn) {
      data += `${this.formatResultName(node.name)} = `;
    }
    if (memberOf) {
      data += (!node.isStatic) ? memberOf.name.toLowerCase() : this.formatAlias(memberOf);
      data += (!node.isStatic) ? ':' : '.';
    }
    if (node.name === node.fullName) {
      data += node.name;
    } else {
      data += `['${node.fullName}']`;
    }
    data += '(';
    data += node.arguments
      .filter((argument, i) => !memberOf || (memberOf.name === 'ScriptGameInstance' && i > 0))
      .map((argument) => argument.name)
      .join(', ');
    data += ');';
    return data;
  }

  private formatArgument(argument: RedArgumentAst): string {
    return `local ${argument.name} = ${this.formatType(argument.type)}`;
  }

  private formatType(type: RedTypeAst, isReturnType?: boolean): string {
    if (type.flag === undefined) {
      return type.name;
    }
    if (type.flag === RedPrimitiveDef.Bool) {
      return 'false';
    } else if (type.flag >= RedPrimitiveDef.Int8 && type.flag <= RedPrimitiveDef.Uint64) {
      return '0';
    } else if (type.flag === RedPrimitiveDef.Float || type.flag === RedPrimitiveDef.Double) {
      return '0.0';
    } else if (type.flag === RedPrimitiveDef.String) {
      return '""';
    } else if (type.flag === RedPrimitiveDef.CName) {
      return 'CName.new("name")';
    }
    if (type.flag === RedTemplateDef.array) {
      return `[] -- ${type.innerType!.name}`;
    } else if (type.flag == RedTemplateDef.ref || type.flag === RedTemplateDef.wref) {
      return `nil -- ${type.innerType!.name}`;
    }
    return type.name;
  }

  private formatResultName(name: string): string {
    let lowName: string = name.toLowerCase();
    let offset: number = -1;

    if (lowName.startsWith('get') || lowName.startsWith('has')) {
      offset = 3;
    } else if (lowName.startsWith('is')) {
      offset = 2;
    } else if (lowName.startsWith('find')) {
      let by: number = lowName.indexOf('by');

      offset = 4;
      if (by !== -1) {
        name = name.substring(0, by);
      }
    }
    if (offset !== -1) {
      name = name.substring(offset);
      name = `${name[0].toLowerCase()}${name.substring(1)}`;
    }
    return name;
  }

  private formatAlias(memberOf: RedClassAst): string {
    if (memberOf.name === 'ScriptGameInstance') {
      return 'Game';
    }
    return memberOf.name;
  }

}
