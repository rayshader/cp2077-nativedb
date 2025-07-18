import {ChangeDetectionStrategy, Component, computed, effect, inject, input, signal} from '@angular/core';
import {ArgumentSpanComponent} from "../argument-span/argument-span.component";
import {TypeSpanComponent} from "../type-span/type-span.component";

import {MatIconModule} from "@angular/material/icon";
import {MatButtonModule} from "@angular/material/button";
import {RedFunctionAst} from "../../../../shared/red-ast/red-function.ast";
import {RedClassAst} from "../../../../shared/red-ast/red-class.ast";
import {RedVisibilityDef} from "../../../../shared/red-ast/red-definitions.ast";
import {NDBDocumentationComponent} from "../../ndb-documentation/ndb-documentation.component";
import {CodeSyntax, SettingsService} from "../../../../shared/services/settings.service";
import {CodeFormatterService} from "../../../../shared/services/code-formatter.service";
import {MatTooltipModule} from "@angular/material/tooltip";
import {MatMenu, MatMenuItem, MatMenuTrigger} from "@angular/material/menu";
import {MatDivider} from "@angular/material/divider";
import {WikiClassDto, WikiFunctionDto, WikiGlobalDto} from "../../../../shared/dtos/wiki.dto";

@Component({
  selector: 'function-span',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    MatMenu,
    MatMenuItem,
    MatMenuTrigger,
    MatDivider,
    MatIconModule,
    MatButtonModule,
    MatTooltipModule,
    TypeSpanComponent,
    ArgumentSpanComponent,
    NDBDocumentationComponent
  ],
  templateUrl: './function-span.component.html',
  styleUrl: './function-span.component.scss'
})
export class FunctionSpanComponent {

  private readonly fmtService: CodeFormatterService = inject(CodeFormatterService);
  private readonly settingsService: SettingsService = inject(SettingsService);

  readonly node = input<RedFunctionAst>();
  readonly memberOf = input<RedClassAst>();
  readonly documentation = input<WikiFunctionDto | WikiClassDto>();
  readonly badges = input<number>(1);
  readonly canCopy = input<boolean>(true);
  readonly canDocument = input<boolean>(false);
  readonly canShare = input<boolean>(true);

  readonly wiki = signal<WikiFunctionDto | WikiGlobalDto | undefined>(undefined);

  readonly syntax = this.fmtService.syntax;
  readonly useMarkdown = computed<boolean>(() => this.settingsService.formatShareLink());
  readonly hasDocumentation = computed<boolean>(() => {
    const documentation = this.documentation();
    return !!documentation && documentation.comment.length > 0;
  })
  readonly scope = computed<string>(() => {
    const node = this.node();
    return (node) ? RedVisibilityDef[node.visibility] : '';
  });
  readonly hasFullname = computed<boolean>(() => {
    const node = this.node();
    return !!node && (node.name !== node.fullName);
  });
  readonly isListener = computed<boolean>(() => {
    const memberOf = this.memberOf();
    return !!memberOf && (memberOf.aliasName ?? memberOf.name).endsWith('Listener');
  });

  /**
   * Offset in pixels to add between badges and the function's name, with at least 12 px.
   */
  readonly align = computed<string>(() => {
    const node = this.node();
    let count: number = this.badges() - 1;

    if (node?.isNative) count--;
    if (node?.isStatic) count--;
    if (node?.isFinal) count--;
    if (node?.isCallback) count--;
    if (node?.isTimer) count--;
    if (node?.isConst) count--;
    if (node?.isQuest) count--;
    if (node?.isThreadSafe) count--;
    count = Math.max(count, 0);
    return `${count * 24 + 12}px`;
  });

  /**
   * Whether documentation should be visible?
   */
  isVisible: boolean = false;

  readonly CodeSyntax = CodeSyntax;

  constructor() {
    effect(() => {
      const documentation = this.documentation();
      if (!documentation) {
        this.isVisible = false;
        this.wiki.set(undefined);
        return;
      }

      if (documentation.comment.length > 0) {
        this.isVisible = this.settingsService.showDocumentation();
      }

      if ('functions' in documentation) {
        const node = this.node()!;
        const klass = documentation as WikiClassDto;
        this.wiki.set(klass.functions.find((method) => method.id === node.id));
      } else {
        this.wiki.set(documentation as WikiGlobalDto);
      }
    });
  }

  async toggleDocumentation(): Promise<void> {
    const node = this.node();
    if (!node) {
      return;
    }
    if (this.documentation() === undefined) {
      const prototype: string = RedFunctionAst.toGitBook(node);

      await navigator.clipboard.writeText(prototype);
      return;
    }
    this.isVisible = !this.isVisible;
  }

  async copyFullName(): Promise<void> {
    const node = this.node();
    if (!node || node.fullName === node.name) {
      return;
    }

    await navigator.clipboard.writeText(node.fullName);
  }

  async copyPrototype(): Promise<void> {
    const node = this.node();
    if (!node) {
      return;
    }

    const code: string = this.fmtService.formatPrototype(node);
    await navigator.clipboard.writeText(code);
  }

  async copyCall(): Promise<void> {
    const node = this.node();
    if (!node) {
      return;
    }

    const code: string = this.fmtService.formatCall(node, this.memberOf());
    await navigator.clipboard.writeText(code);
  }

  async copySpecial(type: string): Promise<void> {
    const node = this.node();
    if (!node) {
      return;
    }

    const code: string = this.fmtService.formatSpecial(type, node, this.memberOf());
    await navigator.clipboard.writeText(code);
  }

  async copyUrlToClipboard(): Promise<void> {
    const node = this.node();
    if (!node) {
      return;
    }

    const memberOf = this.memberOf();
    const uri: string = memberOf ? `${memberOf.name}#${node.name}` : node.name;

    let data: string = `${window.location.origin}/${uri}`;
    if (this.useMarkdown()) {
      data = `[${uri}](${data})`;
    }
    await navigator.clipboard.writeText(data);
  }

}
