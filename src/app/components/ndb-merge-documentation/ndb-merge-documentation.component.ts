import {Component, EventEmitter, Input, Output} from '@angular/core';
import {
  ClassMergeOperation,
  MemberMergeOperation,
  MergeOperation
} from "../../../shared/services/documentation.service";
import {NDBAccordionItemComponent} from "../ndb-accordion-item/ndb-accordion-item.component";
import {MatChipsModule} from "@angular/material/chips";
import {EMPTY, map, Observable} from "rxjs";
import {AsyncPipe} from "@angular/common";
import {RedDumpService} from "../../../shared/services/red-dump.service";
import {RedClassAst} from "../../../shared/red-ast/red-class.ast";
import {MatIconModule} from "@angular/material/icon";
import {NDBMergeBodyComponent} from "./ndb-merge-body/ndb-merge-body.component";
import {NDBMergeFunctionComponent} from "./ndb-merge-function/ndb-merge-function.component";
import {MatDividerModule} from "@angular/material/divider";

@Component({
  selector: 'ndb-merge-documentation',
  standalone: true,
  imports: [
    AsyncPipe,
    MatIconModule,
    MatChipsModule,
    NDBAccordionItemComponent,
    NDBMergeBodyComponent,
    NDBMergeFunctionComponent,
    MatDividerModule
  ],
  templateUrl: './ndb-merge-documentation.component.html',
  styleUrl: './ndb-merge-documentation.component.scss'
})
export class NDBMergeDocumentationComponent {

  @Output()
  updated: EventEmitter<void> = new EventEmitter();

  data$: Observable<RedClassAst> = EMPTY;

  merge?: ClassMergeOperation;
  additions: number = 0;
  modifications: number = 0;
  deletions: number = 0;

  constructor(private readonly dumpService: RedDumpService) {

  }

  @Input('merge')
  set _merge(value: ClassMergeOperation) {
    this.merge = value;
    this.data$ = this.dumpService.getById(value.id).pipe(map((object) => object as RedClassAst));
    this.computeOperations();
  }

  private computeOperations(): void {
    if (!this.merge) {
      return;
    }
    if (this.merge.body?.operation === MergeOperation.add) {
      this.additions++;
    } else if (this.merge.body?.operation === MergeOperation.update) {
      this.modifications++;
    } else if (this.merge.body?.operation === MergeOperation.delete) {
      this.deletions++;
    }
    const members: MemberMergeOperation[] = this.merge.members ?? [];

    for (const member of members) {
      if (member.operation === MergeOperation.add) {
        this.additions++;
      } else if (member.operation === MergeOperation.update) {
        this.modifications++;
      } else if (member.operation === MergeOperation.delete) {
        this.deletions++;
      }
    }
  }

}
