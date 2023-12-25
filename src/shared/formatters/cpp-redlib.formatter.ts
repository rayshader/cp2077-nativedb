import {RedFunctionAst} from "../red-ast/red-function.ast";
import {RedClassAst} from "../red-ast/red-class.ast";
import {CodeFormatter} from "./formatter";

export class CppRedLibFormatter implements CodeFormatter {

  formatCode(node: RedFunctionAst, memberOf?: RedClassAst): string {
    return '';
    /*
    let data: string = '';
    let hasReturn: boolean = node.returnType !== undefined;

    if (memberOf && !node.isStatic) {
      data += `let ${memberOf.name.toLowerCase()}: ${memberOf.name};\n`;
    }
    for (const arg of node.arguments) {
      data += `let ${arg.name}: ${RedTypeAst.toString(arg.type)};\n`;
    }
    if (hasReturn) {
      data += `let result: ${RedTypeAst.toString(node.returnType!)};\n`;
    }
    if (memberOf || hasReturn || node.arguments.length > 0) {
      data += '\n';
    }
    if (hasReturn) {
      data += 'result = ';
    }
    if (memberOf) {
      data += (!node.isStatic) ? memberOf.name.toLowerCase() : memberOf.name;
      data += '.';
    }
    data += `${node.name}(`;
    data += node.arguments.map((argument) => argument.name).join(', ');
    data += ');';
    return data;
    */
  }

}
