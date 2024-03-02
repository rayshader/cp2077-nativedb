import {Injectable} from "@angular/core";
import {RedDumpService} from "./red-dump.service";
import {BehaviorSubject, combineLatestWith, map, Observable, OperatorFunction, pipe, shareReplay} from "rxjs";
import {RedNodeAst, RedNodeKind} from "../red-ast/red-node.ast";
import {TabItemNode} from "../../app/components/ndb-tabs/ndb-tabs.component";
import {RedClassAst} from "../red-ast/red-class.ast";
import {CodeSyntax, SettingsService} from "./settings.service";
import {RedPropertyAst} from "../red-ast/red-property.ast";
import {RedFunctionAst} from "../red-ast/red-function.ast";
import {RedTypeAst} from "../red-ast/red-type.ast";
import {RedOriginDef} from "../red-ast/red-definitions.ast";

export enum FilterBy {
  name,
  property,
  function,
  usage
}

export interface SearchRequest {
  readonly query: string;
  readonly filter: FilterBy;
}

interface Query {
  readonly filter: FilterBy;
  readonly fn: <T extends RedNodeAst>(nodes: T[], query: string) => T[];
}

@Injectable({
  providedIn: 'root'
})
export class SearchService {
  readonly enums$: Observable<TabItemNode[]>;
  readonly bitfields$: Observable<TabItemNode[]>;
  readonly classes$: Observable<TabItemNode[]>;
  readonly structs$: Observable<TabItemNode[]>;
  readonly functions$: Observable<TabItemNode[]>;

  private readonly querySubject: BehaviorSubject<SearchRequest> = new BehaviorSubject(<SearchRequest>{
    query: '',
    filter: FilterBy.name
  });
  public readonly query$: Observable<SearchRequest> = this.querySubject.asObservable();
  private readonly changeQuerySubject: BehaviorSubject<SearchRequest> = new BehaviorSubject(<SearchRequest>{
    query: '',
    filter: FilterBy.name
  });
  public readonly changeQuery$: Observable<SearchRequest> = this.changeQuerySubject.asObservable();

  private readonly queries: Query[] = [
    {filter: FilterBy.name, fn: this.filterByName.bind(this)},
    {filter: FilterBy.property, fn: this.filterByProperty.bind(this)},
    {filter: FilterBy.function, fn: this.filterByFunction.bind(this)},
    {filter: FilterBy.usage, fn: this.filterByUsage.bind(this)},
  ];

  constructor(private readonly settingsService: SettingsService,
              dumpService: RedDumpService) {
    this.enums$ = this.transformData(dumpService.enums$);
    this.bitfields$ = this.transformData(dumpService.bitfields$);
    this.classes$ = this.transformData(dumpService.classes$);
    this.structs$ = this.transformData(dumpService.structs$);
    this.functions$ = this.transformData(dumpService.functions$);
  }

  public static isProperty(request: SearchRequest) {
    return request.query.length > 0 && request.filter === FilterBy.property;
  }

  public static isFunction(request: SearchRequest) {
    return request.query.length > 0 && request.filter === FilterBy.function;
  }

  public static isUsage(request: SearchRequest) {
    return request.query.length > 0 && request.filter === FilterBy.usage;
  }

  public static filterProperties(properties: RedPropertyAst[], request: SearchRequest): RedPropertyAst[] {
    const words: string[] = request.query.toLowerCase().split(' ');

    return properties.filter((prop) => SearchService.filterProperty(prop, words));
  }

  public static filterFunctions(functions: RedFunctionAst[], request: SearchRequest): RedFunctionAst[] {
    const words: string[] = request.query.toLowerCase().split(' ');

    return functions.filter((func) => SearchService.filterFunction(func, words));
  }

  private static filterProperty(prop: RedPropertyAst, words: string[]): boolean {
    const name: string = prop.name.toLowerCase();

    return words.every((word) => name.includes(word));
  }

  private static filterFunction(func: RedFunctionAst, words: string[]): boolean {
    const name: string = func.name.toLowerCase();

    return words.every((word) => name.includes(word));
  }

  private static hasType(type: RedTypeAst, words: string[]): boolean {
    if (RedTypeAst.isPrimitive(type)) {
      return false;
    }
    if (type.innerType) {
      return this.hasType(type.innerType, words);
    }
    const name: string = type.name.toLowerCase();
    const aliasName: string | undefined = type.aliasName?.toLowerCase();

    return words.every((word) => name.includes(word)) ||
      (!!aliasName && words.every((word) => aliasName.includes(word)));
  }

  search(query: string, filter: FilterBy): void {
    this.querySubject.next({query: query, filter: filter});
  }

