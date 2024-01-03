import {Component, EventEmitter, Input, Output} from '@angular/core';
import {MemberMergeOperation, MergeFrom, MergeOperation} from "../../../../shared/services/documentation.service";
import {FunctionSpanComponent} from "../../spans/function-span/function-span.component";
import {RedClassAst} from "../../../../shared/red-ast/red-class.ast";
import {RedFunctionAst} from "../../../../shared/red-ast/red-function.ast";

@Component({
  selector: 'ndb-merge-function',
  standalone: true,
  imports: [
    FunctionSpanComponent
  ],
  templateUrl: './ndb-merge-function.component.html',
  styleUrl: './ndb-merge-function.component.scss'
})
export class NDBMergeFunctionComponent {

  @Input()
  object!: RedClassAst;

  @Input()
  member!: MemberMergeOperation;

  @Output()
  updated: EventEmitter<void> = new EventEmitter();

  protected readonly MergeFrom = MergeFrom;
  protected readonly MergeOperation = MergeOperation;

  protected get node(): RedFunctionAst {
    return this.object.functions.find((item) => item.id === this.member.id)!;
  }

  protected get title(): string {
    if (this.member.operation === MergeOperation.add) {
      return 'Accept addition';
    } else if (this.member.operation === MergeOperation.update) {
      return 'Accept modification';
    }
    return 'Accept deletion';
  }

  pickBrowser(): void {
    if (this.member.from !== undefined) {
      this.member.from = undefined;
      this.updated.emit();
      return;
    }
    this.member.from = MergeFrom.browser;
    this.updated.emit();
  }

  pickFile(): void {
    if (this.member.from !== undefined) {
      this.member.from = undefined;
      this.updated.emit();
      return;
    }
    this.member.from = MergeFrom.file;
    this.updated.emit();
  }

}
