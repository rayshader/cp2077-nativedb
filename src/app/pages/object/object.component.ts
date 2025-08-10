import {
  AfterViewInit,
  ChangeDetectionStrategy,
  Component,
  computed,
  DestroyRef,
  effect,
  inject,
  input,
  signal,
  untracked
} from '@angular/core';
import {CdkAccordionModule} from "@angular/cdk/accordion";
import {FunctionSpanComponent} from "../../components/spans/function-span/function-span.component";
import {MatIconModule} from "@angular/material/icon";
import {PropertySpanComponent} from "../../components/spans/property-span/property-span.component";
import {NDBAccordionItemComponent} from "../../components/ndb-accordion-item/ndb-accordion-item.component";
import {TypeSpanComponent} from "../../components/spans/type-span/type-span.component";
import {map} from "rxjs";
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
import {cyrb53} from "../../../shared/string";
import {takeUntilDestroyed, toSignal} from "@angular/core/rxjs-interop";
import {NDBHighlightDirective} from "../../directives/ndb-highlight.directive";
import {NDBDocumentationComponent} from "../../components/ndb-documentation/ndb-documentation.component";
import {MatTooltipModule} from "@angular/material/tooltip";
import {SearchService} from "../../../shared/services/search.service";
import {WikiService} from "../../../shared/services/wiki.service";
import {WikiClassDto} from "../../../shared/dtos/wiki.dto";
import {MatSlideToggle, MatSlideToggleChange} from "@angular/material/slide-toggle";
import {FormControl, ReactiveFormsModule} from "@angular/forms";
import {derivedAsync} from "ngxtension/derived-async";

export interface InheritData extends RedTypeAst {
  readonly isEmpty: boolean;

  visible: boolean;
}

