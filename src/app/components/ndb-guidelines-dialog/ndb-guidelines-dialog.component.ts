import {ChangeDetectionStrategy, Component} from '@angular/core';
import {MatButtonModule} from "@angular/material/button";
import {
  MatDialogActions,
  MatDialogClose,
  MatDialogConfig,
  MatDialogContent,
  MatDialogTitle
} from "@angular/material/dialog";
import {NDBFormatDocumentationPipe} from "../../pipes/ndb-format-documentation.pipe";
import {MatFormFieldModule} from "@angular/material/form-field";
import {ReactiveFormsModule} from "@angular/forms";
import {MatInputModule} from "@angular/material/input";
import {TextFieldModule} from "@angular/cdk/text-field";
import {NDBGuidelineComponent} from "./ndb-guideline/ndb-guideline.component";
import {MatDividerModule} from "@angular/material/divider";

@Component({
  selector: 'ndb-guidelines-dialog',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    TextFieldModule,
    MatInputModule,
    MatDialogTitle,
    MatDialogClose,
    MatButtonModule,
    MatDividerModule,
    MatDialogActions,
    MatDialogContent,
    MatFormFieldModule,
    ReactiveFormsModule,
    NDBGuidelineComponent,
    NDBFormatDocumentationPipe
  ],
  templateUrl: './ndb-guidelines-dialog.component.html',
  styleUrl: './ndb-guidelines-dialog.component.scss'
})
export class NDBGuidelinesDialogComponent {

  public static readonly Config: MatDialogConfig = {
    maxWidth: '50vw'
  };

}
