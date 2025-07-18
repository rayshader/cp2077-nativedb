import {ChangeDetectionStrategy, Component, computed, DestroyRef, effect, inject, OnInit} from '@angular/core';
import {RedDumpService} from "../../../shared/services/red-dump.service";
import {RedFunctionAst} from "../../../shared/red-ast/red-function.ast";
import {FunctionSpanComponent} from "../../components/spans/function-span/function-span.component";
import {MatIconModule} from "@angular/material/icon";
import {NDBTitleBarComponent} from "../../components/ndb-title-bar/ndb-title-bar.component";
import {MatDividerModule} from "@angular/material/divider";
import {ResponsiveService} from "../../../shared/services/responsive.service";
import {MatTooltip} from "@angular/material/tooltip";
import {MatSlideToggle} from "@angular/material/slide-toggle";
import {FormControl, ReactiveFormsModule} from "@angular/forms";
import {SettingsService} from "../../../shared/services/settings.service";
import {takeUntilDestroyed, toSignal} from "@angular/core/rxjs-interop";
import {WikiService} from "../../../shared/services/wiki.service";
import {WikiGlobalDto} from "../../../shared/dtos/wiki.dto";
import {PageService} from "../../../shared/services/page.service";

interface FunctionData {
  readonly func: RedFunctionAst;
  readonly documentation: WikiGlobalDto;
}

interface FunctionsData {
  readonly functions: FunctionData[];
  readonly isMobile: boolean;
}

@Component({
  selector: 'ndb-page-functions',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    MatTooltip,
    MatSlideToggle,
    MatIconModule,
    MatDividerModule,
    ReactiveFormsModule,
    FunctionSpanComponent,
    NDBTitleBarComponent
  ],
  templateUrl: './functions.component.html',
  styleUrl: './functions.component.scss'
})
export class FunctionsComponent implements OnInit {

  private readonly dumpService: RedDumpService = inject(RedDumpService);
  private readonly wikiService: WikiService = inject(WikiService);
  private readonly pageService: PageService = inject(PageService);
  private readonly settingsService: SettingsService = inject(SettingsService);
  private readonly responsiveService: ResponsiveService = inject(ResponsiveService);
  private readonly dr: DestroyRef = inject(DestroyRef);

  readonly isMobile = this.responsiveService.isMobile;
  readonly globalsDocumentation = toSignal(this.wikiService.getGlobals());

  readonly globals = computed<FunctionData[]>(() => {
    const globals = this.dumpService.functions();
    const globalsDocumentation = this.globalsDocumentation() ?? [];

    return globals.map((global) => <FunctionData>{
      func: global,
      documentation: globalsDocumentation.find((doc) => doc.id === global.id)
    });
  });

  readonly skeletons: string[] = [
    'AIInstantiateObject() → Void',
    'AIInstantiatePrototype() → Void',
    'AIReleaseObject() → Void',
    'AT_AddATID(widget: wref<inkWidget>, atid: script_ref<String>) → Void',
    'Abs(a: Int32) → Int32',
    'AbsF(a: Float) → Float',
    'AcosF(a: Float) → Float',
    'ActivateTickForTransformAnimator(entityID: entEntityID, componentName: CName, activate: Bool) → Void',
    'AddToInventory(itemID: String, quantity: Int32) → Void',
    'AngleApproach(target: Float, cur: Float, step: Float) → Float',
    'AngleDistance(target: Float, current: Float) → Float',
    'AngleNormalize(a: Float) → Float',
    'AngleNormalize180(a: Float) → Float',
    'AreDebugContextsEnabled() → Bool',
    'ArmouryEquipWeapon(itemID: gameItemID, QuickslotID: Int32) → Void',
    'ArraySortFloats() → Void',
    'ArraySortInts() → Void'
  ];

  readonly ignoreDuplicate: FormControl<boolean> = new FormControl<boolean>(false, {nonNullable: true});

  ngOnInit(): void {
    this.pageService.restoreScroll();
    this.pageService.updateTitle('NDB · Global functions');
    this.ignoreDuplicate.setValue(this.settingsService.ignoreDuplicate(), {emitEvent: false});
    this.ignoreDuplicate.valueChanges
      .pipe(takeUntilDestroyed(this.dr))
      .subscribe(this.onIgnoreDuplicateUpdated.bind(this));
  }

  private onIgnoreDuplicateUpdated(value: boolean) {
    this.settingsService.updateIgnoreDuplicate(value);
  }

}
