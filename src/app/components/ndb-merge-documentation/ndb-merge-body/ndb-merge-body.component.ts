import {Component, EventEmitter, Input, Output} from '@angular/core';
import {BodyMergeOperation, MergeFrom, MergeOperation} from "../../../../shared/services/documentation.service";

@Component({
  selector: 'ndb-merge-body',
  standalone: true,
  imports: [],
  templateUrl: './ndb-merge-body.component.html',
  styleUrl: './ndb-merge-body.component.scss'
})
export class NDBMergeBodyComponent {

  @Input()
  body!: BodyMergeOperation;

  @Output()
  updated: EventEmitter<void> = new EventEmitter();

  protected readonly MergeOperation = MergeOperation;
  protected readonly MergeFrom = MergeFrom;

  protected get title(): string {
    if (this.body.operation === MergeOperation.add) {
      return 'Accept addition';
    } else if (this.body.operation === MergeOperation.update) {
      return 'Accept modification';
    }
    return 'Accept deletion';
  }

  pickBrowser(): void {
    if (this.body.from !== undefined) {
      this.body.from = undefined;
      this.updated.emit();
      return;
    }
    this.body.from = MergeFrom.browser;
    this.updated.emit();
  }

  pickFile(): void {
    if (this.body.from !== undefined) {
      this.body.from = undefined;
      this.updated.emit();
      return;
    }
    this.body.from = MergeFrom.file;
    this.updated.emit();
  }

}
