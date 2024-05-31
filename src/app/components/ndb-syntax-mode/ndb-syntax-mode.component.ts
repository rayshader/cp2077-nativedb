import {Component} from '@angular/core';
import {MatIconModule} from "@angular/material/icon";
import {MatButtonModule} from "@angular/material/button";
import {MatMenuModule} from "@angular/material/menu";
import {MatTooltipModule} from "@angular/material/tooltip";
import {CodeSyntax, SettingsService} from "../../../shared/services/settings.service";
import {MatDivider} from "@angular/material/divider";
import {combineLatest, map, Observable} from "rxjs";
import {AsyncPipe} from "@angular/common";
import {ResponsiveService} from "../../../shared/services/responsive.service";

interface SyntaxOption {
  readonly value: CodeSyntax;
  readonly name: string;
  readonly disabled?: boolean;
}

interface SyntaxData {
  readonly codeSyntax: CodeSyntax;
  readonly clipboardSyntax: CodeSyntax;

  readonly isMobile: boolean;
}

@Component({
  selector: 'ndb-syntax-mode',
  standalone: true,
  imports: [
    AsyncPipe,
    MatDivider,
    MatIconModule,
    MatMenuModule,
    MatButtonModule,
    MatTooltipModule,
  ],
  templateUrl: './ndb-syntax-mode.component.html',
  styleUrl: './ndb-syntax-mode.component.scss'
})
export class NDBSyntaxModeComponent {

  readonly clipboardOptions: SyntaxOption[] = [
    {value: CodeSyntax.redscript, name: 'Redscript', disabled: false},
    {value: CodeSyntax.lua, name: 'Lua · CET', disabled: false},
    {value: CodeSyntax.cppRedLib, name: 'C++ · RedLib', disabled: false},
  ];
  readonly codeOptions: SyntaxOption[] = [
    {value: CodeSyntax.pseudocode, name: 'Pseudocode · Legacy', disabled: false},
    {value: CodeSyntax.redscript, name: 'Redscript', disabled: false},
  ];

  readonly data$: Observable<SyntaxData>;

  constructor(private readonly settingsService: SettingsService,
              private readonly responsiveService: ResponsiveService) {
    this.data$ = this.getData();
  }

  public selectClipboardSyntax(syntax: SyntaxOption): void {
    this.settingsService.updateClipboard(syntax.value);
  }

  public selectCodeSyntax(syntax: SyntaxOption): void {
    this.settingsService.updateCode(syntax.value);
  }

  private getData(): Observable<SyntaxData> {
    return combineLatest([
      this.settingsService.clipboard$.pipe(map((code) => code + 1)),
      this.settingsService.code$.pipe(map((code) => code + 1)),
      this.responsiveService.mobile$,
    ]).pipe(map(([clipboard, code, isMobile]) => {
      return {
        clipboardSyntax: clipboard,
        codeSyntax: code,
        isMobile: isMobile
      };
    }));
  }

}
