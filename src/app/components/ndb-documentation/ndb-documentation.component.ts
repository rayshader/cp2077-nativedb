import {Component, Input} from '@angular/core';
import {NDBFormatDocumentationPipe} from "../../pipes/ndb-format-documentation.pipe";
import {Router} from "@angular/router";
import {MatDialog} from "@angular/material/dialog";
import {NDBGuidelinesDialogComponent} from "../ndb-guidelines-dialog/ndb-guidelines-dialog.component";
import {MatTooltipModule} from "@angular/material/tooltip";
import {RedClassAst} from "../../../shared/red-ast/red-class.ast";
import {RedFunctionAst} from "../../../shared/red-ast/red-function.ast";
import {RedTypeAst} from "../../../shared/red-ast/red-type.ast";
import {CodeSyntax} from "../../../shared/services/settings.service";
import {MatIconButton} from "@angular/material/button";
import {MatIcon} from "@angular/material/icon";
import {MatMenu, MatMenuItem, MatMenuTrigger} from "@angular/material/menu";

@Component({
  selector: 'ndb-documentation',
  standalone: true,
  imports: [
    MatIcon,
    MatIconButton,
    MatMenu,
    MatMenuTrigger,
    MatTooltipModule,
    NDBFormatDocumentationPipe,
    MatMenuItem
  ],
  templateUrl: './ndb-documentation.component.html',
  styleUrl: './ndb-documentation.component.scss'
})
export class NDBDocumentationComponent {

  @Input()
  body: string = '';

  @Input()
  object?: RedClassAst;

  @Input()
  method?: RedFunctionAst;

  constructor(private readonly dialog: MatDialog,
              private readonly router: Router) {

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
    this.dialog.open(NDBGuidelinesDialogComponent, NDBGuidelinesDialogComponent.Config);
  }

  showGitBook(): void {
    const path: string = this.getGitBookPath();

    window.open(`https://wiki.redmodding.org/nativedb-documentation/classes/${path}`, '_blank');
  }

  editGitBook(): void {
    const path: string = this.getGitBookPath();

    window.open(`https://app.gitbook.com/o/-MP5ijqI11FeeX7c8-N8/s/iEOlL96xX95sTRIvzobZ/classes/${path}`, '_blank');
  }

  private getGitBookPath(): string {
    if (!this.object) {
      return '';
    }
    let path: string = this.object.name.toLowerCase();

    if (!this.method) {
      path = `${path}#description`;
    } else {
      path = `${path}#${this.formatFragment()}`;
    }
    return path;
  }

  private formatFragment(): string {
    if (!this.method) {
      return '';
    }
    const tokens: string[] = [this.method.name];

    for (const argument of this.method.arguments) {
      if (argument.isOptional) {
        tokens.push('opt');
      }
      if (argument.isOut) {
        tokens.push('out');
      }
      tokens.push(argument.name);
      tokens.push(this.formatFragmentType(argument.type));
    }
    tokens.push('greater-than');
    tokens.push(this.formatFragmentType(this.method.returnType));
    return tokens.join('-').toLowerCase();
  }

  private formatFragmentType(type?: RedTypeAst): string {
    if (!type) {
      return 'Void';
    }
    let fragment: string = RedTypeAst.toString(type, CodeSyntax.pseudocode);

    fragment = fragment.replaceAll(':', '-');
    fragment = fragment.replaceAll('[', '');
    fragment = fragment.replaceAll(']', '-');
    return fragment;
  }

}
