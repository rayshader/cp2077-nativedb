import {AfterViewInit, ChangeDetectionStrategy, Component, DestroyRef, Input} from '@angular/core';
import {AsyncPipe} from "@angular/common";
import {CdkAccordionModule} from "@angular/cdk/accordion";
import {FunctionSpanComponent} from "../../components/spans/function-span/function-span.component";
import {MatIconModule} from "@angular/material/icon";
import {PropertySpanComponent} from "../../components/spans/property-span/property-span.component";
import {NDBAccordionItemComponent} from "../../components/ndb-accordion-item/ndb-accordion-item.component";
import {TypeSpanComponent} from "../../components/spans/type-span/type-span.component";
import {
  BehaviorSubject,
  combineLatest, combineLatestWith,
  delay,
  EMPTY,
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
import {MatSlideToggle, MatSlideToggleChange} from "@angular/material/slide-toggle";
import {FormControl, ReactiveFormsModule} from "@angular/forms";

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
  readonly functions: FunctionDocumentation[];
  readonly badges: number;
  readonly align: string;

  readonly documentation?: WikiClassDto;
  readonly showComment: boolean;
  readonly hasComment: boolean;

  readonly isMobile: boolean;
  readonly isPinned: boolean;

  readonly highlightEmpty: boolean;

  readonly showParents: boolean;
  readonly showChildren: boolean;
  readonly showProperties: boolean;
  readonly showFunctions: boolean;
}

interface FunctionDocumentation {
  readonly memberOf: RedClassAst;
  readonly function: RedFunctionAst;
  readonly documentation?: WikiClassDto;
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

type PropertySort = 'name' | 'offset';

@Component({
  selector: 'ndb-page-object',
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
    NDBDocumentationComponent,
    MatSlideToggle,
    ReactiveFormsModule
  ],
  templateUrl: './object.component.html',
  styleUrl: './object.component.scss'
})
export class ObjectComponent implements AfterViewInit {

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

  showMembers: FormControl<boolean> = new FormControl(false, {nonNullable: true});

  protected readonly isMobile$: Observable<boolean>;

  protected readonly kind: RedNodeKind;

  protected readonly classKind: RedNodeKind = RedNodeKind.class;
  protected readonly structKind: RedNodeKind = RedNodeKind.struct;

  protected readonly nativeOrigin: RedOriginDef = RedOriginDef.native;
  protected readonly importOnlyOrigin: RedOriginDef = RedOriginDef.importOnly;

  protected readonly cyrb53 = cyrb53;

  protected isPropertiesFiltered: boolean = false;
  protected isFunctionsFiltered: boolean = false;
  protected canShowOffset: boolean = false;
  protected propertySearchFilter: MemberFilter = 'empty';
  protected functionSearchFilter: MemberFilter = 'empty';
  protected propertySort: PropertySort = 'name';

  private readonly showDocumentationSubject: BehaviorSubject<boolean> = new BehaviorSubject<boolean>(false);
  private readonly showDocumentation$: Observable<boolean> = this.showDocumentationSubject.asObservable();
  private readonly filtersSubject: BehaviorSubject<void> = new BehaviorSubject<void>(undefined);
  private readonly filters$: Observable<void> = this.filtersSubject.asObservable();
  private readonly sortSubject: BehaviorSubject<PropertySort> = new BehaviorSubject<PropertySort>('name');
  private readonly sort$: Observable<PropertySort> = this.sortSubject.asObservable();
  private readonly inheritsSubject: BehaviorSubject<InheritData[]> = new BehaviorSubject<InheritData[]>([]);
  private readonly inherits$: Observable<InheritData[]> = this.inheritsSubject.asObservable();

  constructor(private readonly dumpService: RedDumpService,
              private readonly wikiService: WikiService,
              private readonly pageService: PageService,
              private readonly recentVisitService: RecentVisitService,
              private readonly settingsService: SettingsService,
              private readonly responsiveService: ResponsiveService,
              private readonly searchService: SearchService,
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
    this.resetInherits();
    const object$: Observable<RedClassAst> = this.loadObject(+id);
    const documentation$: Observable<WikiClassDto | undefined> = object$.pipe(this.getDocumentation());
    const inherits$: Observable<RedClassAst[]> = this.inherits$.pipe(this.getInherits());
    const inheritsDocumentation$: Observable<WikiClassDto[]> = this.inherits$.pipe(this.getInheritsDocumentation());

    this.settingsService.showDocumentation$
      .pipe(take(1), takeUntilDestroyed(this.dr))
      .subscribe((show) => this.showDocumentationSubject.next(show));

    this.settingsService.showMembers$
      .pipe(
        take(1),
        takeUntilDestroyed(this.dr),
        combineLatestWith(object$),
      )
      .subscribe(([show, object]) => {
        this.showMembers.setValue(show, {emitEvent: false});
        this.onShowMembersToggled(<any>{checked: show}, object.parents);
      });

    this.data$ = combineLatest([
      object$,
      documentation$,
      inherits$,
      inheritsDocumentation$,
      this.showDocumentation$,
      this.dumpService.badges$,
      this.settingsService.settings$,
      this.isMobile$,
      this.searchService.query$,
      this.filters$,
      this.sort$
    ]).pipe(
      map(this.loadData.bind(this))
    );
  }

