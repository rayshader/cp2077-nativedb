import {ChangeDetectionStrategy, Component, computed, effect, inject, input} from '@angular/core';
import {RedDumpService} from "../../../shared/services/red-dump.service";
import {MatIconModule} from "@angular/material/icon";
import {MatButtonModule} from "@angular/material/button";
import {RedEnumAst} from "../../../shared/red-ast/red-enum.ast";
import {PageService} from "../../../shared/services/page.service";
import {NDBTitleBarComponent} from "../../components/ndb-title-bar/ndb-title-bar.component";
import {RecentVisitService} from "../../../shared/services/recent-visit.service";
import {NDBHighlightDirective} from "../../directives/ndb-highlight.directive";
import {cyrb53} from "../../../shared/string";
import {MatTooltip} from "@angular/material/tooltip";
import {CodeSyntax, SettingsService} from "../../../shared/services/settings.service";

interface EnumData {
  readonly node: RedEnumAst;
  readonly name: string;
  readonly altName?: string;
}

@Component({
  selector: 'ndb-page-enum',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    MatTooltip,
    MatIconModule,
    MatButtonModule,
    NDBTitleBarComponent,
    NDBHighlightDirective
  ],
  templateUrl: './enum.component.html',
  styleUrl: './enum.component.scss'
})
export class EnumComponent {

  private readonly dumpService: RedDumpService = inject(RedDumpService);
  private readonly settingsService: SettingsService = inject(SettingsService);
  private readonly pageService: PageService = inject(PageService);
  private readonly recentVisitService: RecentVisitService = inject(RecentVisitService);

  readonly id = input.required<string>();
  readonly enum = computed<EnumData | undefined>(() => {
    const node = this.dumpService.getEnumById(+this.id());
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
      this.pageService.restoreScroll();
      this.recentVisitService.pushLastVisit(id);

      const node = this.enum();
      if (node) {
        this.pageService.updateTitle(`NDB · ${node.name}`);
      }
    });
  }

  protected async copyClipboard(node: RedEnumAst, key: string): Promise<void> {
    let data: string = `${node.name}.${key}`;

    await navigator.clipboard.writeText(data);
  }

}
