import {booleanAttribute, ChangeDetectionStrategy, Component, Input} from '@angular/core';
import {CdkAccordionModule} from "@angular/cdk/accordion";
import {MatIconModule} from "@angular/material/icon";
import {MatButtonModule} from "@angular/material/button";
import {MatDividerModule} from "@angular/material/divider";

@Component({
  selector: 'ndb-accordion-item',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    CdkAccordionModule,
    MatIconModule,
    MatButtonModule,
    MatDividerModule
  ],
  templateUrl: './ndb-accordion-item.component.html',
  styleUrl: './ndb-accordion-item.component.scss'
})
export class NDBAccordionItemComponent {

  @Input({transform: booleanAttribute})
  expanded: boolean = false;

  @Input({transform: booleanAttribute})
  disabled: boolean = false;

}
