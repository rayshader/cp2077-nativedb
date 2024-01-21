import {Component, Inject} from '@angular/core';
import {MAT_DIALOG_DATA, MatDialogModule} from "@angular/material/dialog";
import {MatButtonModule} from "@angular/material/button";
import {AppData} from "../../app.component";

interface Versioning {
  current: AppData;
  latest: AppData;
}

@Component({
  selector: 'ndb-update-dialog',
  standalone: true,
  imports: [
    MatButtonModule,
    MatDialogModule
  ],
  templateUrl: './ndb-update-dialog.component.html',
  styleUrl: './ndb-update-dialog.component.scss'
})
export class NDBUpdateDialogComponent {

  readonly canUpdateApp: boolean;
  readonly canUpdateGame: boolean;

  constructor(@Inject(MAT_DIALOG_DATA) readonly data: Versioning) {
    this.canUpdateApp = data.current.appVersion !== data.latest.appVersion;
    this.canUpdateGame = data.current.gameVersion !== data.latest.gameVersion;
  }

}
