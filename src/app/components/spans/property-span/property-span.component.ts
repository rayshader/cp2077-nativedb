import {booleanAttribute, ChangeDetectionStrategy, Component, Input} from '@angular/core';
import {MatIconModule} from "@angular/material/icon";
import {TypeSpanComponent} from "../type-span/type-span.component";
import {RedPropertyAst} from "../../../../shared/red-ast/red-property.ast";
import {RedVisibilityDef} from "../../../../shared/red-ast/red-definitions.ast";
import {MatTooltipModule} from "@angular/material/tooltip";
import {NDBFormatOffsetPipe} from "../../../pipes/ndb-format-offset.pipe";

@Component({
  selector: 'property-span',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    MatIconModule,
    MatTooltipModule,
    TypeSpanComponent,
    NDBFormatOffsetPipe
  ],
  templateUrl: './property-span.component.html',
  styleUrl: './property-span.component.scss'
})
export class PropertySpanComponent {

  /**
   * Offset in pixels to add between badges and property's name, with at least 12px.
   */
  align: string = '12px';

  scope: string = '';

  node?: RedPropertyAst;

  @Input()
  documentation?: string;

  @Input({transform: booleanAttribute})
  showOffset: boolean = false;

  @Input('node')
  set _node(value: RedPropertyAst | undefined) {
    this.node = value;
    this.scope = (this.node) ? RedVisibilityDef[this.node.visibility] : '';
  }

  /**
   * Total number of badges to align with.
   */
  @Input()
  set badges(count: number) {
    // Compute remaining empty badges to align with.
    count--;
    if (this.node?.isPersistent) count--;
    /*
    if (this.node?.isReplicated) count--;
    if (this.node?.isInline) count--;
    if (this.node?.isEdit) count--;
    if (this.node?.isConst) count--;
    */
    count = Math.max(count, 0);
    this.align = `${count * 24 + 12}px`;
  }

}
