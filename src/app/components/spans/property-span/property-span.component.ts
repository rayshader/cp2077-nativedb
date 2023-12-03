import {Component, Input} from '@angular/core';
import {MatIconModule} from "@angular/material/icon";
import {TypeSpanComponent} from "../type-span/type-span.component";
import {RedPropertyAst} from "../../../../shared/red-ast/red-property.ast";
import {MatButtonModule} from "@angular/material/button";
import {RedScopeDef} from "../../../../shared/red-ast/red-definitions.ast";

@Component({
  selector: 'property-span',
  standalone: true,
  imports: [
    MatIconModule,
    TypeSpanComponent,
    MatButtonModule,
  ],
  templateUrl: './property-span.component.html',
  styleUrl: './property-span.component.scss'
})
export class PropertySpanComponent {

  /**
   * Offset in pixels to add between badges and property's name, with at least 12px.
   */
  align: number = 12;

  @Input()
  node?: RedPropertyAst;

  @Input()
  documentation?: string;

  /**
   * Total number of badges to align with.
   */
  @Input()
  set badges(count: number) {
    // Compute remaining empty badges to align with.
    count--;
    if (this.node?.isInline) count--;
    if (this.node?.isEdit) count--;
    if (this.node?.isNative) count--;
    if (this.node?.isPersistent) count--;
    if (this.node?.isReplicated) count--;
    if (this.node?.isConst) count--;
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
