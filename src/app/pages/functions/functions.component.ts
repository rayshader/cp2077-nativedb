import {ChangeDetectionStrategy, Component, DestroyRef} from '@angular/core';
import {RedDumpService} from "../../../shared/services/red-dump.service";
import {combineLatest, map, Observable} from "rxjs";
import {RedFunctionAst} from "../../../shared/red-ast/red-function.ast";
import {AsyncPipe} from "@angular/common";
import {FunctionSpanComponent} from "../../components/spans/function-span/function-span.component";
import {MatIconModule} from "@angular/material/icon";
import {NDBTitleBarComponent} from "../../components/ndb-title-bar/ndb-title-bar.component";
import {MatDividerModule} from "@angular/material/divider";
import {ResponsiveService} from "../../../shared/services/responsive.service";
import {MatTooltip} from "@angular/material/tooltip";
import {MatSlideToggle} from "@angular/material/slide-toggle";
import {FormControl, ReactiveFormsModule} from "@angular/forms";
import {SettingsService} from "../../../shared/services/settings.service";
import {takeUntilDestroyed} from "@angular/core/rxjs-interop";
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
    AsyncPipe,
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
export class FunctionsComponent {

  readonly data$: Observable<FunctionsData>;

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

  constructor(private readonly dumpService: RedDumpService,
              private readonly wikiService: WikiService,
              private readonly settingsService: SettingsService,
              private readonly pageService: PageService,
              private readonly responsiveService: ResponsiveService,
              private readonly dr: DestroyRef) {
    this.data$ = combineLatest([
      this.dumpService.functions$,
      this.wikiService.getGlobals(),
      this.responsiveService.mobile$
    ]).pipe(
      map(([functions, wikiGlobals, isMobile]) => {
        return {
          functions: functions.map((func) => {
            return <FunctionData>{
              func: func,
              documentation: wikiGlobals.find((wikiGlobal) => wikiGlobal.id === func.id),
            };
          }),
          isMobile: isMobile
        };
      })
    );
    this.settingsService.ignoreDuplicate$.pipe(
      takeUntilDestroyed(this.dr)
    ).subscribe(this.onIgnoreDuplicate.bind(this));
    this.ignoreDuplicate.valueChanges.pipe(
      takeUntilDestroyed(this.dr)
    ).subscribe(this.onIgnoreDuplicateUpdated.bind(this));

    this.pageService.updateTitle('NDB · Global functions');
  }

  private onIgnoreDuplicate(ignore: boolean) {
    this.ignoreDuplicate.setValue(ignore, {emitEvent: false});
  }

  private onIgnoreDuplicateUpdated(value: boolean) {
    this.settingsService.updateIgnoreDuplicate(value);
  }

}
