import {Injectable} from "@angular/core";
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

  private readonly formatters: CodeFormatterItem[] = [
    {syntax: CodeSyntax.redscript, fmt: new RedscriptFormatter()},
    {syntax: CodeSyntax.lua, fmt: new LuaFormatter()},
    {syntax: CodeSyntax.cppRedLib, fmt: new CppRedLibFormatter()},
  ];

  private _syntax: CodeSyntax = CodeSyntax.lua;

  constructor(private readonly settingsService: SettingsService) {
    this.settingsService.clipboard$.subscribe(this.onClipboardChanged.bind(this));
  }

  public get syntax(): CodeSyntax {
    return this._syntax;
  }

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
    const item = this.formatters.find((item) => item.syntax === this._syntax);

    if (!item) {
      throw Error();
    }
    return item.fmt;
  }

  private onClipboardChanged(syntax: CodeSyntax): void {
    this._syntax = syntax;
  }
}
