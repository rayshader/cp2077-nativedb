import {Component, Input} from '@angular/core';
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

  protected readonly MergeOperation = MergeOperation;
  protected readonly MergeFrom = MergeFrom;

  protected get title(): string {
    if (this.body.operation === MergeOperation.add) {
      return 'New';
    } else if (this.body.operation === MergeOperation.update) {
      return 'Updated';
    }
    return 'Removed';
  }

  pickBrowser(): void {
    if (this.body.from !== undefined) {
      this.body.from = undefined;
      return;
    }
    this.body.from = MergeFrom.browser;
  }

  pickFile(): void {
    if (this.body.from !== undefined) {
      this.body.from = undefined;
      return;
    }
    this.body.from = MergeFrom.file;
  }

}
