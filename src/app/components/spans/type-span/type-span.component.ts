import {ChangeDetectionStrategy, Component, computed, inject, input} from '@angular/core';
import {RouterService} from "../../../../shared/services/router.service";
import {RedTypeAst} from "../../../../shared/red-ast/red-type.ast";
import {CodeSyntax, SettingsService} from "../../../../shared/services/settings.service";
import {NDBFormatCodePipe} from "../../../pipes/ndb-format-code.pipe";
import {ShortcutService} from "../../../../shared/services/shortcut.service";

@Component({
  selector: 'type-span',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    NDBFormatCodePipe
  ],
  templateUrl: './type-span.component.html',
  styleUrl: './type-span.component.scss'
})
export class TypeSpanComponent {

  private readonly routerService: RouterService = inject(RouterService);
  private readonly shortcutService: ShortcutService = inject(ShortcutService);
  private readonly settingsService: SettingsService = inject(SettingsService);

  readonly node = input<RedTypeAst>();
  readonly isEmpty = input<boolean>(false);

  readonly isPrimitive = computed(() => {
    const node = this.node();
    return node && RedTypeAst.isPrimitive(node);
  });
  readonly syntax = computed(() => this.settingsService.code() + 1);

  readonly vanilla: number = CodeSyntax.pseudocode + 1;
  readonly redscript: number = CodeSyntax.redscript + 1;
  readonly cpp: number = CodeSyntax.cppRED4ext + 1;

  /**
   * Navigate to node's page on a simple click.
   * Open the node's page in a new tab on CTRL+CLICK, CMD+CLICK or Middle Mouse Button.
   * Search by node's usage on CLICK+U.
   * @param event
   */
  async onRedirect(event: MouseEvent): Promise<void> {
    const node = this.node();
    if (!node) {
      return;
    }
    const inTab: boolean = event.ctrlKey || event.metaKey || event.button === 1;

    if (this.shortcutService.usageShortcut) {
      await this.routerService.navigateByUsage(node.aliasName ?? node.name, inTab);
    } else {
      await this.routerService.navigateTo(node.id, inTab);
    }
  }

  disableScrolling(event: MouseEvent): boolean {
    if (!this.node() || event.button !== 1) {
      return true;
    }
    event.preventDefault();
    return false;
  }

}
