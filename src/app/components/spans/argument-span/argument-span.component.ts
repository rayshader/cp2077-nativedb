import {Component, computed, inject, input} from '@angular/core';
import {TypeSpanComponent} from "../type-span/type-span.component";
import {RedArgumentAst} from "../../../../shared/red-ast/red-argument.ast";
import {CodeSyntax, SettingsService} from "../../../../shared/services/settings.service";

@Component({
  selector: 'argument-span',
  imports: [
    TypeSpanComponent
  ],
  templateUrl: './argument-span.component.html',
  styleUrl: './argument-span.component.scss'
})
export class ArgumentSpanComponent {

  private readonly settingsService = inject(SettingsService);

  readonly node = input<RedArgumentAst>();

  readonly syntax = computed(() => this.settingsService.code() + 1);
  readonly cpp: number = CodeSyntax.cppRED4ext + 1;

}
