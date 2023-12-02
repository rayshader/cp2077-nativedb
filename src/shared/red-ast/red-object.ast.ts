import {RedFunctionAst} from "./red-function.ast";
import {RedPropertyAst} from "./red-property.ast";

export interface RedObjectAst {
  readonly name: string;
  readonly properties: RedPropertyAst[];
  readonly functions: RedFunctionAst[];
}