interface TitleBarData {
  readonly name: string;
  readonly altName?: string;
  readonly hasComment: boolean;
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

type SearchFilter = 'empty' | 'disable' | 'enable';

type PropertySort = 'name' | 'offset';

@Component({
  selector: 'ndb-page-object',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
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

  // Dependencies //
  private readonly dumpService: RedDumpService = inject(RedDumpService);
  private readonly wikiService: WikiService = inject(WikiService);
  private readonly pageService: PageService = inject(PageService);
  private readonly searchService: SearchService = inject(SearchService);
  private readonly settingsService: SettingsService = inject(SettingsService);
  private readonly responsiveService: ResponsiveService = inject(ResponsiveService);
  private readonly recentVisitService: RecentVisitService = inject(RecentVisitService);
  private readonly route: ActivatedRoute = inject(ActivatedRoute);
  private readonly dr: DestroyRef = inject(DestroyRef);

  // Inputs //
  readonly id = input.required<string>();
  readonly fragment = toSignal(this.route.fragment);
  readonly kind = toSignal<RedNodeKind>(this.route.data.pipe(map((data: any) => data.kind)));

  // Signals //
  readonly isLoading = computed<boolean>(() => !!this.id() && !this.object());
  readonly isMobile = this.responsiveService.isMobile;
  readonly isPinned = this.settingsService.isBarPinned;
  readonly highlightEmptyObject = this.settingsService.highlightEmptyObject;
  readonly showDocumentation = signal<boolean>(true);
  readonly inherits = signal<number[]>([]);
  readonly sortProperty = signal<PropertySort>('name');

  readonly badges = this.dumpService.badges;
  readonly align = computed(() => `${104 + (this.badges() - 2) * 24}px`);

  readonly object = computed<RedClassAst | undefined>(() => {
    // NOTE: make sure the first loading pass is done.
    const isReady = this.dumpService.isReady();
    if (!isReady) {
      return undefined;
    }

    // NOTE: re-compute whenever id's input is changed.
    const id: number = +this.id();
    const kind = this.kind();

    let node: RedClassAst | undefined;
    switch (kind) {
      case RedNodeKind.class:
        node = this.dumpService.getClassById(+id);
        // NOTE: re-compute when inheritance is finally loaded.
        this.dumpService.inheritance();
        break;
      case RedNodeKind.struct:
        node = this.dumpService.getStructById(+id);
        break;
      default:
        node = undefined;
        break;
    }

    if (kind === RedNodeKind.struct && node) {
      return node;
    }
    return node?.isInheritanceLoaded ? node : undefined;
  });
  readonly parents = computed<InheritData[]>(() => {
    const object = this.object();
    if (!object) {
      return [];
    }

    return object.parents;
  });
  readonly children = computed<InheritData[]>(() => {
    const object = this.object();
    if (!object) {
      return [];
    }

    return object.children;
  })
  readonly properties = computed<RedPropertyAst[]>(() => {
    const object = this.object();
    if (!object) {
      return [];
    }

    let properties = [...object.properties];
    properties.push(
      ...this.inherits()
        .map((id) => this.dumpService.getClassById(id))
        .filter((inherit) => !!inherit)
        .flatMap((inherit) => inherit.properties ?? [])
    );

    const sort = this.sortProperty();
    properties.sort(sort === 'name' ? RedPropertyAst.sort : RedPropertyAst.sortByOffset);

    return properties;
  });
  readonly functions = derivedAsync<FunctionDocumentation[]>(async () => {
    const object = this.object();
    if (!object) {
      return [];
    }

    const documentation = this.documentation();
    let functions = object.functions.map<FunctionDocumentation>((func) => {
      return {memberOf: object, function: func, documentation: documentation};
    });

    for (const id of this.inherits()) {
      const inherit = this.dumpService.getClassById(id);
      if (!inherit) {
        continue;
      }

      // TODO: try to keep current badge active when non-empty.
      // TODO: implement search filter feature back!
      const wiki = await this.wikiService.getClass(inherit.name);
      for (const func of inherit.functions) {
        const index: number = functions.findIndex((item) => item.function.fullName === func.fullName);

        if (index !== -1) {
          continue;
        }
        functions.push({memberOf: inherit, function: func, documentation: wiki});
      }
    }

    functions.sort((a, b) => RedFunctionAst.sort(a.function, b.function));

    return functions;
  })
  readonly filteredProperties = computed<RedPropertyAst[]>(() => {
    let properties = this.properties();

    const badge = this.propertyBadge();
    const search = this.propertySearch();
    if (search !== 'enable' && badge) {
      properties = properties.filter((property) => badge.filter(property));
    }

    const request = this.searchService.query();
    if (search === 'enable') {
      properties = SearchService.filterProperties(properties, request);
    }

    return properties;
  });
  readonly filteredFunctions = computed<FunctionDocumentation[]>(() => {
    let functions = this.functions() ?? [];

    const badge = this.functionBadge();
    const search = this.functionSearch();
    if (search !== 'enable' && badge) {
      functions = functions.filter((func) => badge.filter(func.function));
    }

    const request = this.searchService.query();
    if (search === 'enable') {
      functions = SearchService.filterFunctions(functions, request, (d) => d.function);
    }

    return functions;
  })
  readonly documentation = derivedAsync<WikiClassDto | undefined>(async () => {
    const object = this.object();
    if (!object) {
      return undefined;
    }

    return await this.wikiService.getClass(object.name);
  });

  readonly titleBar = computed<TitleBarData>(() => {
    const settings = this.settingsService.settings();
    const object = this.object();
    if (!object) {
      return {
        name: '',
        altName: '',
        hasComment: false,
      };
    }

    const documentation = this.documentation();
    const reverse: boolean = settings.codeSyntax === CodeSyntax.redscript && !!object.aliasName;
    const name: string = reverse ? object.aliasName! : object.name;
    const altName: string | undefined = reverse ? object.name : object.aliasName;
    return {
      name,
      altName,
      hasComment: !!documentation && documentation.comment.length > 0,
    };
  });

  readonly scope = computed(() => RedVisibilityDef[this.object()?.visibility ?? 0]);
  readonly isNative = computed(() => this.object()?.origin === RedOriginDef.native);
  readonly isImportOnly = computed(() => this.object()?.origin === RedOriginDef.importOnly);
  readonly isClass = computed(() => this.kind() === RedNodeKind.class);
  readonly isStruct = computed(() => this.kind() === RedNodeKind.struct);

  readonly showParents = computed(() => {
    const object = this.object();
    if (!object) {
      return false;
    }

    return object.parents.length > 0 || this.settingsService.showEmptyAccordion();
  });
  readonly showChildren = computed(() => {
    const object = this.object();
    if (!object) {
      return false;
    }

    return object.children.length > 0 || this.settingsService.showEmptyAccordion();
  });
  readonly showProperties = computed(() => {
    const object = this.object();
    if (!object) {
      return false;
    }

    return this.properties().length > 0 || this.settingsService.showEmptyAccordion();
  });
  readonly showFunctions = computed(() => {
    const object = this.object();
    if (!object) {
      return false;
    }

    return (this.functions() ?? []).length > 0 || this.settingsService.showEmptyAccordion();
  });
  readonly showOffset = computed(() => {
    return this.settingsService.code() === CodeSyntax.pseudocode && !this.responsiveService.isMobile();
  });

  readonly propertyBadges = signal<BadgeFilterItem<RedPropertyAst>[]>([
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
  ]);
  readonly propertyBadge = computed<BadgeFilterItem<RedPropertyAst> | undefined>(() => {
    const badges = this.propertyBadges();
    const isFiltered = badges.filter((badge) => badge.isEnabled).length === 1;

    return isFiltered ? badges.find((badge) => badge.isEnabled) : undefined;
  });

  readonly propertySearch = signal<SearchFilter>('empty');
  readonly functionSearch = signal<SearchFilter>('empty');

  readonly functionBadges = signal<BadgeFilterItem<RedFunctionAst>[]>([
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
  ]);
  readonly functionBadge = computed<BadgeFilterItem<RedFunctionAst> | undefined>(() => {
    const badges = this.functionBadges();
    const isFiltered = badges.filter((badge) => badge.isEnabled).length === 1;

    return isFiltered ? badges.find((badge) => badge.isEnabled) : undefined;
  });

  readonly showMembers: FormControl<boolean> = new FormControl(false, {nonNullable: true});

  readonly cyrb53 = cyrb53;


  constructor() {
    const showDocumentation = this.settingsService.showDocumentation();
    const showMembers = this.settingsService.showMembers();

    effect(() => {
      const id = +this.id();
      this.recentVisitService.pushLastVisit(+id);

      const fragment = untracked(this.fragment) as string | null;
      if (fragment === null) {
        this.pageService.restoreScroll();
      }

      this.showDocumentation.set(showDocumentation);
      this.showMembers.setValue(showMembers);
      this.inherits.set([]);
    });

    effect(() => {
      const parents = this.parents().filter((parent) => !parent.isEmpty);
      const inherits = this.inherits();
      const showMembers = this.showMembers.value;

      if (inherits.length === 0 && showMembers) {
        this.showMembers.setValue(false);
      } else if (inherits.length === parents.length && !showMembers) {
        this.showMembers.setValue(true);
      }
    });

    effect(() => {
      const object = this.object();
      if (!object) {
        return;
      }

      const titleBar = this.titleBar();
      this.pageService.updateTitle(`NDB · ${titleBar.name}`);

      this.resetBadges();
      this.computeBadges(this.properties(), this.functions() ?? []);
    });

    effect(() => {
      const request = this.searchService.query();
      const propertySearch = untracked(this.propertySearch);

      if (!SearchService.isPropertyOrUsage(request) && propertySearch !== 'empty') {
        this.propertySearch.set('empty');
      } else if (SearchService.isPropertyOrUsage(request) && propertySearch !== 'disable') {
        this.propertySearch.set('enable');
      }
    });

    effect(() => {
      const request = this.searchService.query();
      const functionSearch = untracked(this.functionSearch);

      if (!SearchService.isFunctionOrUsage(request) && functionSearch !== 'empty') {
        this.functionSearch.set('empty');
      } else if (SearchService.isFunctionOrUsage(request) && functionSearch !== 'disable') {
        this.functionSearch.set('enable');
      }
    });
  }

  ngAfterViewInit(): void {
    this.route.fragment.pipe(
      takeUntilDestroyed(this.dr)
    ).subscribe(this.scrollToFragment.bind(this));
  }

  areMembersVisible(parent: InheritData): boolean {
    return this.inherits().includes(parent.id);
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

  async toggleDocumentation(name: string, hasComment: boolean): Promise<void> {
    if (!hasComment) {
      await navigator.clipboard.writeText(`# ${name}`);
      window.open('https://app.gitbook.com/o/-MP5ijqI11FeeX7c8-N8/s/iEOlL96xX95sTRIvzobZ/classes', '_blank');
      return;
    }
    this.showDocumentation.set(!this.showDocumentation());
  }

  toggleMembers(parent: InheritData): void {
    if (parent.isEmpty) {
      return;
    }
    this.inherits.update((inherits) => {
      const index = inherits.findIndex((id) => id === parent.id);

      if (index !== -1) {
        inherits = inherits.filter((id) => id !== parent.id);
      } else {
        inherits = [...inherits, parent.id];
      }

      return inherits;
    })

    this.resetBadges(true);
    this.computeBadges(untracked(this.properties), untracked(this.functions) ?? []);
  }

  toggleAllMembers(event: MatSlideToggleChange): void {
    this.inherits.update((inherits) => {
      if (event.checked) {
        inherits = this.parents()
          .filter((parent) => !parent.isEmpty)
          .map((parent) => parent.id);
      } else {
        inherits = [];
      }
      return inherits;
    });

    this.resetBadges(true);
    this.computeBadges(untracked(this.properties), untracked(this.functions) ?? []);
  }

  togglePropertyBadge(badge: BadgeFilterItem<RedPropertyAst>, force: boolean = false): void {
    if (badge.isEmpty && !force) {
      return;
    }

    const propertySearch = this.propertySearch();
    if (propertySearch === 'enable') {
      this.propertySearch.set('disable');
    }

    this.propertyBadges.update((badges) => {
      const enabledBadges = badges.filter((item) => item.isEnabled);
      const isOnlyBadgeEnabled = enabledBadges.length === 1 && enabledBadges[0] === badge;

      if (isOnlyBadgeEnabled) {
        badges.forEach((item) => item.isEnabled = true);
      } else {
        badges.forEach((item) => item.isEnabled = item === badge);
      }
      return [...badges];
    });
  }

  toggleSortByOffset(): void {
    this.sortProperty.set(this.sortProperty() === 'offset' ? 'name' : 'offset');
  }

  togglePropertySearch(): void {
    const propertySearch = this.propertySearch();
    if (propertySearch === 'empty') {
      return;
    }

    if (propertySearch === 'enable') {
      this.propertySearch.set('disable');
    } else {
      this.propertySearch.set('enable');
    }
  }

  toggleFunctionBadge(badge: BadgeFilterItem<RedFunctionAst>, force: boolean = false): void {
    if (badge.isEmpty && !force) {
      return;
    }

    const functionSearch = this.functionSearch();
    if (functionSearch === 'enable') {
      this.functionSearch.set('disable');
    }

    this.functionBadges.update((badges) => {
      const enabledBadges = badges.filter((item) => item.isEnabled);
      const isOnlyBadgeEnabled = enabledBadges.length === 1 && enabledBadges[0] === badge;

      if (isOnlyBadgeEnabled) {
        badges.forEach((item) => item.isEnabled = true);
      } else {
        badges.forEach((item) => item.isEnabled = item === badge);
      }
      return [...badges];
    });
  }

  toggleFunctionSearchFilter(): void {
    const functionSearch = this.functionSearch();
    if (functionSearch === 'empty') {
      return;
    }

    if (functionSearch === 'enable') {
      this.functionSearch.set('disable');
    } else {
      this.functionSearch.set('enable');
    }
  }

  private resetBadges(onlyEmptiness: boolean = false,
                      type: 'property' | 'function' | 'both' = 'both'): void {
    if (type === 'property' || type === 'both') {
      this.propertyBadges.update((badges) => {
        for (const badge of badges) {
          badge.isEmpty = true;
          if (!onlyEmptiness) {
            badge.isEnabled = true;
          }
        }
        return [...badges];
      });
    }

    if (type === 'function' || type === 'both') {
      this.functionBadges.update((badges) => {
        for (const badge of badges) {
          badge.isEmpty = true;
          if (!onlyEmptiness) {
            badge.isEnabled = true;
          }
        }
        return [...badges];
      });
    }
  }

  private computeBadges(properties: RedPropertyAst[],
                        functions: FunctionDocumentation[],
                        type: 'property' | 'function' | 'both' = 'both'): void {
    if (type === 'property' || type === 'both') {
      this.propertyBadges.update((badges) => {
        for (const badge of badges) {
          const hasEnabled = badges.filter((item) => item.isEnabled).length === 1;

          for (const prop of properties) {
            if (prop.visibility === RedVisibilityDef.public && badge.title === 'public') {
              badge.isEmpty = false;
              if (!hasEnabled) {
                badge.isEnabled = true;
              }
              break;
            }
            if (prop.visibility === RedVisibilityDef.protected && badge.title === 'protected') {
              badge.isEmpty = false;
              if (!hasEnabled) {
                badge.isEnabled = true;
              }
              break;
            }
            if (prop.visibility === RedVisibilityDef.private && badge.title === 'private') {
              badge.isEmpty = false;
              if (!hasEnabled) {
                badge.isEnabled = true;
              }
              break;
            }
            if (prop.isPersistent && badge.title === 'persistent') {
              badge.isEmpty = false;
              if (!hasEnabled) {
                badge.isEnabled = true;
              }
              break;
            }
          }
        }

        // Reset lost badge when filters changed and enables back non-empty badges.
        const badgeLost = this.findLostBadge(badges);
        if (badgeLost) {
          for (const badge of badges) {
            if (!badge.isEmpty && !badge.isEnabled) {
              badge.isEnabled = true;
            }
          }
        }
        return [...badges];
      });
    }

    if (type === 'function' || type === 'both') {
      this.functionBadges.update((badges) => {
        const hasEnabled = badges.filter((item) => item.isEnabled).length === 1;

        for (const badge of badges) {
          for (const item of functions) {
            if (item.function.visibility === RedVisibilityDef.public && badge.title === 'public') {
              badge.isEmpty = false;
              if (!hasEnabled) {
                badge.isEnabled = true;
              }
              break;
            }
            if (item.function.visibility === RedVisibilityDef.protected && badge.title === 'protected') {
              badge.isEmpty = false;
              if (!hasEnabled) {
                badge.isEnabled = true;
              }
              break;
            }
            if (item.function.visibility === RedVisibilityDef.private && badge.title === 'private') {
              badge.isEmpty = false;
              if (!hasEnabled) {
                badge.isEnabled = true;
              }
              break;
            }
            if (item.function.isNative && badge.title === 'native') {
              badge.isEmpty = false;
              if (!hasEnabled) {
                badge.isEnabled = true;
              }
              break;
            }
            if (item.function.isStatic && badge.title === 'static') {
              badge.isEmpty = false;
              if (!hasEnabled) {
                badge.isEnabled = true;
              }
              break;
            }
            if (item.function.isFinal && badge.title === 'final') {
              badge.isEmpty = false;
              if (!hasEnabled) {
                badge.isEnabled = true;
              }
              break;
            }
            if (item.function.isThreadSafe && badge.title === 'threadsafe') {
              badge.isEmpty = false;
              if (!hasEnabled) {
                badge.isEnabled = true;
              }
              break;
            }
            if (item.function.isCallback && badge.title === 'callback') {
              badge.isEmpty = false;
              if (!hasEnabled) {
                badge.isEnabled = true;
              }
              break;
            }
            if (item.function.isConst && badge.title === 'const') {
              badge.isEmpty = false;
              if (!hasEnabled) {
                badge.isEnabled = true;
              }
              break;
            }
            if (item.function.isQuest && badge.title === 'quest') {
              badge.isEmpty = false;
              if (!hasEnabled) {
                badge.isEnabled = true;
              }
              break;
            }
            if (item.function.isTimer && badge.title === 'timer') {
              badge.isEmpty = false;
              if (!hasEnabled) {
                badge.isEnabled = true;
              }
              break;
            }
          }
        }

        // Reset lost badge when filters changed and enables back non-empty badges.
        const badgeLost = this.findLostBadge(badges);
        if (badgeLost) {
          for (const badge of badges) {
            if (!badge.isEmpty && !badge.isEnabled) {
              badge.isEnabled = true;
            }
          }
        }
        return [...badges];
      });
    }
  }

  private findLostBadge(badges: BadgeFilterItem<any>[]): BadgeFilterItem<any> | undefined {
    const lost = badges.filter((badge) => badge.isEnabled && badge.isEmpty);
    return (lost.length === 1) ? lost[0] : undefined;
  }

  private scrollToFragment(fragment: string | null): void {
    if (!fragment) {
      return;
    }

    const $element: HTMLElement | null = document.getElementById(fragment);
    if (!$element) {
      return;
    }

    $element.scrollIntoView({block: 'center'});
  }

}
