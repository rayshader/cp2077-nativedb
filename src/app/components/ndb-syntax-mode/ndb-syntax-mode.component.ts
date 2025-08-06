import {Component, computed, inject} from '@angular/core';
import {MatIconModule} from "@angular/material/icon";
import {MatButtonModule} from "@angular/material/button";
import {MatMenuModule} from "@angular/material/menu";
import {MatTooltipModule} from "@angular/material/tooltip";
import {CodeSyntax, SettingsService} from "../../../shared/services/settings.service";
import {MatDivider} from "@angular/material/divider";
import {ResponsiveService} from "../../../shared/services/responsive.service";

interface SyntaxOption {
  readonly value: CodeSyntax;
  readonly name: string;
  readonly disabled?: boolean;
}

interface SyntaxData {
  readonly code: CodeSyntax;
  readonly clipboard: CodeSyntax;

  readonly isMobile: boolean;
}

@Component({
  selector: 'ndb-syntax-mode',
  imports: [
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

  private readonly settingsService = inject(SettingsService);
  private readonly responsiveService = inject(ResponsiveService);

  private readonly clipboard = this.settingsService.clipboard;
  private readonly code = this.settingsService.code;
  private readonly isMobile = this.responsiveService.isMobile;

  readonly clipboardOptions: SyntaxOption[] = [
    {value: CodeSyntax.redscript, name: 'Redscript', disabled: false},
    {value: CodeSyntax.lua, name: 'Lua · CET', disabled: false},
    {value: CodeSyntax.cppRedLib, name: 'C++ · RedLib', disabled: false},
  ];
  readonly codeOptions: SyntaxOption[] = [
    {value: CodeSyntax.pseudocode, name: 'Pseudocode · Legacy', disabled: false},
    {value: CodeSyntax.redscript, name: 'Redscript', disabled: false},
  ];

  readonly data = computed<SyntaxData | undefined>(() => {
    const clipboard = this.clipboard();
    const code = this.code();
    const isMobile = this.isMobile();

    if (clipboard === undefined || code === undefined || isMobile === undefined) {
      return undefined;
    }
    return {
      clipboard: clipboard + 1,
      code: code + 1,
      isMobile: isMobile
    };
  });

  public selectClipboardSyntax(syntax: SyntaxOption): void {
    this.settingsService.updateClipboard(syntax.value);
  }

  public selectCodeSyntax(syntax: SyntaxOption): void {
    this.settingsService.updateCode(syntax.value);
  }

}
