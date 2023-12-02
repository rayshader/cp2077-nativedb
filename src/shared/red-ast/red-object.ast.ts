import {RedFunctionAst} from "./red-function.ast";
import {RedPropertyAst} from "./red-property.ast";
import {RedNodeAst} from "./red-node.ast";

export interface RedObjectAst extends RedNodeAst {
  readonly name: string;
  readonly properties: RedPropertyAst[];
  readonly functions: RedFunctionAst[];
}
