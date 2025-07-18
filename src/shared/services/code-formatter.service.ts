import {inject, Injectable, Signal} from "@angular/core";
import {CodeFormatter} from "../formatters/formatter";
import {CodeSyntax, SettingsService} from "./settings.service";
import {RedscriptFormatter} from "../formatters/redscript.formatter";
import {LuaFormatter} from "../formatters/lua.formatter";
import {CppRedLibFormatter} from "../formatters/cpp-redlib.formatter";
import {RedFunctionAst} from "../red-ast/red-function.ast";
import {RedClassAst} from "../red-ast/red-class.ast";

interface CodeFormatterItem {
  readonly syntax: CodeSyntax;
  readonly fmt: CodeFormatter;
}

@Injectable({
  providedIn: 'root'
})
export class CodeFormatterService {

  private readonly settingsService: SettingsService = inject(SettingsService);

  private readonly formatters: CodeFormatterItem[] = [
    {syntax: CodeSyntax.redscript, fmt: new RedscriptFormatter()},
    {syntax: CodeSyntax.lua, fmt: new LuaFormatter()},
    {syntax: CodeSyntax.cppRedLib, fmt: new CppRedLibFormatter()},
  ];

  private readonly _syntax = this.settingsService.clipboard;

  readonly syntax: Signal<CodeSyntax> = this._syntax;

  formatPrototype(func: RedFunctionAst): string {
    const formatter: CodeFormatter = this.getCodeFormatter();

    return formatter.formatPrototype(func);
  }

  formatCall(func: RedFunctionAst, memberOf?: RedClassAst): string {
    const formatter: CodeFormatter = this.getCodeFormatter();

    return formatter.formatCall(func, memberOf);
  }

  formatSpecial(type: string, func: RedFunctionAst, memberOf?: RedClassAst): string {
    const formatter: CodeFormatter = this.getCodeFormatter();

    return formatter.formatSpecial(type, func, memberOf);
  }

  private getCodeFormatter(): CodeFormatter {
    const syntax = this.syntax();
    const item = this.formatters.find((item) => item.syntax === syntax);

    if (!item) {
      throw Error();
    }
    return item.fmt;
  }

}
