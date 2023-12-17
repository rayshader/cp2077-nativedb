import {Injectable} from "@angular/core";
import {RedDumpService} from "./red-dump.service";
import {
  BehaviorSubject,
  combineLatest,
  combineLatestWith,
  map,
  Observable,
  OperatorFunction,
  pipe,
  shareReplay
} from "rxjs";
import {RedNodeAst, RedNodeKind} from "../red-ast/red-node.ast";
import {TabItemNode} from "../../app/components/ndb-tabs/ndb-tabs.component";
import {RedClassAst} from "../red-ast/red-class.ast";
import {SettingsService} from "./settings.service";
import {RedPropertyAst} from "../red-ast/red-property.ast";
import {RedFunctionAst} from "../red-ast/red-function.ast";
import {RedTypeAst} from "../red-ast/red-type.ast";

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
  private readonly query$: Observable<SearchRequest> = this.querySubject.asObservable();

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

  search(query: string, filter: FilterBy): void {
    this.querySubject.next({query: query, filter: filter});
  }

  private transformData<T extends RedNodeAst>(data$: Observable<T[]>): Observable<TabItemNode[]> {
    return combineLatest([
      data$,
      this.query$
    ]).pipe(
      this.filterByQuery(),
      this.getTabData()
    );
  }

  private getTabData<T extends RedNodeAst>(): OperatorFunction<T[], TabItemNode[]> {
    return pipe(
      combineLatestWith(this.settingsService.highlightEmptyObject$),
      map(([nodes, highlightEmptyObject]) => nodes.map((node) => {
        let isEmpty: boolean = false;

        if (node.kind === RedNodeKind.class || node.kind === RedNodeKind.struct) {
          const classOrStruct: RedClassAst = node as unknown as RedClassAst;

          isEmpty = classOrStruct.properties.length === 0 && classOrStruct.functions.length === 0;
        }
        return <TabItemNode>{
          id: node.id,
          uri: `/${RedNodeKind[node.kind][0]}/${node.id}`,
          name: node.name,
          isEmpty: highlightEmptyObject && isEmpty,
        };
      })),
      shareReplay(),
    );
  }

  private filterByQuery<T extends RedNodeAst>(): OperatorFunction<[T[], SearchRequest], T[]> {
    return pipe(
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

      return words.every((word) => name.includes(word));
    });
  }

  private filterByProperty<T extends RedNodeAst>(nodes: T[], query: string): T[] {
    const words: string[] = query.toLowerCase().split(' ');

    return nodes.filter((node) => {
      if (node.kind === RedNodeKind.enum || node.kind === RedNodeKind.bitfield || node.kind === RedNodeKind.function) {
        return false;
      }
      const object: RedClassAst = node as unknown as RedClassAst;
      const properties: RedPropertyAst[] = object.properties.filter((prop) => {
        const name: string = prop.name.toLowerCase();

        return words.every((word) => name.includes(word));
      });

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
      const functions: RedFunctionAst[] = object.functions.filter((func) => {
        const name: string = func.name.toLowerCase();

        return words.every((word) => name.includes(word));
      });

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

        return func.returnType ? this.hasType(words, func.returnType!) : false;
      }
      const object: RedClassAst = node as unknown as RedClassAst;
      const properties: RedPropertyAst[] = object.properties.filter((prop) => {
        return this.hasType(words, prop.type);
      });
      const functions: RedFunctionAst[] = object.functions.filter((func) => {
        return func.returnType ? this.hasType(words, func.returnType!) : false;
      });

      return properties.length > 0 || functions.length > 0;
    });
  }

  private hasType(words: string[], type: RedTypeAst): boolean {
    if (RedTypeAst.isPrimitive(type)) {
      return false;
    }
    if (type.innerType) {
      return this.hasType(words, type.innerType);
    }
    const name: string = type.name.toLowerCase();

    return words.every((word) => name.includes(word));
  }

}
