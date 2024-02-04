import {Component, Input} from '@angular/core';
import {RouterService} from "../../../../shared/services/router.service";
import {RedTypeAst} from "../../../../shared/red-ast/red-type.ast";
import {CodeSyntax, SettingsService} from "../../../../shared/services/settings.service";
import {map, Observable} from "rxjs";
import {AsyncPipe} from "@angular/common";
import {NDBFormatCodePipe} from "../../../pipes/ndb-format-code.pipe";

@Component({
  selector: 'type-span',
  standalone: true,
  imports: [
    AsyncPipe,
    NDBFormatCodePipe
  ],
  templateUrl: './type-span.component.html',
  styleUrl: './type-span.component.scss'
})
export class TypeSpanComponent {

  @Input()
  node?: RedTypeAst;

  @Input()
  isEmpty: boolean = false;

  protected readonly syntax$: Observable<number>;
  protected readonly vanilla: number = CodeSyntax.pseudocode + 1;
  protected readonly redscript: number = CodeSyntax.redscript + 1;
  protected readonly cpp: number = CodeSyntax.cppRED4ext + 1;

  constructor(private readonly routerService: RouterService,
              private readonly settingsService: SettingsService) {
    this.syntax$ = this.settingsService.code$.pipe(map((value) => value + 1));
  }

  get isPrimitive(): boolean {
    if (!this.node) {
      return false;
    }
    return RedTypeAst.isPrimitive(this.node);
  }

  onRedirect(): void {
    this.routerService.navigateTo(this.node!.id);
  }

}
