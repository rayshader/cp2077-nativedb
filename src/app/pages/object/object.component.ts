import {ApplicationRef, Component, DestroyRef, Input} from '@angular/core';
import {AsyncPipe} from "@angular/common";
import {CdkAccordionModule} from "@angular/cdk/accordion";
import {FunctionSpanComponent} from "../../components/spans/function-span/function-span.component";
import {MatIconModule} from "@angular/material/icon";
import {PropertySpanComponent} from "../../components/spans/property-span/property-span.component";
import {NDBAccordionItemComponent} from "../../components/ndb-accordion-item/ndb-accordion-item.component";
import {TypeSpanComponent} from "../../components/spans/type-span/type-span.component";
import {
  BehaviorSubject,
  combineLatest,
  EMPTY,
  filter,
  first,
  map,
  Observable,
  of,
  OperatorFunction,
  pipe,
  shareReplay,
  switchMap
} from "rxjs";
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
import {SettingsService} from "../../../shared/services/settings.service";
import {MatButtonModule} from "@angular/material/button";
import {NDBTitleBarComponent} from "../../components/ndb-title-bar/ndb-title-bar.component";
import {RecentVisitService} from "../../../shared/services/recent-visit.service";
import {ResponsiveService} from "../../../shared/services/responsive.service";
import {MatDividerModule} from "@angular/material/divider";
import {ClassDocumentation, DocumentationService} from "../../../shared/services/documentation.service";
import {cyrb53} from "../../../shared/string";
import {takeUntilDestroyed} from "@angular/core/rxjs-interop";
import {NDBHighlightDirective} from "../../directives/ndb-highlight.directive";
import {NDBDocumentationComponent} from "../../components/ndb-documentation/ndb-documentation.component";

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

  readonly documentation: ClassDocumentation;
  readonly hasBodyDocumentation: boolean;

  readonly isMobile: boolean;
  readonly showParents: boolean;
  readonly showChildren: boolean;
  readonly showProperties: boolean;
  readonly showFunctions: boolean;
}

interface BadgeFilterItem<T> {
  isEnabled: boolean;

  readonly icon: string;
  readonly title: string;
  readonly dataScope?: string;
  readonly filter: (node: T) => boolean;
}

@Component({
  selector: 'object',
  standalone: true,
  imports: [
    AsyncPipe,
    CdkAccordionModule,
    MatIconModule,
    MatChipsModule,
    MatButtonModule,
    MatDividerModule,
    FunctionSpanComponent,
    PropertySpanComponent,
    TypeSpanComponent,
    NDBAccordionItemComponent,
    NDBTitleBarComponent,
    NDBHighlightDirective,
    NDBDocumentationComponent
  ],
  templateUrl: './object.component.html',
  styleUrl: './object.component.scss'
})
export class ObjectComponent {

  readonly badgesProperty: BadgeFilterItem<RedPropertyAst>[] = [
    {isEnabled: true, icon: 'scope', title: 'public', filter: (prop) => prop.visibility === RedVisibilityDef.public},
    {
      isEnabled: true,
      icon: 'scope',
      title: 'protected',
      dataScope: 'protected',
      filter: (prop) => prop.visibility === RedVisibilityDef.protected
    },
    {
      isEnabled: true,
      icon: 'scope',
      title: 'private',
      dataScope: 'private',
      filter: (prop) => prop.visibility === RedVisibilityDef.private
    },

    {isEnabled: true, icon: 'scope', title: 'persistent', filter: (prop) => prop.isPersistent}
  ];
  readonly badgesFunction: BadgeFilterItem<RedFunctionAst>[] = [
    {isEnabled: true, icon: 'scope', title: 'public', filter: (func) => func.visibility === RedVisibilityDef.public},
    {
      isEnabled: true,
      icon: 'scope',
      title: 'protected',
      dataScope: 'protected',
      filter: (func) => func.visibility === RedVisibilityDef.protected
    },
    {
      isEnabled: true,
      icon: 'scope',
      title: 'private',
      dataScope: 'private',
      filter: (func) => func.visibility === RedVisibilityDef.private
    },

    {isEnabled: true, icon: 'native', title: 'native', filter: (func) => func.isNative},
    {isEnabled: true, icon: 'static', title: 'static', filter: (func) => func.isStatic},
    {isEnabled: true, icon: 'final', title: 'final', filter: (func) => func.isFinal},
    {isEnabled: true, icon: 'timer', title: 'threadsafe', filter: (func) => func.isThreadSafe},
    {isEnabled: true, icon: 'callback', title: 'callback', filter: (func) => func.isCallback},
    {isEnabled: true, icon: 'const', title: 'const', filter: (func) => func.isConst},
    {isEnabled: true, icon: 'quest', title: 'quest', filter: (func) => func.isQuest},
    {isEnabled: true, icon: 'timer', title: 'timer', filter: (func) => func.isTimer}
  ];

