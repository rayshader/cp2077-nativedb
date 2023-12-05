import {Component, Input} from '@angular/core';
import {TypeSpanComponent} from "../type-span/type-span.component";
import {RedArgumentAst} from "../../../../shared/red-ast/red-argument.ast";

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
