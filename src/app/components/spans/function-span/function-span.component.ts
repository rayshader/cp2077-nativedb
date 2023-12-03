import {Component, Input} from '@angular/core';
import {ArgumentSpanComponent} from "../argument-span/argument-span.component";
import {TypeSpanComponent} from "../type-span/type-span.component";
import {RedFunctionAst} from "../../../../shared/red-ast/red-function.ast";
import {MatIconModule} from "@angular/material/icon";
import {RedPrimitiveDef, RedScopeDef} from "../../../../shared/red-ast/red-definitions.ast";
import {RedObjectAst} from "../../../../shared/red-ast/red-object.ast";
import {MatButtonModule} from "@angular/material/button";
import {RedTypeAst} from "../../../../shared/red-ast/red-type.ast";

@Component({
  selector: 'function-span',
  standalone: true,
  imports: [
    MatIconModule,
    MatButtonModule,
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

  @Input()
  canCopy: boolean = true;

  /**
   * Optional, when this function is a member of a class or a struct.
   */
  @Input()
  memberOf?: RedObjectAst;

  /**
   * Optional, documentation of this function.
   */
  @Input()
  documentation?: string;

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

  protected async copyToClipboard(): Promise<void> {
    if (!this.node) {
      return;
    }
    let data: string = '';
    let hasReturn: boolean = this.node.returnType.primitive != RedPrimitiveDef.Void;

    if (this.memberOf && !this.node.isStatic) {
      data += `let ${this.memberOf.name.toLowerCase()}: ${this.memberOf.name};\n`;
    }
    for (const arg of this.node.arguments) {
      data += `let ${arg.name}: ${RedTypeAst.toString(arg.type)};\n`;
    }
    if (hasReturn) {
      data += `let result: ${RedTypeAst.toString(this.node.returnType)};\n`;
    }
    if (this.memberOf || hasReturn || this.node.arguments.length > 0) {
      data += '\n';
    }
    if (hasReturn) {
      data += 'result = ';
    }
    if (this.memberOf) {
      data += (!this.node.isStatic) ? this.memberOf.name.toLowerCase() : this.memberOf.name;
      data += '.';
    }
    data += `${this.node.name}(`;
    data += this.node.arguments.map((argument) => argument.name).join(', ');
    data += ');';

    await navigator.clipboard.writeText(data);
  }

}
