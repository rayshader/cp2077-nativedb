import {ChangeDetectionStrategy, Component, computed, effect, inject, input} from '@angular/core';
import {MatButtonModule} from "@angular/material/button";
import {MatIconModule} from "@angular/material/icon";
import {RedDumpService} from "../../../shared/services/red-dump.service";
import {RedBitfieldAst} from "../../../shared/red-ast/red-bitfield.ast";
import {PageService} from "../../../shared/services/page.service";
import {NDBTitleBarComponent} from "../../components/ndb-title-bar/ndb-title-bar.component";
import {RecentVisitService} from "../../../shared/services/recent-visit.service";
import {cyrb53} from "../../../shared/string";
import {NDBHighlightDirective} from "../../directives/ndb-highlight.directive";
import {MatTooltip} from "@angular/material/tooltip";
import {CodeSyntax, SettingsService} from "../../../shared/services/settings.service";

interface BitfieldData {
  readonly node: RedBitfieldAst;
  readonly name: string;
  readonly altName?: string;
}

@Component({
  selector: 'ndb-page-bitfield',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    MatTooltip,
    MatIconModule,
    MatButtonModule,
    NDBTitleBarComponent,
    NDBHighlightDirective
  ],
  templateUrl: './bitfield.component.html',
  styleUrl: './bitfield.component.scss'
})
export class BitfieldComponent {

  private readonly dumpService: RedDumpService = inject(RedDumpService);
  private readonly settingsService: SettingsService = inject(SettingsService);
  private readonly pageService: PageService = inject(PageService);
  private readonly recentVisitService: RecentVisitService = inject(RecentVisitService);

  readonly id = input.required<string>();
  readonly bitfield = computed<BitfieldData | undefined>(() => {
    const node = this.dumpService.getBitfieldById(+this.id());
    if (!node) {
      return undefined;
    }

    const syntax = this.settingsService.code();
    const reverse = syntax === CodeSyntax.redscript && !!node.aliasName;
    const name: string = reverse ? node.aliasName! : node.name;
    const altName: string | undefined = reverse ? node.name : node.aliasName;
    return {
      node: node,
      name: name,
      altName: altName
    };
  });

  readonly cyrb53 = cyrb53;

  constructor() {
    effect(() => {
      const id = +this.id();
      const bitfield = this.bitfield();
      this.pageService.restoreScroll();
      if (bitfield) {
        this.pageService.updateTitle(`NDB · ${bitfield.name}`);
      }
      this.recentVisitService.pushLastVisit(id);
    });
  }

  protected async copyClipboard(node: RedBitfieldAst, key: string): Promise<void> {
    let data: string = `${node.name}.${key}`;

    await navigator.clipboard.writeText(data);
  }

}
