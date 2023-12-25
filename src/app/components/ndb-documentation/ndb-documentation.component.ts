import {Component, EventEmitter, Input, Output} from '@angular/core';
import {MatFormFieldModule} from "@angular/material/form-field";
import {FormControl, FormGroup, ReactiveFormsModule} from "@angular/forms";
import {MatInputModule} from "@angular/material/input";
import {MatButtonModule} from "@angular/material/button";
import {MatIconModule} from "@angular/material/icon";

type Mode = 'view' | 'edit';

@Component({
  selector: 'ndb-documentation',
  standalone: true,
  imports: [
    MatFormFieldModule,
    MatInputModule,
    ReactiveFormsModule,
    MatButtonModule,
    MatIconModule
  ],
  templateUrl: './ndb-documentation.component.html',
  styleUrl: './ndb-documentation.component.scss'
})
export class NDBDocumentationComponent {

  @Input()
  id?: string;

  @Output()
  closed: EventEmitter<void> = new EventEmitter();

  mode: Mode = 'edit';
  body: string = '';

  readonly form: FormGroup = new FormGroup({
    input: new FormControl('')
  });

  get isEmpty(): boolean {
    return this.body.length === 0;
  }

  toggleMode(): void {
    this.mode = (this.mode === 'edit') ? 'view' : 'edit';
  }

  openGuidelines(): void {
    // TODO: add business logic
  }

  delete(): void {
    // TODO: add business logic
    this.closed.emit();
  }

  cancel(): void {
    this.form.setValue({'input': this.body}, {emitEvent: false});
    this.closed.emit();
  }

  save(): void {
    // TODO: add business logic
    this.closed.emit();
  }

}
