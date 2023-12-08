import {Component, Inject} from '@angular/core';
import {MAT_DIALOG_DATA, MatDialogModule} from "@angular/material/dialog";
import {MatButtonModule} from "@angular/material/button";

interface Versioning {
  current: string;
  latest: string;
}

@Component({
  selector: 'update-dialog',
  standalone: true,
  imports: [
    MatDialogModule,
    MatButtonModule
  ],
  templateUrl: './update-dialog.component.html',
  styleUrl: './update-dialog.component.scss'
})
export class UpdateDialogComponent {

  constructor(@Inject(MAT_DIALOG_DATA) readonly data: Versioning) {
  }

}