  data$: Observable<ObjectData | undefined> = EMPTY;
  showDocumentation: boolean = false;

  protected readonly kind: RedNodeKind;

  protected readonly classKind: RedNodeKind = RedNodeKind.class;
  protected readonly structKind: RedNodeKind = RedNodeKind.struct;

  protected readonly nativeOrigin: RedOriginDef = RedOriginDef.native;
  protected readonly importOnlyOrigin: RedOriginDef = RedOriginDef.importOnly;

  protected readonly cyrb53 = cyrb53;

  private readonly filterBadgesSubject: BehaviorSubject<void> = new BehaviorSubject<void>(undefined);
  private readonly filterFunctions$: Observable<void> = this.filterBadgesSubject.asObservable();

  constructor(private readonly dumpService: RedDumpService,
              private readonly documentationService: DocumentationService,
              private readonly pageService: PageService,
              private readonly recentVisitService: RecentVisitService,
              private readonly settingsService: SettingsService,
              private readonly responsiveService: ResponsiveService,
              private readonly app: ApplicationRef,
              private readonly route: ActivatedRoute,
              private readonly dr: DestroyRef) {
    this.kind = (this.route.snapshot.data as any).kind;
  }

  @Input()
  set id(id: string) {
    if (this.route.fragment === null) {
      this.pageService.restoreScroll();
    }
    this.recentVisitService.pushLastVisit(+id);
    this.resetPropertiesFilter();
    this.resetFunctionsFilter();
    const object$ = of(this.kind).pipe(
      switchMap((kind) => {
        if (kind === RedNodeKind.class) {
          return this.dumpService.getClassById(+id);
        } else if (kind === RedNodeKind.struct) {
          return this.dumpService.getStructById(+id);
        }
        return EMPTY;
      }),
      map((object) => object as RedClassAst),
      shareReplay()
    );
    const parents$ = object$.pipe(this.getParents(), shareReplay());
    const children$ = object$.pipe(this.getChildren(), shareReplay());
    const documentation$ = object$.pipe(this.getDocumentation(), shareReplay());

    combineLatest([
      this.settingsService.showDocumentation$,
      documentation$,
    ]).pipe(takeUntilDestroyed(this.dr)).subscribe(this.onShowDocumentation.bind(this));
    this.data$ = combineLatest([
      object$,
      parents$,
      children$,
      documentation$,
      this.dumpService.badges$,
      this.settingsService.showEmptyAccordion$,
      this.responsiveService.mobile$,
      this.filterFunctions$
    ]).pipe(
      map(([
             object,
             parents,
             children,
             documentation,
             badges,
             showEmptyAccordion,
             isMobile
           ]) => {
        let properties = object.properties;
        let functions = object.functions;

        if (this.isPropertiesFiltered) {
          properties = properties.filter(this.hasPropertyFlag.bind(this));
        }
        properties.sort(RedPropertyAst.sort);
        if (this.isFunctionsFiltered) {
          functions = functions.filter(this.hasFunctionFlag.bind(this));
        }
        functions.sort(RedFunctionAst.sort);
        this.app.isStable.pipe(
          filter((stable: boolean) => stable),
          first(),
          takeUntilDestroyed(this.dr)
        ).subscribe(this.onScrollToFragment.bind(this));
        return <ObjectData>{
          object: object,
          scope: RedVisibilityDef[object.visibility],
          isAbstract: object.isAbstract,
          parents: parents,
          children: children,
          properties: properties,
          functions: functions,
          badges: badges,
          align: `${72 + badges * 24 + 12 - 30}px`,
          isMobile: isMobile,
          documentation: documentation,
          hasBodyDocumentation: documentation.body !== undefined,
          showParents: parents.length > 0 || showEmptyAccordion,
          showChildren: children.length > 0 || showEmptyAccordion,
          showProperties: properties.length > 0 || showEmptyAccordion || this.isPropertiesFiltered,
          showFunctions: functions.length > 0 || showEmptyAccordion || this.isFunctionsFiltered,
        };
      })
    );
  }

