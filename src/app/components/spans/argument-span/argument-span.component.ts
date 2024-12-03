import {Component, Input} from '@angular/core';
import {TypeSpanComponent} from "../type-span/type-span.component";
import {RedArgumentAst} from "../../../../shared/red-ast/red-argument.ast";
import {map, Observable} from "rxjs";
import {CodeSyntax, SettingsService} from "../../../../shared/services/settings.service";
import {AsyncPipe} from "@angular/common";

@Component({
  selector: 'argument-span',
  imports: [
    AsyncPipe,
    TypeSpanComponent
  ],
  templateUrl: './argument-span.component.html',
  styleUrl: './argument-span.component.scss'
})
export class ArgumentSpanComponent {

  @Input()
  node?: RedArgumentAst;

  protected readonly syntax$: Observable<number>;
  protected readonly cpp: number = CodeSyntax.cppRED4ext + 1;

  constructor(private readonly settingsService: SettingsService) {
    this.syntax$ = this.settingsService.code$.pipe(map((value) => value + 1));
  }

}
