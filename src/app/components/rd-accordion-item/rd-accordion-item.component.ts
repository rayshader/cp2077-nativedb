import {booleanAttribute, Component, Input} from '@angular/core';
import {CdkAccordionModule} from "@angular/cdk/accordion";
import {MatIconModule} from "@angular/material/icon";
import {MatButtonModule} from "@angular/material/button";
import {MatDividerModule} from "@angular/material/divider";

@Component({
  selector: 'rd-accordion-item',
  standalone: true,
  imports: [
    CdkAccordionModule,
    MatIconModule,
    MatButtonModule,
    MatDividerModule
  ],
  templateUrl: './rd-accordion-item.component.html',
  styleUrl: './rd-accordion-item.component.scss'
})
export class RDAccordionItemComponent {

  @Input({transform: booleanAttribute})
  expanded: boolean = false;

  @Input({transform: booleanAttribute})
  disabled: boolean = false;

}
