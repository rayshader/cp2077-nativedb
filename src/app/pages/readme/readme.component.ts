import {ChangeDetectionStrategy, Component, computed, inject, OnInit} from '@angular/core';
import {MatIconModule} from "@angular/material/icon";
import {MatDividerModule} from "@angular/material/divider";
import {FunctionSpanComponent} from "../../components/spans/function-span/function-span.component";
import {RedDumpService} from "../../../shared/services/red-dump.service";
import {MatButtonModule} from "@angular/material/button";
import {RouterLink} from "@angular/router";
import {cyrb53} from "../../../shared/string";
import {PageService} from "../../../shared/services/page.service";
import {MatChipsModule} from "@angular/material/chips";
import {MatTooltipModule} from "@angular/material/tooltip";

@Component({
  selector: 'ndb-page-readme',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    RouterLink,
    MatIconModule,
    MatChipsModule,
    MatButtonModule,
    MatDividerModule,
    MatTooltipModule,
    FunctionSpanComponent
  ],
  templateUrl: './readme.component.html',
  styleUrl: './readme.component.scss'
})
export class ReadmeComponent implements OnInit {

  private readonly dumpService: RedDumpService = inject(RedDumpService);
  private readonly pageService: PageService = inject(PageService);

  readonly gameInstance = computed(() => {
    return this.dumpService.functions().find((func) => func.name === 'GetGameInstance');
  });
  readonly addFact = computed(() => {
    return this.dumpService.functions().find((func) => func.name === 'AddFact');
  });

  readonly id: number = cyrb53('ScriptGameInstance');

  ngOnInit(): void {
    this.pageService.restoreScroll();
    this.pageService.updateTitle('NativeDB');
  }

}
