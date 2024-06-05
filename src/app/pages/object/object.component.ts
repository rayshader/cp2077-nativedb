import {ApplicationRef, ChangeDetectionStrategy, Component, DestroyRef, Input} from '@angular/core';
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
  switchMap,
  take
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
import {CodeSyntax, Settings, SettingsService} from "../../../shared/services/settings.service";
import {MatButtonModule} from "@angular/material/button";
import {NDBTitleBarComponent} from "../../components/ndb-title-bar/ndb-title-bar.component";
import {RecentVisitService} from "../../../shared/services/recent-visit.service";
import {ResponsiveService} from "../../../shared/services/responsive.service";
import {MatDividerModule} from "@angular/material/divider";
import {cyrb53} from "../../../shared/string";
import {takeUntilDestroyed} from "@angular/core/rxjs-interop";
import {NDBHighlightDirective} from "../../directives/ndb-highlight.directive";
import {NDBDocumentationComponent} from "../../components/ndb-documentation/ndb-documentation.component";
import {MatTooltipModule} from "@angular/material/tooltip";
import {SearchRequest, SearchService} from "../../../shared/services/search.service";
import {WikiService} from "../../../shared/services/wiki.service";
import {WikiClassDto} from "../../../shared/dtos/wiki.dto";

export interface InheritData extends RedTypeAst {
  readonly isEmpty: boolean;
}

interface ObjectData {
  readonly object: RedClassAst;
  readonly name: string;
  readonly altName?: string;

  readonly scope: string;
  readonly isAbstract: boolean;
  readonly isFinal: boolean;
  readonly parents: InheritData[];
  readonly children: InheritData[];
  readonly properties: RedPropertyAst[];
  readonly functions: RedFunctionAst[];
  readonly badges: number;
  readonly align: string;

  readonly documentation?: WikiClassDto;
  readonly showComment: boolean;
  readonly canDocument: boolean;
  readonly hasComment: boolean;

  readonly isMobile: boolean;
  readonly isPinned: boolean;

  readonly highlightEmpty: boolean;

  readonly showParents: boolean;
  readonly showChildren: boolean;
  readonly showProperties: boolean;
  readonly showFunctions: boolean;
}

interface BadgeFilterItem<T> {
  // Whether filtering is active?
  isEnabled: boolean;

  // Whether no items contain this filter?
  isEmpty: boolean;

  readonly icon: string;
  readonly title: string;
  readonly dataScope?: string;
  readonly filter: (node: T) => boolean;
}

type MemberFilter = 'empty' | 'disable' | 'enable';

