import {Component, Input} from '@angular/core';
import {AsyncPipe} from "@angular/common";
import {CdkAccordionModule} from "@angular/cdk/accordion";
import {FunctionSpanComponent} from "../../components/spans/function-span/function-span.component";
import {MatIconModule} from "@angular/material/icon";
import {PropertySpanComponent} from "../../components/spans/property-span/property-span.component";
import {RDAccordionItemComponent} from "../../components/rd-accordion-item/rd-accordion-item.component";
import {TypeSpanComponent} from "../../components/spans/type-span/type-span.component";
import {combineLatest, EMPTY, map, Observable, of, OperatorFunction, pipe, switchMap} from "rxjs";
import {RedDumpService} from "../../../shared/services/red-dump.service";
import {RedNodeKind} from "../../../shared/red-ast/red-node.ast";
import {ActivatedRoute} from "@angular/router";
import {MatChipsModule} from "@angular/material/chips";
import {RedClassAst} from "../../../shared/red-ast/red-class.ast";
import {RedTypeAst} from "../../../shared/red-ast/red-type.ast";
import {RedPropertyAst} from "../../../shared/red-ast/red-property.ast";
import {RedFunctionAst} from "../../../shared/red-ast/red-function.ast";
import {RedOriginDef, RedVisibilityDef} from "../../../shared/red-ast/red-definitions.ast";
import {PageService} from "../../../shared/services/page.service";

interface ObjectData {
  readonly object: RedClassAst;
  readonly scope: string;
  readonly isAbstract: boolean;
  readonly isFinal: boolean;
  readonly parents: RedTypeAst[];
  readonly children: RedTypeAst[];
  readonly properties: RedPropertyAst[];
  readonly functions: RedFunctionAst[];
  readonly badges: number;
  readonly align: string;
}

@Component({
  selector: 'object',
  standalone: true,
  imports: [
    AsyncPipe,
    CdkAccordionModule,
    MatIconModule,
    MatChipsModule,
    FunctionSpanComponent,
    PropertySpanComponent,
    RDAccordionItemComponent,
    TypeSpanComponent
  ],
  templateUrl: './object.component.html',
  styleUrl: './object.component.scss'
})
export class ObjectComponent {

  data$: Observable<ObjectData | undefined> = EMPTY;

  protected readonly kind: RedNodeKind;

  protected readonly classKind: RedNodeKind = RedNodeKind.class;
  protected readonly structKind: RedNodeKind = RedNodeKind.struct;

  protected readonly nativeOrigin: RedOriginDef = RedOriginDef.native;
  protected readonly importOnlyOrigin: RedOriginDef = RedOriginDef.importOnly;

  constructor(private readonly dumpService: RedDumpService,
              private readonly pageService: PageService,
              private readonly route: ActivatedRoute) {
    this.kind = (this.route.snapshot.data as any).kind;
  }

  @Input()
  set id(id: string) {
    this.pageService.restoreScroll();
    const object$ = of(this.kind).pipe(
      switchMap((kind) => {
        if (kind === RedNodeKind.class) {
          return this.dumpService.getClassById(+id);
        } else if (kind === RedNodeKind.struct) {
          return this.dumpService.getStructById(+id);
        }
        return EMPTY;
      }),
      map((object) => object as RedClassAst)
    );
    const parents$ = object$.pipe(this.getParents());
    const children$ = object$.pipe(this.getChildren());

    this.data$ = combineLatest([
      object$,
      parents$,
      children$,
      this.dumpService.badges$
    ]).pipe(
      map(([
             object,
             parents,
             children,
             badges,
           ]) => {
        const properties = object.properties;
        const functions = object.functions;

        properties.sort(RedPropertyAst.sort);
        functions.sort(RedFunctionAst.sort);
        return <ObjectData>{
          object: object,
          scope: RedVisibilityDef[object.visibility],
          isAbstract: object.isAbstract,
          parents: parents,
          children: children,
          properties: properties,
          functions: functions,
          badges: badges,
          align: `${72 + badges * 24 + 12 - 30}px`
        };
      })
    );
  }

  private getParents(): OperatorFunction<RedClassAst | undefined, RedTypeAst[]> {
    return pipe(
      switchMap((object) => {
        if (!object || !object.parent) {
          return of([]);
        }
        return this.dumpService.getParentsByName(object.parent, RedNodeKind.class);
      }),
      map((parents: RedClassAst[]) => {
        return parents.map((parent) => <RedTypeAst>{
          id: parent.id,
          kind: RedNodeKind.class,
          name: parent.name,
          size: -1
        })
      })
    );
  }

  private getChildren(): OperatorFunction<RedClassAst | undefined, RedTypeAst[]> {
    return pipe(
      switchMap((object) => {
        if (!object) {
          return of([]);
        }
        return this.dumpService.getChildrenByName(object.name, RedNodeKind.class);
      }),
      map((children: RedClassAst[]) => {
        return children.map((child) => <RedTypeAst>{
          id: child.id,
          kind: RedNodeKind.class,
          name: child.name,
          size: -1
        })
      })
    );
  }

}
