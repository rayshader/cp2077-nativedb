import {Component, Input} from '@angular/core';
import {ArgumentSpanComponent} from "../argument-span/argument-span.component";
import {TypeSpanComponent} from "../type-span/type-span.component";
import {RedFunctionAst} from "../../../../shared/red-ast/red-function.ast";
import {MatIconModule} from "@angular/material/icon";
import {RedScopeDef} from "../../../../shared/red-ast/red-definitions.ast";

@Component({
  selector: 'function-span',
  standalone: true,
  imports: [
    MatIconModule,
    ArgumentSpanComponent,
    TypeSpanComponent
  ],
  templateUrl: './function-span.component.html',
  styleUrl: './function-span.component.scss'
})
export class FunctionSpanComponent {

  /**
   * Offset in pixels to add between badges and function's name, with at least 12px.
   */
  align: number = 12;

  @Input()
  node?: RedFunctionAst;

  /**
   * Total number of badges to align with.
   */
  @Input()
  set badges(count: number) {
    // Compute remaining empty badges to align with.
    count--;
    if (this.node?.isFinal) count--;
    if (this.node?.isStatic) count--;
    if (this.node?.isNative) count--;
    if (this.node?.isConst) count--;
    if (this.node?.isQuest) count--;
    if (this.node?.isCallback) count--;
    count = Math.max(count, 0);
    this.align = count * 24 + 12;
  }

  /**
   * Return 'public', 'protected' or 'private'.
   */
  get scope(): string {
    if (!this.node) {
      return '';
    }
    return RedScopeDef[this.node.scope];
  }

}
