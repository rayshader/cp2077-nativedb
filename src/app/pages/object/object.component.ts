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
import {CodeSyntax, SettingsService} from "../../../shared/services/settings.service";
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
import {MatTooltipModule} from "@angular/material/tooltip";

interface ObjectData {
  readonly object: RedClassAst;
  readonly name: string;

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
  readonly hideDocumentation: boolean;
  readonly hasBodyDocumentation: boolean;

  readonly isMobile: boolean;
  readonly isPinned: boolean;

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
    MatTooltipModule,
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

  protected readonly isMobile$: Observable<boolean>;

  protected readonly kind: RedNodeKind;

  protected readonly classKind: RedNodeKind = RedNodeKind.class;
  protected readonly structKind: RedNodeKind = RedNodeKind.struct;

  protected readonly nativeOrigin: RedOriginDef = RedOriginDef.native;
  protected readonly importOnlyOrigin: RedOriginDef = RedOriginDef.importOnly;

  protected readonly cyrb53 = cyrb53;

  protected disableResetFilterProperties: boolean = false;
  protected isPropertiesFiltered: boolean = false;
  protected disableResetFilterFunctions: boolean = false;
  protected isFunctionsFiltered: boolean = false;

  private readonly isDocumentedSubject: BehaviorSubject<boolean> = new BehaviorSubject<boolean>(false);
  private readonly isDocumented$: Observable<boolean> = this.isDocumentedSubject.asObservable();
  private readonly filterBadgesSubject: BehaviorSubject<void> = new BehaviorSubject<void>(undefined);
  private readonly filterBadges$: Observable<void> = this.filterBadgesSubject.asObservable();

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
    this.isMobile$ = this.responsiveService.mobile$;
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
      shareReplay(1)
    );
    const parents$ = object$.pipe(this.getParents(), shareReplay(1));
    const children$ = object$.pipe(this.getChildren(), shareReplay(1));
    const documentation$ = object$.pipe(this.getDocumentation(), shareReplay(1));

    combineLatest([
      this.settingsService.showDocumentation$,
      documentation$,
    ]).pipe(takeUntilDestroyed(this.dr)).subscribe(this.onShowDocumentation.bind(this));

    this.data$ = combineLatest([
      object$,
      parents$,
      children$,
      documentation$,
      this.isDocumented$,
      this.dumpService.badges$,
      this.settingsService.settings$,
      this.isMobile$,
      this.filterBadges$
    ]).pipe(
      map(([
             object,
             parents,
             children,
             documentation,
             isDocumented,
             badges,
             settings,
             isMobile
           ]) => {
        const showEmptyAccordion: boolean = settings.showEmptyAccordion;
        let name: string = object.name;
        let properties: RedPropertyAst[] = object.properties;
        let functions: RedFunctionAst[] = object.functions;

        if (settings.codeSyntax === CodeSyntax.redscript && object.aliasName) {
          name = object.aliasName;
        }
        if (this.isPropertiesFiltered) {
          properties = properties.filter(this.hasPropertyFlag.bind(this));
        }
        if (this.isFunctionsFiltered) {
          functions = functions.filter(this.hasFunctionFlag.bind(this));
        }
        this.app.isStable.pipe(
          filter((stable: boolean) => stable),
          first(),
          takeUntilDestroyed(this.dr)
        ).subscribe(this.onScrollToFragment.bind(this));
        return <ObjectData>{
          object: object,
          name: name,
          scope: RedVisibilityDef[object.visibility],
          isAbstract: object.isAbstract,
          parents: parents,
          children: children,
          properties: properties,
          functions: functions,
          badges: badges,
          align: `${104 + badges * 24 + 12 - 30}px`,
          documentation: documentation,
          hideDocumentation: isMobile,
          hasBodyDocumentation: !isMobile && documentation.body !== undefined,
          isMobile: isMobile,
          isPinned: settings.isBarPinned,
          showParents: parents.length > 0 || showEmptyAccordion,
          showChildren: children.length > 0 || showEmptyAccordion,
          showProperties: properties.length > 0 || showEmptyAccordion || this.isPropertiesFiltered,
          showFunctions: functions.length > 0 || showEmptyAccordion || this.isFunctionsFiltered,
        };
      })
    );
  }

  changeDocumentation(isDocumented: boolean): void {
    this.isDocumentedSubject.next(isDocumented);
  }

  toggleDocumentation(): void {
    this.showDocumentation = !this.showDocumentation;
  }

  togglePropertyFilter(badge: BadgeFilterItem<RedPropertyAst>): void {
    this.badgesProperty.forEach((badge) => badge.isEnabled = false);
    badge.isEnabled = !badge.isEnabled;
    this.disableResetFilterProperties = this.badgesProperty.filter((badge) => badge.isEnabled).length === this.badgesProperty.length;
    this.isPropertiesFiltered = this.badgesProperty.filter((badge) => badge.isEnabled).length === 1;
    this.filterBadgesSubject.next();
  }

  resetPropertiesFilter(): void {
    this.badgesProperty.forEach((badge) => badge.isEnabled = true);
    this.disableResetFilterProperties = this.badgesProperty.filter((badge) => badge.isEnabled).length === this.badgesProperty.length;
    this.isPropertiesFiltered = this.badgesProperty.filter((badge) => badge.isEnabled).length === 1;
    this.filterBadgesSubject.next();
  }

  toggleFunctionFilter(badge: BadgeFilterItem<RedFunctionAst>): void {
    this.badgesFunction.forEach((badge) => badge.isEnabled = false);
    badge.isEnabled = !badge.isEnabled;
    this.disableResetFilterFunctions = this.badgesFunction.filter((badge) => badge.isEnabled).length === this.badgesFunction.length;
    this.isFunctionsFiltered = this.badgesFunction.filter((badge) => badge.isEnabled).length === 1;
    this.filterBadgesSubject.next();
  }

  resetFunctionsFilter(): void {
    this.badgesFunction.forEach((badge) => badge.isEnabled = true);
    this.disableResetFilterFunctions = this.badgesFunction.filter((badge) => badge.isEnabled).length === this.badgesFunction.length;
    this.isFunctionsFiltered = this.badgesFunction.filter((badge) => badge.isEnabled).length === 1;
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
