import {Component} from '@angular/core';
import {MatTabsModule} from "@angular/material/tabs";
import {Observable} from "rxjs";
import {MatIconModule} from "@angular/material/icon";
import {AsyncPipe, NgTemplateOutlet} from "@angular/common";
import {RedDumpService} from "../../../shared/services/red-dump.service";
import {RouterLink} from "@angular/router";
import {RedEnumAst} from "../../../shared/red-ast/red-enum.ast";
import {RedBitfieldAst} from "../../../shared/red-ast/red-bitfield.ast";
import {RedClassAst} from "../../../shared/red-ast/red-class.ast";
import {RedFunctionAst} from "../../../shared/red-ast/red-function.ast";

@Component({
  selector: 'red-ast-tabs',
  standalone: true,
  imports: [
    MatTabsModule,
    MatIconModule,
    NgTemplateOutlet,
    AsyncPipe,
    RouterLink
  ],
  templateUrl: './red-ast-tabs.component.html',
  styleUrl: './red-ast-tabs.component.scss'
})
export class RedAstTabsComponent {
  readonly enums$: Observable<RedEnumAst[]>;
  readonly bitfields$: Observable<RedBitfieldAst[]>;
  readonly classes$: Observable<RedClassAst[]>;
  readonly structs$: Observable<RedClassAst[]>;
  readonly functions$: Observable<RedFunctionAst[]>;

  constructor(private readonly dumpService: RedDumpService) {
    this.enums$ = this.dumpService.enums$;
    this.bitfields$ = this.dumpService.bitfields$;
    this.classes$ = this.dumpService.classes$;
    this.structs$ = this.dumpService.structs$;
    this.functions$ = this.dumpService.functions$;
  }
}
