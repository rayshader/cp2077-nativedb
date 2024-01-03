import {Component, Input} from '@angular/core';
import {ClassMergeOperation} from "../../../shared/services/documentation.service";
import {NDBAccordionItemComponent} from "../ndb-accordion-item/ndb-accordion-item.component";
import {MatChipsModule} from "@angular/material/chips";
import {EMPTY, map, Observable} from "rxjs";
import {AsyncPipe} from "@angular/common";
import {RedDumpService} from "../../../shared/services/red-dump.service";
import {RedClassAst} from "../../../shared/red-ast/red-class.ast";
import {MatIconModule} from "@angular/material/icon";
import {NDBMergeBodyComponent} from "./ndb-merge-body/ndb-merge-body.component";
import {NDBMergeFunctionComponent} from "./ndb-merge-function/ndb-merge-function.component";

@Component({
  selector: 'ndb-merge-documentation',
  standalone: true,
  imports: [
    AsyncPipe,
    MatIconModule,
    MatChipsModule,
    NDBAccordionItemComponent,
    NDBMergeBodyComponent,
    NDBMergeFunctionComponent
  ],
  templateUrl: './ndb-merge-documentation.component.html',
  styleUrl: './ndb-merge-documentation.component.scss'
})
export class NDBMergeDocumentationComponent {

  data$: Observable<RedClassAst> = EMPTY;

  merge?: ClassMergeOperation;

  constructor(private readonly dumpService: RedDumpService) {

  }

  @Input('merge')
  set _merge(value: ClassMergeOperation) {
    this.merge = value;
    this.data$ = this.dumpService.getById(value.id).pipe(map((object) => object as RedClassAst));
  }

}
