import { RedClassAst } from '../red-ast/red-class.ast';
import { RedFunctionAst } from '../red-ast/red-function.ast';
import { RedTypeAst } from '../red-ast/red-type.ast';
import { CodeSyntax } from '../services/settings.service';
import { CodeFormatter, CodeVariableFormat } from './formatter';

export class Red4extRsFormatter extends CodeFormatter {
  constructor() {
    super(false, 'none');
  }
  override formatPrototype(func: RedFunctionAst): string {
    const args: string = this.formatPrototypeArguments(func);
    const returnType: string = this.formatType(func.returnType);
    const annotation: string = func.isNative
      ? '#[redscript_global(native)]'
      : '#[redscript_global]';

    return `${annotation}\npub fn ${this.camelToSnakeCase(
      func.name
    )}(${args}) -> ${returnType}`;
  }

  override formatSpecial(
    type: string,
    func: RedFunctionAst,
    memberOf?: RedClassAst
  ): string {
    return 'TODO';
  }

  protected override formatSelf(
    func: RedFunctionAst,
    memberOf?: RedClassAst
  ): CodeVariableFormat | undefined {
    return undefined;
  }

  protected override formatReturn(
    func: RedFunctionAst
  ): CodeVariableFormat | undefined {
    return undefined;
  }

  protected override formatArguments(
    func: RedFunctionAst,
    selfName?: string
  ): CodeVariableFormat[] {
    return [];
  }

  protected override formatMemberStaticCall(
    func: RedFunctionAst,
    memberOf: RedClassAst
  ): string {
    const args: string = this.formatPrototypeArguments(func);
    const returnType: string = this.formatType(func.returnType);
    const annotation: string = func.isNative ? `#[redscript(native)]\n` : '';
    return `#[redscript_import]
impl ${memberOf.name} {
  ${annotation}pub fn ${this.camelToSnakeCase(
      func.name
    )}(${args}) -> ${returnType};
}`;
  }

  protected override formatMemberCall(
    selfVar: CodeVariableFormat,
    func: RedFunctionAst
  ): string {
    return 'TODO';
  }

  protected override formatStaticCall(func: RedFunctionAst): string {
    return 'TODO';
  }

  private formatPrototypeArguments(func: RedFunctionAst): string {
    return func.arguments
      .map(
        (arg) =>
          `${this.camelToSnakeCase(arg.name)}: ${this.formatType(arg.type)}`
      )
      .join(', ');
  }

  private formatCallArguments(func: RedFunctionAst): string {
    return func.arguments.map((arg) => arg.name).join(', ');
  }

  private formatType(type?: RedTypeAst): string {
    return type ? RedTypeAst.toString(type, CodeSyntax.rustRED4ext) : '()';
  }

  private formatFlags(func: RedFunctionAst): string {
    return 'TODO';
  }

  private camelToSnakeCase(str: string) {
    return str.replace(/[A-Z]/g, (letter, offset) =>
      offset > 0 ? `_${letter.toLowerCase()}` : letter.toLowerCase()
    );
  }
}
