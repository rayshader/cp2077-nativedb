import {RedFunctionAst} from "./red-function.ast";
import {RedPropertyAst} from "./red-property.ast";
import {RedNodeAst} from "./red-node.ast";
import {RedOriginDef, RedScopeDef} from "./red-definitions.ast";

export interface RedObjectAst extends RedNodeAst {
  readonly scope: RedScopeDef;
  readonly origin: RedOriginDef;
  readonly name: string;
  readonly properties: RedPropertyAst[];
  readonly functions: RedFunctionAst[];
  readonly parent?: string;
}
