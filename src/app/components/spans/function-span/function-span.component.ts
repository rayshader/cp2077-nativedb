import {Component, Input} from '@angular/core';
import {ArgumentSpanComponent} from "../argument-span/argument-span.component";
import {TypeSpanComponent} from "../type-span/type-span.component";

import {MatIconModule} from "@angular/material/icon";
import {MatButtonModule} from "@angular/material/button";
import {RedFunctionAst} from "../../../../shared/red-ast/red-function.ast";
import {RedClassAst} from "../../../../shared/red-ast/red-class.ast";
import {RedVisibilityDef} from "../../../../shared/red-ast/red-definitions.ast";
import {RedTypeAst} from "../../../../shared/red-ast/red-type.ast";
import {NDBDocumentationComponent} from "../../ndb-documentation/ndb-documentation.component";
import {ClassDocumentation} from "../../../../shared/services/documentation.service";
import {SettingsService} from "../../../../shared/services/settings.service";
import {takeUntilDestroyed} from "@angular/core/rxjs-interop";
import {BehaviorSubject, combineLatest, Observable} from "rxjs";

@Component({
  selector: 'function-span',
  standalone: true,
  imports: [
    MatIconModule,
    MatButtonModule,
    ArgumentSpanComponent,
    TypeSpanComponent,
    NDBDocumentationComponent
  ],
  templateUrl: './function-span.component.html',
  styleUrl: './function-span.component.scss'
})
export class FunctionSpanComponent {

  /**
   * Offset in pixels to add between badges and function's name, with at least 12px.
   */
  align: string = '12px';

  /**
   * Whether documentation should be visible?
   */
  isVisible: boolean = false;

  @Input()
  node?: RedFunctionAst;

  /**
   * Optional, when this function is a member of a class or a struct.
   */
  @Input()
  memberOf?: RedClassAst;

  documentation?: ClassDocumentation;

  @Input()
  canCopy: boolean = true;

  private readonly documentationSubject: BehaviorSubject<ClassDocumentation | undefined> = new BehaviorSubject<ClassDocumentation | undefined>(undefined);
  private readonly documentation$: Observable<ClassDocumentation | undefined> = this.documentationSubject.asObservable();

  constructor(private readonly settingsService: SettingsService) {
    combineLatest([
      this.settingsService.showDocumentation$,
      this.documentation$
    ]).pipe(takeUntilDestroyed()).subscribe(this.onShowDocumentation.bind(this));
  }

  @Input('documentation')
  set _documentation(value: ClassDocumentation | undefined) {
    this.documentation = value;
    this.documentationSubject.next(value);
  }

  /**
   * Total number of badges to align with.
   */
  @Input()
  set badges(count: number) {
    // Compute remaining empty badges to align with.
    count--;
    if (this.node?.isNative) count--;
    if (this.node?.isStatic) count--;
    if (this.node?.isFinal) count--;
    if (this.node?.isCallback) count--;
    if (this.node?.isTimer) count--;
    if (this.node?.isConst) count--;
    if (this.node?.isQuest) count--;
    if (this.node?.isThreadSafe) count--;
    count = Math.max(count, 0);
    this.align = `${count * 24 + 12}px`;
  }

  /**
   * Return 'public', 'protected' or 'private'.
   */
  get scope(): string {
    if (!this.node) {
      return '';
    }
    return RedVisibilityDef[this.node.visibility];
  }

  get hasFullName(): boolean {
    if (!this.node) {
      return false;
    }
    return this.node.fullName !== this.node.name;
  }

  /**
   * Whether this function is documented?
   */
  get hasDocumentation(): boolean {
    if (!this.documentation || !this.node) {
      return false;
    }
    const functions = this.documentation.functions ?? [];

    return functions.some((item) => item.id === this.node!.id);
  }

  toggleDocumentation(): void {
    this.isVisible = !this.isVisible;
  }

  hideDocumentation(): void {
    this.isVisible = false;
  }

  protected async copyToClipboard(): Promise<void> {
    if (!this.node) {
      return;
    }
    let data: string = '';
    let hasReturn: boolean = this.node.returnType !== undefined;

    if (this.memberOf && !this.node.isStatic) {
      data += `let ${this.memberOf.name.toLowerCase()}: ${this.memberOf.name};\n`;
    }
    for (const arg of this.node.arguments) {
      data += `let ${arg.name}: ${RedTypeAst.toString(arg.type)};\n`;
    }
    if (hasReturn) {
      data += `let result: ${RedTypeAst.toString(this.node.returnType!)};\n`;
    }
    if (this.memberOf || hasReturn || this.node.arguments.length > 0) {
      data += '\n';
    }
    if (hasReturn) {
      data += 'result = ';
    }
    if (this.memberOf) {
      data += (!this.node.isStatic) ? this.memberOf.name.toLowerCase() : this.memberOf.name;
      data += '.';
    }
    data += `${this.node.name}(`;
    data += this.node.arguments.map((argument) => argument.name).join(', ');
    data += ');';

    await navigator.clipboard.writeText(data);
  }

  private onShowDocumentation([state, ]: [boolean, ClassDocumentation | undefined]): void {
    if (!this.hasDocumentation) {
      return;
    }
    this.isVisible = state;
  }

}