  protected get disableResetFilterProperties(): boolean {
    return this.badgesProperty.filter((badge) => badge.isEnabled).length === this.badgesProperty.length;
  }

  protected get disableResetFilterFunctions(): boolean {
    return this.badgesFunction.filter((badge) => badge.isEnabled).length === this.badgesFunction.length;
  }

  protected get isFunctionsFiltered(): boolean {
    return this.badgesFunction.filter((badge) => badge.isEnabled).length === 1;
  }

  protected get isPropertiesFiltered(): boolean {
    return this.badgesProperty.filter((badge) => badge.isEnabled).length === 1;
  }

  toggleDocumentation(): void {
    this.showDocumentation = !this.showDocumentation;
  }

  togglePropertyFilter(badge: BadgeFilterItem<RedPropertyAst>): void {
    this.badgesProperty.forEach((badge) => badge.isEnabled = false);
    badge.isEnabled = !badge.isEnabled;
    this.filterBadgesSubject.next();
  }

  toggleFunctionFilter(badge: BadgeFilterItem<RedFunctionAst>): void {
    this.badgesFunction.forEach((badge) => badge.isEnabled = false);
    badge.isEnabled = !badge.isEnabled;
    this.filterBadgesSubject.next();
  }

  resetPropertiesFilter(): void {
    this.badgesProperty.forEach((badge) => badge.isEnabled = true);
    this.filterBadgesSubject.next();
  }

  resetFunctionsFilter(): void {
    this.badgesFunction.forEach((badge) => badge.isEnabled = true);
    this.filterBadgesSubject.next();
  }

  private hasPropertyFlag(prop: RedPropertyAst): boolean {
    const badges: BadgeFilterItem<RedPropertyAst>[] = this.badgesProperty.filter((badge) => badge.isEnabled);
    let match: boolean = false;

    for (const badge of badges) {
      match ||= badge.filter(prop);
    }
    return match;
  }

  private hasFunctionFlag(func: RedFunctionAst): boolean {
    const badges: BadgeFilterItem<RedFunctionAst>[] = this.badgesFunction.filter((badge) => badge.isEnabled);
    let match: boolean = false;

    for (const badge of badges) {
      match ||= badge.filter(func);
    }
    return match;
  }

  private onShowDocumentation([state, documentation]: [boolean, ClassDocumentation]): void {
    if (!documentation.body) {
      this.showDocumentation = false;
      return;
    }
    this.showDocumentation = state;
  }

  private onScrollToFragment(): void {
    const fragment: string | null = this.route.snapshot.fragment;

    if (!fragment) {
      return;
    }
    const $element: HTMLElement | null = document.getElementById(fragment);

    if (!$element) {
      return;
    }
    $element.scrollIntoView({block: 'center'});
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

  private getDocumentation(): OperatorFunction<RedClassAst | undefined, ClassDocumentation> {
    return pipe(
      switchMap((object) => {
        if (!object) {
          return EMPTY;
        }
        return this.documentationService.getClassById(object.id);
      })
    );
  }

}