@Component({
  selector: 'ndb-page-object',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
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
    {
      isEnabled: true,
      isEmpty: false,
      icon: 'scope',
      title: 'public',
      filter: (prop) => prop.visibility === RedVisibilityDef.public
    },
    {
      isEnabled: true,
      isEmpty: false,
      icon: 'scope',
      title: 'protected',
      dataScope: 'protected',
      filter: (prop) => prop.visibility === RedVisibilityDef.protected
    },
    {
      isEnabled: true,
      isEmpty: false,
      icon: 'scope',
      title: 'private',
      dataScope: 'private',
      filter: (prop) => prop.visibility === RedVisibilityDef.private
    },

    {isEnabled: true, isEmpty: false, icon: 'scope', title: 'persistent', filter: (prop) => prop.isPersistent}
  ];
  readonly badgesFunction: BadgeFilterItem<RedFunctionAst>[] = [
    {
      isEnabled: true,
      isEmpty: false,
      icon: 'scope',
      title: 'public',
      filter: (func) => func.visibility === RedVisibilityDef.public
    },
    {
      isEnabled: true,
      isEmpty: false,
      icon: 'scope',
      title: 'protected',
      dataScope: 'protected',
      filter: (func) => func.visibility === RedVisibilityDef.protected
    },
    {
      isEnabled: true,
      isEmpty: false,
      icon: 'scope',
      title: 'private',
      dataScope: 'private',
      filter: (func) => func.visibility === RedVisibilityDef.private
    },

    {isEnabled: true, isEmpty: false, icon: 'native', title: 'native', filter: (func) => func.isNative},
    {isEnabled: true, isEmpty: false, icon: 'static', title: 'static', filter: (func) => func.isStatic},
    {isEnabled: true, isEmpty: false, icon: 'final', title: 'final', filter: (func) => func.isFinal},
    {isEnabled: true, isEmpty: false, icon: 'timer', title: 'threadsafe', filter: (func) => func.isThreadSafe},
    {isEnabled: true, isEmpty: false, icon: 'callback', title: 'callback', filter: (func) => func.isCallback},
    {isEnabled: true, isEmpty: false, icon: 'const', title: 'const', filter: (func) => func.isConst},
    {isEnabled: true, isEmpty: false, icon: 'quest', title: 'quest', filter: (func) => func.isQuest},
    {isEnabled: true, isEmpty: false, icon: 'timer', title: 'timer', filter: (func) => func.isTimer}
  ];

  data$: Observable<ObjectData | undefined> = EMPTY;

  protected readonly isMobile$: Observable<boolean>;

  protected readonly kind: RedNodeKind;

  protected readonly classKind: RedNodeKind = RedNodeKind.class;
  protected readonly structKind: RedNodeKind = RedNodeKind.struct;

  protected readonly nativeOrigin: RedOriginDef = RedOriginDef.native;
  protected readonly importOnlyOrigin: RedOriginDef = RedOriginDef.importOnly;

  protected readonly cyrb53 = cyrb53;

  protected isPropertiesFiltered: boolean = false;
  protected isFunctionsFiltered: boolean = false;
  protected propertySearchFilter: MemberFilter = 'empty';
  protected functionSearchFilter: MemberFilter = 'empty';

  private readonly showDocumentationSubject: BehaviorSubject<boolean> = new BehaviorSubject<boolean>(false);
  private readonly showDocumentation$: Observable<boolean> = this.showDocumentationSubject.asObservable();
  private readonly filtersSubject: BehaviorSubject<void> = new BehaviorSubject<void>(undefined);
  private readonly filters$: Observable<void> = this.filtersSubject.asObservable();

  constructor(private readonly dumpService: RedDumpService,
              private readonly wikiService: WikiService,
              private readonly pageService: PageService,
              private readonly recentVisitService: RecentVisitService,
              private readonly settingsService: SettingsService,
              private readonly responsiveService: ResponsiveService,
              private readonly searchService: SearchService,
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
    this.resetFilters();
    const object$: Observable<RedClassAst> = this.loadObject(+id);
    const documentation$: Observable<WikiClassDto | undefined> = object$.pipe(this.getDocumentation());

    this.settingsService.showDocumentation$.pipe(take(1), takeUntilDestroyed(this.dr))
      .subscribe((show) => this.showDocumentationSubject.next(show));

    this.data$ = combineLatest([
      object$,
      documentation$,
      this.showDocumentation$,
      this.dumpService.badges$,
      this.settingsService.settings$,
      this.isMobile$,
      this.searchService.query$,
      this.filters$
    ]).pipe(
      map(this.loadData.bind(this))
    );
  }

  getFilterTooltip(badge: BadgeFilterItem<any>, isFiltered: boolean): string {
    if (!badge.isEnabled) {
      return `Filter by ${badge.title}`;
    }
    if (!isFiltered) {
      return `Filter by ${badge.title}`;
    }
    return 'Reset filter';
  }

  toggleDocumentation(): void {
    this.showDocumentationSubject.next(!this.showDocumentationSubject.value);
  }

  computePropertyFilters(properties: RedPropertyAst[]): void {
    this.badgesProperty.forEach((badge) => {
      badge.isEmpty = true;
    });
    this.badgesProperty.forEach((badge) => {
      for (const prop of properties) {
        if (prop.visibility === RedVisibilityDef.public && badge.title === 'public') {
          badge.isEmpty = false;
          return;
        } else if (prop.visibility === RedVisibilityDef.protected && badge.title === 'protected') {
          badge.isEmpty = false;
          return;
        } else if (prop.visibility === RedVisibilityDef.private && badge.title === 'private') {
          badge.isEmpty = false;
          return;
        } else if (prop.isPersistent && badge.title === 'persistent') {
          badge.isEmpty = false;
          return;
        }
      }
    });
  }

  computeFunctionFilters(functions: RedFunctionAst[]): void {
    this.badgesFunction.forEach((badge) => {
      badge.isEmpty = true;
    });
    this.badgesFunction.forEach((badge) => {
      for (const func of functions) {
        if (func.visibility === RedVisibilityDef.public && badge.title === 'public') {
          badge.isEmpty = false;
          return;
        } else if (func.visibility === RedVisibilityDef.protected && badge.title === 'protected') {
          badge.isEmpty = false;
          return;
        } else if (func.visibility === RedVisibilityDef.private && badge.title === 'private') {
          badge.isEmpty = false;
          return;
        } else if (func.isNative && badge.title === 'native') {
          badge.isEmpty = false;
          return;
        } else if (func.isStatic && badge.title === 'static') {
          badge.isEmpty = false;
          return;
        } else if (func.isFinal && badge.title === 'final') {
          badge.isEmpty = false;
          return;
        } else if (func.isThreadSafe && badge.title === 'threadsafe') {
          badge.isEmpty = false;
          return;
        } else if (func.isCallback && badge.title === 'callback') {
          badge.isEmpty = false;
          return;
        } else if (func.isConst && badge.title === 'const') {
          badge.isEmpty = false;
          return;
        } else if (func.isQuest && badge.title === 'quest') {
          badge.isEmpty = false;
          return;
        } else if (func.isTimer && badge.title === 'timer') {
          badge.isEmpty = false;
          return;
        }
      }
    });
  }

  togglePropertyFilter(badge: BadgeFilterItem<RedPropertyAst>): void {
    if (badge.isEmpty) {
      return;
    }
    let isEnabled: boolean = false;

    if (!this.isPropertiesFiltered && badge.isEnabled) {
      isEnabled = false;
    } else if (this.isPropertiesFiltered && badge.isEnabled) {
      isEnabled = true;
    } else if (this.isPropertiesFiltered && !badge.isEnabled) {
      badge.isEnabled = true;
      isEnabled = false;
    }
    if (this.propertySearchFilter === 'enable') {
      this.propertySearchFilter = 'disable';
      badge.isEnabled = true;
      isEnabled = false;
    }
    this.badgesProperty
      .filter((item) => item !== badge)
      .forEach((item) => item.isEnabled = isEnabled);
    this.isPropertiesFiltered = this.badgesProperty.filter((badge) => badge.isEnabled).length === 1;
    this.filtersSubject.next();
  }

  togglePropertySearchFilter(): void {
    if (this.propertySearchFilter === 'empty') {
      return;
    }
    if (this.propertySearchFilter === 'enable') {
      this.propertySearchFilter = 'disable';
      this.enableBadges('property');
    } else {
      this.propertySearchFilter = 'enable';
      this.disableBadges('property');
    }
    this.filtersSubject.next();
  }

  toggleFunctionFilter(badge: BadgeFilterItem<RedFunctionAst>): void {
    if (badge.isEmpty) {
      return;
    }
    let isEnabled: boolean = false;

    if (!this.isFunctionsFiltered && badge.isEnabled) {
      isEnabled = false;
    } else if (this.isFunctionsFiltered && badge.isEnabled) {
      isEnabled = true;
    } else if (this.isFunctionsFiltered && !badge.isEnabled) {
      badge.isEnabled = true;
      isEnabled = false;
    }
    if (this.functionSearchFilter === 'enable') {
      this.functionSearchFilter = 'disable';
      badge.isEnabled = true;
      isEnabled = false;
    }
    this.badgesFunction
      .filter((item) => item !== badge)
      .forEach((item) => item.isEnabled = isEnabled);
    this.isFunctionsFiltered = this.badgesFunction.filter((badge) => badge.isEnabled).length === 1;
    this.filtersSubject.next();
  }

  toggleFunctionSearchFilter(): void {
    if (this.functionSearchFilter === 'empty') {
      return;
    }
    if (this.functionSearchFilter === 'enable') {
      this.functionSearchFilter = 'disable';
      this.enableBadges('function');
    } else {
      this.functionSearchFilter = 'enable';
      this.disableBadges('function');
    }
    this.filtersSubject.next();
  }

  resetFilters(): void {
    this.enableBadges();
    this.propertySearchFilter = 'empty';
    this.functionSearchFilter = 'empty';
  }

  private enableBadges(member?: 'property' | 'function'): void {
    if (member === undefined || member === 'property') {
      this.badgesProperty.forEach((badge) => badge.isEnabled = true);
      this.isPropertiesFiltered = false;
    }
    if (member === undefined || member === 'function') {
      this.badgesFunction.forEach((badge) => badge.isEnabled = true);
      this.isFunctionsFiltered = false;
    }
  }

  private disableBadges(member?: 'property' | 'function'): void {
    if (member === undefined || member === 'property') {
      this.badgesProperty.forEach((badge) => badge.isEnabled = false);
    }
    if (member === undefined || member === 'function') {
      this.badgesFunction.forEach((badge) => badge.isEnabled = false);
    }
  }

  private loadData([
                     object,
                     documentation,
                     showDocumentation,
                     badges,
                     settings,
                     isMobile,
                     request
                   ]: [RedClassAst, WikiClassDto | undefined, boolean, number, Settings, boolean, SearchRequest, void]) {
    const properties: RedPropertyAst[] = this.filterProperties(object.properties, request);
    const functions: RedFunctionAst[] = this.filterFunctions(object.functions, request);
    const showEmptyAccordion: boolean = settings.showEmptyAccordion;
    let altName: string | undefined = object.aliasName;
    let name: string = object.name;

    if (settings.codeSyntax === CodeSyntax.redscript && object.aliasName) {
      name = object.aliasName;
      altName = object.name;
    }
    this.app.isStable.pipe(
      filter((stable: boolean) => stable),
      first(),
      takeUntilDestroyed(this.dr)
    ).subscribe(this.onScrollToFragment.bind(this));
    return <ObjectData>{
      object: object,
      name: name,
      altName: altName,
      scope: RedVisibilityDef[object.visibility],
      isAbstract: object.isAbstract,
      parents: object.parents,
      children: object.children,
      properties: properties,
      functions: functions,
      badges: badges,
      align: `${104 + badges * 24 + 12 - 30}px`,
      documentation: documentation,
      showComment: showDocumentation,
      canDocument: !isMobile,
      hasComment: documentation && documentation.comment.length > 0,
      isMobile: isMobile,
      isPinned: settings.isBarPinned,
      highlightEmpty: settings.highlightEmptyObject,
      showParents: object.parents.length > 0 || showEmptyAccordion,
      showChildren: object.children.length > 0 || showEmptyAccordion,
      showProperties: properties.length > 0 || showEmptyAccordion || this.isPropertiesFiltered,
      showFunctions: functions.length > 0 || showEmptyAccordion || this.isFunctionsFiltered,
    };
  }

  private filterProperties(properties: RedPropertyAst[], request: SearchRequest): RedPropertyAst[] {
    this.computePropertyFilters(properties);
    if (!SearchService.isPropertyOrUsage(request) && this.propertySearchFilter !== 'empty') {
      this.propertySearchFilter = 'empty';
      this.enableBadges('property');
    }
    if (SearchService.isPropertyOrUsage(request) && this.propertySearchFilter !== 'disable') {
      this.isPropertiesFiltered = true;
      this.disableBadges('property');
      properties = SearchService.filterProperties(properties, request);
      this.propertySearchFilter = 'enable';
    } else if (this.isPropertiesFiltered) {
      properties = properties.filter(this.hasPropertyFlag.bind(this));
    }
    return properties;
  }

  private filterFunctions(functions: RedFunctionAst[], request: SearchRequest): RedFunctionAst[] {
    this.computeFunctionFilters(functions);
    if (!SearchService.isFunctionOrUsage(request) && this.functionSearchFilter !== 'empty') {
      this.functionSearchFilter = 'empty';
      this.enableBadges('function');
    }
    if (SearchService.isFunctionOrUsage(request) && this.functionSearchFilter !== 'disable') {
      this.isFunctionsFiltered = true;
      this.disableBadges('function');
      functions = SearchService.filterFunctions(functions, request);
      this.functionSearchFilter = 'enable';
    } else if (this.isFunctionsFiltered) {
      functions = functions.filter(this.hasFunctionFlag.bind(this));
    }
    return functions;
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

  private getDocumentation(): OperatorFunction<RedClassAst | undefined, WikiClassDto | undefined> {
    return pipe(
      switchMap((object?: RedClassAst) => {
        if (!object) {
          return EMPTY;
        }
        return this.wikiService.getClass(object.name);
      })
    );
  }

  private loadObject(id: number): Observable<RedClassAst> {
    return of(this.kind).pipe(
      switchMap((kind: RedNodeKind) => {
        if (kind === RedNodeKind.class) {
          return this.dumpService.getClassById(+id);
        } else if (kind === RedNodeKind.struct) {
          return this.dumpService.getStructById(+id);
        }
        return EMPTY;
      }),
      switchMap((object?: RedClassAst) => (object) ? of(object) : EMPTY),
      shareReplay(1)
    );
  }

}
