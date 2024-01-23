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
import {firstValueFrom} from "rxjs";
import {Router} from "@angular/router";
import {MatTooltipModule} from "@angular/material/tooltip";

export interface DocumentationData {
  readonly documentation?: ClassDocumentation;
  readonly main?: boolean;
  readonly node?: RedFunctionAst;
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
    MatTooltipModule,
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
  deleteStatus: boolean = false;

  readonly form: FormGroup = new FormGroup({
    input: new FormControl('')
  });

  private documentation?: ClassDocumentation;
  private main: boolean = false;
  private node?: RedFunctionAst;

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
    this.main = value.main ?? false;
    this.node = value.node;
    if (this.documentation && this.main) {
      this.loadMain();
    } else {
      this.loadMember();
    }
  }

  get isEmpty(): boolean {
    return this.body.length === 0;
  }

  protected get input(): AbstractControl<string> {
    return this.form.get('input')!;
  }

  protected get deleteTitle(): string {
    return this.deleteStatus ? 'Confirm' : 'Delete';
  }

  protected get saveDisabled(): boolean {
    let body: string = this.input.value;

    body ??= '';
    body = body.trim();
    return !this.isChanged || body.length === 0;
  }

  onLinkClicked(event: Event): void {
    const $element: HTMLElement = event.target as HTMLElement;

    if ($element.tagName !== 'A') {
      return;
    }
    let route: string | null = $element.getAttribute('data-route');

    if (!route) {
      return;
    }
    const isLocal: boolean = route.startsWith(window.location.pathname);

    if (isLocal) {
      $element.scrollIntoView({block: 'center'});
    }
    const nameOnly: boolean = $element.getAttribute('data-name') === 'only';

    if (nameOnly) {
      route += '?name=only';
    }
    this.router.navigateByUrl(route, {replaceUrl: isLocal});
  }

  openGuidelines(): void {
    // TODO: add business logic
  }

  async delete(): Promise<void> {
    if (!this.documentation) {
      return;
    }
    if (!this.deleteStatus) {
      this.deleteStatus = true;
      return;
    }
    if (this.main) {
      await this.deleteMain();
    } else if (this.node) {
      await this.deleteMember();
    }
    this.deleteStatus = false;
  }

  cancel(): void {
    this.input.setValue(this.body, {emitEvent: false});
    this.isChanged = false;
    this.deleteStatus = false;
    this.mode = 'view';
    if (this.body.length === 0) {
      this.closed.emit();
    }
  }

  async save(): Promise<void> {
    if (!this.documentation) {
      return;
    }
    if (this.main) {
      await this.saveMain();
    } else if (this.node) {
      await this.saveMember();
    }
    this.isChanged = false;
    this.deleteStatus = false;
  }

  private onChanged(value: string): void {
    value = value.trim();
    this.isChanged = value !== this.body;
  }

  private async deleteMain(): Promise<void> {
    if (!this.documentation) {
      return;
    }
    this.documentation.body = undefined;
    await firstValueFrom(this.documentationService.update(this.documentation));
    this.body = '';
    this.input.setValue('');
    this.documented.emit(false);
    this.closed.emit();
  }

  private async deleteMember(): Promise<void> {
    if (!this.documentation) {
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

  private async saveMain(): Promise<void> {
    if (!this.documentation) {
      return;
    }
    try {
      let body: string = this.input.value;

      body = body.trim();
      this.documentation.body = body;
      await firstValueFrom(this.documentationService.update(this.documentation));
      this.body = body;
      this.documented.emit(true);
      this.mode = 'view';
    } catch (error) {
      // TODO: show a toast!
      console.error(error);
    }
  }

  private async saveMember(): Promise<void> {
    if (!this.documentation) {
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

  private loadMain(): void {
    if (!this.documentation) {
      return;
    }
    if (!this.documentation.body) {
      this.mode = 'edit';
      return;
    }
    this.body = this.documentation.body ?? '';
    this.input.setValue(this.body, {emitEvent: false});
    this.documented.emit(true);
  }

  private loadMember(): void {
    const member: MemberDocumentation | undefined = this.getFunction();

    if (!member) {
      this.mode = 'edit';
      return;
    }
    this.body = member.body;
    this.input.setValue(this.body, {emitEvent: false});
    this.documented.emit(true);
  }

  private getFunction(): MemberDocumentation | undefined {
    if (!this.documentation || !this.node) {
      return undefined;
    }
    return this.documentation.functions?.find((item) => item.id === this.node!.id);
  }

}
