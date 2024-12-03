import {ChangeDetectionStrategy, Component, Input} from '@angular/core';
import {RouterService} from "../../../../shared/services/router.service";
import {RedTypeAst} from "../../../../shared/red-ast/red-type.ast";
import {CodeSyntax, SettingsService} from "../../../../shared/services/settings.service";
import {map, Observable} from "rxjs";
import {AsyncPipe} from "@angular/common";
import {NDBFormatCodePipe} from "../../../pipes/ndb-format-code.pipe";
import {ShortcutService} from "../../../../shared/services/shortcut.service";

@Component({
  selector: 'type-span',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    AsyncPipe,
    NDBFormatCodePipe
  ],
  templateUrl: './type-span.component.html',
  styleUrl: './type-span.component.scss'
})
export class TypeSpanComponent {

  isPrimitive: boolean = false;

  node?: RedTypeAst;

  @Input()
  isEmpty: boolean = false;

  protected readonly syntax$: Observable<number>;
  protected readonly vanilla: number = CodeSyntax.pseudocode + 1;
  protected readonly redscript: number = CodeSyntax.redscript + 1;
  protected readonly cpp: number = CodeSyntax.cppRED4ext + 1;

  constructor(private readonly routerService: RouterService,
              private readonly shortcutService: ShortcutService,
              private readonly settingsService: SettingsService) {
    this.syntax$ = this.settingsService.code$.pipe(map((value) => value + 1));
  }

  @Input('node')
  set _node(value: RedTypeAst | undefined) {
    this.node = value;
    this.isPrimitive = (this.node) ? RedTypeAst.isPrimitive(this.node) : false;
  }

  /**
   * Navigate to node's page on a simple click.
   * Open node's page in a new tab on CTRL+CLICK, CMD+CLICK or Middle Mouse Button.
   * Search by node's usage on CLICK+U.
   * @param event
   */
  onRedirect(event: MouseEvent): void {
    if (!this.node) {
      return;
    }
    let inTab: boolean = event.ctrlKey || event.metaKey || event.button === 1;

    if (this.shortcutService.usageShortcut) {
      this.routerService.navigateByUsage(this.node.aliasName ?? this.node.name, inTab);
    } else {
      this.routerService.navigateTo(this.node.id, inTab);
    }
  }

}