  requestSearch(query: string, filter: FilterBy): void {
    this.changeQuerySubject.next({query: query, filter: filter});
  }

  private transformData<T extends RedNodeAst>(data$: Observable<T[]>): Observable<TabItemNode[]> {
    return data$.pipe(
      this.filterScriptOnly(),
      this.filterByQuery(),
      this.getTabData()
    );
  }

  private getTabData<T extends RedNodeAst>(): OperatorFunction<T[], TabItemNode[]> {
    return pipe(
      combineLatestWith(
        this.settingsService.highlightEmptyObject$,
        this.settingsService.code$
      ),
      map(([nodes, highlightEmptyObject, syntax]) => nodes.map((node) => {
        const isEmpty: boolean = RedNodeAst.isEmpty(node);
        let name: string = node.name;

        if (syntax === CodeSyntax.redscript && node.aliasName) {
          name = node.aliasName;
        }
        return <TabItemNode>{
          id: node.id,
          uri: `/${RedNodeKind[node.kind][0]}/${node.id}`,
          name: name,
          isEmpty: highlightEmptyObject && isEmpty,
        };
      })),
      shareReplay(),
    );
  }

  private filterScriptOnly<T extends RedNodeAst>(): OperatorFunction<T[], T[]> {
    return pipe(
      combineLatestWith(this.settingsService.scriptOnly$),
      map(([nodes, scriptOnly]) => {
        if (!scriptOnly) {
          return nodes;
        }
        return nodes.filter((node) => {
          if (node.kind !== RedNodeKind.class && node.kind !== RedNodeKind.struct) {
            return true;
          }
          const object: RedClassAst = node as unknown as RedClassAst;

          return object.origin === RedOriginDef.script;
        });
      })
    );
  }

  private filterByQuery<T extends RedNodeAst>(): OperatorFunction<T[], T[]> {
    return pipe(
      combineLatestWith(this.query$),
      map(([nodes, request]: [T[], SearchRequest]) => {
        if (request.query.length === 0) {
          return nodes;
        }
        const query: Query | undefined = this.queries.find((item) => item.filter === request.filter);

        if (!query) {
          return nodes;
        }
        return query.fn(nodes, request.query);
      })
    );
  }

  private filterByName<T extends RedNodeAst>(nodes: T[], query: string): T[] {
    const words: string[] = query.toLowerCase().split(' ');

    return nodes.filter((node) => {
      const name: string = node.name.toLowerCase();
      const aliasName: string | undefined = node.aliasName?.toLowerCase();

      return words.every((word) => name.includes(word)) ||
        (!!aliasName && words.every((word) => aliasName.includes(word)));
    });
  }

  private filterByProperty<T extends RedNodeAst>(nodes: T[], query: string): T[] {
    const words: string[] = query.toLowerCase().split(' ');

    return nodes.filter((node) => {
      if (node.kind === RedNodeKind.enum || node.kind === RedNodeKind.bitfield || node.kind === RedNodeKind.function) {
        return false;
      }
      const object: RedClassAst = node as unknown as RedClassAst;
      const properties: RedPropertyAst[] = object.properties
        .filter((prop) => SearchService.filterProperty(prop, words));

      return properties.length > 0;
    });
  }

  private filterByFunction<T extends RedNodeAst>(nodes: T[], query: string): T[] {
    const words: string[] = query.toLowerCase().split(' ');

    return nodes.filter((node) => {
      if (node.kind === RedNodeKind.enum || node.kind === RedNodeKind.bitfield || node.kind === RedNodeKind.function) {
        return false;
      }
      const object: RedClassAst = node as unknown as RedClassAst;
      const functions: RedFunctionAst[] = object.functions
        .filter((func) => SearchService.filterFunction(func, words));

      return functions.length > 0;
    });
  }

  private filterByUsage<T extends RedNodeAst>(nodes: T[], query: string): T[] {
    const words: string[] = query.toLowerCase().split(' ');

    return nodes.filter((node) => {
      if (node.kind === RedNodeKind.enum || node.kind === RedNodeKind.bitfield) {
        return false;
      }
      if (node.kind === RedNodeKind.function) {
        const func: RedFunctionAst = node as unknown as RedFunctionAst;

        return func.returnType ? SearchService.hasType(func.returnType!, words) : false;
      }
      const object: RedClassAst = node as unknown as RedClassAst;
      const properties: RedPropertyAst[] = object.properties.filter((prop) => {
        return SearchService.hasType(prop.type, words);
      });
      const functions: RedFunctionAst[] = object.functions.filter((func) => {
        return func.returnType ? SearchService.hasType(func.returnType!, words) : false;
      });

      return properties.length > 0 || functions.length > 0;
    });
  }

}
