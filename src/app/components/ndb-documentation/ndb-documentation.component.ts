import {Component, EventEmitter, Input, Output} from '@angular/core';
import {MatFormFieldModule} from "@angular/material/form-field";
import {AbstractControl, FormControl, FormGroup, ReactiveFormsModule} from "@angular/forms";
import {MatInputModule} from "@angular/material/input";
import {MatButtonModule} from "@angular/material/button";
import {MatIconModule} from "@angular/material/icon";
import {
  ClassDocumentation,
  DocumentationService,
  MemberDocumentation
} from "../../../shared/services/documentation.service";
import {takeUntilDestroyed} from "@angular/core/rxjs-interop";
import {NDBFormatDocumentationPipe} from "../../pipes/ndb-format-documentation.pipe";
import {RedFunctionAst} from "../../../shared/red-ast/red-function.ast";
import {RedPropertyAst} from "../../../shared/red-ast/red-property.ast";
import {firstValueFrom} from "rxjs";
import {Router} from "@angular/router";

export interface DocumentationData {
  readonly documentation?: ClassDocumentation;
  readonly node?: RedFunctionAst | RedPropertyAst;
}

type Mode = 'view' | 'edit';

@Component({
  selector: 'ndb-documentation',
  standalone: true,
  imports: [
    ReactiveFormsModule,
    MatIconModule,
    MatInputModule,
    MatButtonModule,
    MatFormFieldModule,
    NDBFormatDocumentationPipe
  ],
  templateUrl: './ndb-documentation.component.html',
  styleUrl: './ndb-documentation.component.scss'
})
export class NDBDocumentationComponent {

  @Output()
  documented: EventEmitter<boolean> = new EventEmitter();

  @Output()
  closed: EventEmitter<void> = new EventEmitter();

  mode: Mode = 'view';
  body: string = '';
  isChanged: boolean = false;

  readonly form: FormGroup = new FormGroup({
    input: new FormControl('')
  });

  private documentation?: ClassDocumentation;
  private node?: RedFunctionAst | RedPropertyAst;

  constructor(private readonly documentationService: DocumentationService,
              private readonly router: Router) {
    this.input.valueChanges.pipe(takeUntilDestroyed()).subscribe(this.onChanged.bind(this));
  }

  @Input('data')
  set _data(value: DocumentationData | undefined) {
    if (!value) {
      return;
    }
    this.documentation = value.documentation;
    this.node = value.node;
    const member: MemberDocumentation | undefined = this.getFunction();

    if (!member) {
      this.mode = 'edit';
      return;
    }
    this.body = member.body;
    this.input.setValue(this.body, {emitEvent: false});
    this.documented.emit(true);
  }

  get isEmpty(): boolean {
    return this.body.length === 0;
  }

  private get input(): AbstractControl<string> {
    return this.form.get('input')!;
  }

  onLinkClicked(event: Event): void {
    const $element: HTMLElement = event.target as HTMLElement;

    if ($element.tagName !== 'A') {
      return;
    }
    const route: string | null = $element.getAttribute('data-route');

    if (!route) {
      return;
    }
    this.router.navigateByUrl(route);
  }

  openGuidelines(): void {
    // TODO: add business logic
  }

  async delete(): Promise<void> {
    if (!this.node || !this.documentation) {
      return;
    }
    const member: MemberDocumentation | undefined = this.getFunction();

    if (member) {
      await firstValueFrom(this.documentationService.deleteFunction(this.documentation, member.id));
      this.body = '';
      this.input.setValue('');
    }
    this.documented.emit(false);
    this.closed.emit();
  }

  cancel(): void {
    this.input.setValue(this.body, {emitEvent: false});
    this.mode = 'view';
  }

  async save(): Promise<void> {
    if (!this.node || !this.documentation) {
      return;
    }
    try {
      let body: string = this.input.value;

      body = body.trim();
      let member: MemberDocumentation | undefined = this.getFunction();

      if (!member) {
        member = {
          id: this.node!.id,
          body: body
        };
        await firstValueFrom(this.documentationService.addFunction(this.documentation, member));
      } else {
        member.body = body;
        await firstValueFrom(this.documentationService.update(this.documentation));
      }
      this.body = body;
      this.documented.emit(true);
      this.mode = 'view';
    } catch (error) {
      // TODO: show a toast!
      console.error(error);
    }
  }

  private onChanged(value: string): void {
    value = value.trim();
    this.isChanged = value !== this.body;
  }

  private getFunction(): MemberDocumentation | undefined {
    if (!this.documentation || !this.node) {
      return undefined;
    }
    return this.documentation.functions?.find((item) => item.id === this.node!.id);
  }

}
