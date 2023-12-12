import {Component} from '@angular/core';
import {RedDumpService} from "../../../shared/services/red-dump.service";
import {Observable} from "rxjs";
import {RedFunctionAst} from "../../../shared/red-ast/red-function.ast";
import {AsyncPipe} from "@angular/common";
import {FunctionSpanComponent} from "../../components/spans/function-span/function-span.component";
import {MatIconModule} from "@angular/material/icon";
import {NDBTitleBarComponent} from "../../components/ndb-title-bar/ndb-title-bar.component";

@Component({
  selector: 'functions',
  standalone: true,
  imports: [
    AsyncPipe,
    FunctionSpanComponent,
    MatIconModule,
    NDBTitleBarComponent
  ],
  templateUrl: './functions.component.html',
  styleUrl: './functions.component.scss'
})
export class FunctionsComponent {

  readonly functions$: Observable<RedFunctionAst[]>;

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

  constructor(dumpService: RedDumpService) {
    this.functions$ = dumpService.functions$;
  }

}