  ngAfterViewInit(): void {
    this.route.fragment.pipe(
      takeUntilDestroyed(this.dr)
    ).subscribe(this.onScrollToFragment.bind(this));
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

  areMembersVisible(parent: InheritData): boolean {
    return !!this.hasInherit(parent);
  }

  toggleDocumentation(name: string, hasComment: boolean): void {
    if (!hasComment) {
      navigator.clipboard.writeText(`# ${name}`);
      window.open('https://app.gitbook.com/o/-MP5ijqI11FeeX7c8-N8/s/iEOlL96xX95sTRIvzobZ/classes', '_blank');
      return;
    }
    this.showDocumentationSubject.next(!this.showDocumentationSubject.value);
  }

  toggleMembers(parent: InheritData, parents: InheritData[]): void {
    if (parent.isEmpty) {
      return;
    }
    parents = parents.filter((parent) => !parent.isEmpty);
    let inherits: InheritData[] = [...this.inheritsSubject.value];
    let isVisible: boolean = this.areMembersVisible(parent);

    isVisible = !isVisible;
    if (isVisible) {
      inherits.push(parent);
    } else {
      inherits = inherits.filter((inherit) => inherit.id !== parent.id);
    }
    this.inheritsSubject.next(inherits);
    if (inherits.length === 0 && this.showMembers.value) {
      this.showMembers.setValue(false);
    } else if (inherits.length === parents.length && !this.showMembers.value) {
      this.showMembers.setValue(true);
    }
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

  computeFunctionFilters(functions: FunctionDocumentation[]): void {
    this.badgesFunction.forEach((badge) => {
      badge.isEmpty = true;
    });
    this.badgesFunction.forEach((badge) => {
      for (const data of functions) {
        if (data.function.visibility === RedVisibilityDef.public && badge.title === 'public') {
          badge.isEmpty = false;
          return;
        } else if (data.function.visibility === RedVisibilityDef.protected && badge.title === 'protected') {
          badge.isEmpty = false;
          return;
        } else if (data.function.visibility === RedVisibilityDef.private && badge.title === 'private') {
          badge.isEmpty = false;
          return;
        } else if (data.function.isNative && badge.title === 'native') {
          badge.isEmpty = false;
          return;
        } else if (data.function.isStatic && badge.title === 'static') {
          badge.isEmpty = false;
          return;
        } else if (data.function.isFinal && badge.title === 'final') {
          badge.isEmpty = false;
          return;
        } else if (data.function.isThreadSafe && badge.title === 'threadsafe') {
          badge.isEmpty = false;
          return;
        } else if (data.function.isCallback && badge.title === 'callback') {
          badge.isEmpty = false;
          return;
        } else if (data.function.isConst && badge.title === 'const') {
          badge.isEmpty = false;
          return;
        } else if (data.function.isQuest && badge.title === 'quest') {
          badge.isEmpty = false;
          return;
        } else if (data.function.isTimer && badge.title === 'timer') {
          badge.isEmpty = false;
          return;
        }
      }
    });
  }

  getLostPropertyFilter(): BadgeFilterItem<RedPropertyAst> | undefined {
    return this.badgesProperty.find((badge) => badge.isEnabled && !badge.isEmpty);
  }

  getLostFunctionFilter(): BadgeFilterItem<RedFunctionAst> | undefined {
    return this.badgesFunction.find((badge) => badge.isEnabled && !badge.isEmpty);
  }

  togglePropertyFilter(badge: BadgeFilterItem<RedPropertyAst>, force: boolean = false): void {
    if (badge.isEmpty && !force) {
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

  toggleFunctionFilter(badge: BadgeFilterItem<RedFunctionAst>, force: boolean = false): void {
    if (badge.isEmpty && !force) {
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

  togglePropertySort(): void {
    if (!this.canShowOffset) {
      return;
    }
    this.propertySort = (this.propertySort === 'name') ? 'offset' : 'name';
    this.sortSubject.next(this.propertySort);
  }

  resetFilters(): void {
    this.enableBadges();
    this.propertySearchFilter = 'empty';
    this.functionSearchFilter = 'empty';
  }

  resetInherits(): void {
    this.showMembers.setValue(false);
    if (this.inheritsSubject.value.length === 0) {
      return;
    }
    this.inheritsSubject.next([]);
  }

  onShowMembersToggled(event: MatSlideToggleChange, parents: InheritData[]): void {
    const inherits: InheritData[] = [];

    for (const parent of parents) {
      if (!parent.isEmpty && event.checked) {
        inherits.push(parent);
      }
    }
    this.inheritsSubject.next(inherits);
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
                     inherits,
                     inheritsDocumentation,
                     showDocumentation,
                     badges,
                     settings,
                     isMobile,
                     request,
                     _filter,
                     sort
                   ]: [RedClassAst, WikiClassDto | undefined, RedClassAst[], WikiClassDto[], boolean, number, Settings, boolean, SearchRequest, void, PropertySort]) {
    let properties: RedPropertyAst[] = [...object.properties];
    let functions: FunctionDocumentation[] = object.functions.map((func) => {
      return {memberOf: object, function: func, documentation: documentation};
    });
    let sortProperty: (a: RedPropertyAst, b: RedPropertyAst) => number;

    this.canShowOffset = settings.codeSyntax === CodeSyntax.pseudocode && !isMobile;
    if (!this.canShowOffset) {
      sort = 'name';
    }
    if (sort === 'name') {
      sortProperty = RedPropertyAst.sort;
    } else {
      sortProperty = RedPropertyAst.sortByOffset;
    }
    if (inherits.length > 0) {
      for (const inherit of inherits) {
        properties.push(...inherit.properties);
        for (const func of inherit.functions) {
          const duplicate: boolean = functions.findIndex((item) => item.function.fullName === func.fullName) !== -1;

          if (!duplicate) {
            const wiki: WikiClassDto | undefined = inheritsDocumentation.find((item) => item.id === inherit.id);

            functions.push({memberOf: inherit, function: func, documentation: wiki});
          }
        }
      }
      functions.sort((a, b) => RedFunctionAst.sort(a.function, b.function));
    }
    properties = this.filterProperties(properties, request);
    functions = this.filterFunctions(functions, request);
    properties.sort(sortProperty);
    const showEmptyAccordion: boolean = settings.showEmptyAccordion;
    let altName: string | undefined = object.aliasName;
    let name: string = object.name;

    if (settings.codeSyntax === CodeSyntax.redscript && object.aliasName) {
      name = object.aliasName;
      altName = object.name;
    }

    of(true).pipe(
      delay(1),
      takeUntilDestroyed(this.dr)
    ).subscribe(this.onScrollToFragment.bind(this));

    this.pageService.updateTitle(`NDB · ${name}`);

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
      align: `${104 + (badges - 2) * 24}px`,
      documentation: documentation,
      showComment: showDocumentation,
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
    const lostBadge = this.getLostPropertyFilter();

    this.computePropertyFilters(properties);
    if (lostBadge && lostBadge.isEmpty) {
      this.togglePropertyFilter(lostBadge, true);
      this.isPropertiesFiltered = false;
    }
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

  private filterFunctions(functions: FunctionDocumentation[], request: SearchRequest): FunctionDocumentation[] {
    const lostBadge = this.getLostFunctionFilter();

    this.computeFunctionFilters(functions);
    if (lostBadge && lostBadge.isEmpty) {
      this.toggleFunctionFilter(lostBadge, true);
    }
    if (!SearchService.isFunctionOrUsage(request) && this.functionSearchFilter !== 'empty') {
      this.functionSearchFilter = 'empty';
      this.enableBadges('function');
    }
    if (SearchService.isFunctionOrUsage(request) && this.functionSearchFilter !== 'disable') {
      this.isFunctionsFiltered = true;
      this.disableBadges('function');
      functions = SearchService.filterFunctions(functions, request, (data) => data.function);
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

  private hasFunctionFlag(data: FunctionDocumentation): boolean {
    const badges: BadgeFilterItem<RedFunctionAst>[] = this.badgesFunction.filter((badge) => badge.isEnabled);
    let match: boolean = false;

    for (const badge of badges) {
      match ||= badge.filter(data.function);
    }
    return match;
  }

  private hasInherit(parent: InheritData): InheritData | undefined {
    return this.inheritsSubject.value.find((inherit) => inherit.id === parent.id);
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

  private getInherits(): OperatorFunction<InheritData[], RedClassAst[]> {
    return pipe(
      switchMap((parents: InheritData[]) => {
        if (parents.length === 0) {
          return of([]);
        }
        const operations$: Observable<RedClassAst | undefined>[] = [];

        for (const parent of parents) {
          operations$.push(this.dumpService.getClassById(parent.id));
        }
        return combineLatest(operations$);
      }),
      map((parents) => parents.filter((parent) => !!parent))
    );
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

  private getInheritsDocumentation(): OperatorFunction<InheritData[], WikiClassDto[]> {
    return pipe(
      switchMap((inherits: InheritData[]) => {
        if (inherits.length === 0) {
          return of([]);
        }
        const operations$: Observable<WikiClassDto | undefined>[] = [];

        for (const inherit of inherits) {
          operations$.push(this.wikiService.getClass(inherit.name));
        }
        return combineLatest(operations$);
      }),
      map((wikis) => wikis.filter((wiki) => !!wiki))
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
