import {Component, Input} from '@angular/core';
import {RedArgumentAst} from "../../../../shared/red-ast/red-argument.ast";
import {TypeSpanComponent} from "../type-span/type-span.component";

@Component({
  selector: 'argument-span',
  standalone: true,
  imports: [
    TypeSpanComponent
  ],
  templateUrl: './argument-span.component.html',
  styleUrl: './argument-span.component.scss'
})
export class ArgumentSpanComponent {

  @Input()
  node?: RedArgumentAst;

}
