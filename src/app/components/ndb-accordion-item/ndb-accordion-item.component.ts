import {booleanAttribute, ChangeDetectionStrategy, Component, input} from '@angular/core';
import {CdkAccordionModule} from "@angular/cdk/accordion";
import {MatIconModule} from "@angular/material/icon";
import {MatButtonModule} from "@angular/material/button";
import {MatDividerModule} from "@angular/material/divider";

@Component({
  selector: 'ndb-accordion-item',
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

  expanded = input(false, {transform: booleanAttribute});
  disabled = input(false, {transform: booleanAttribute});

}
