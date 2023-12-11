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

@Injectable({
  providedIn: 'root'
})
export class SearchService {
  readonly enums$: Observable<TabItemNode[]>;
  readonly bitfields$: Observable<TabItemNode[]>;
  readonly classes$: Observable<TabItemNode[]>;
  readonly structs$: Observable<TabItemNode[]>;
  readonly functions$: Observable<TabItemNode[]>;

  private readonly querySubject: BehaviorSubject<string> = new BehaviorSubject('');
  private readonly query$: Observable<string> = this.querySubject.asObservable();

  constructor(private readonly settingsService: SettingsService,
              dumpService: RedDumpService) {
    this.enums$ = this.transformData(dumpService.enums$);
    this.bitfields$ = this.transformData(dumpService.bitfields$);
    this.classes$ = this.transformData(dumpService.classes$);
    this.structs$ = this.transformData(dumpService.structs$);
    this.functions$ = this.transformData(dumpService.functions$);
  }

  search(query: string): void {
    this.querySubject.next(query);
  }

  private transformData<T extends RedNodeAst>(data$: Observable<T[]>): Observable<TabItemNode[]> {
    return combineLatest([
      data$.pipe(this.getTabData(this.settingsService)),
      this.query$
    ]).pipe(this.filterByQuery());
  }

  private getTabData<T extends RedNodeAst>(settingsService: SettingsService): OperatorFunction<T[], TabItemNode[]> {
    return pipe(
      combineLatestWith(settingsService.highlightEmptyObject$),
      map(([nodes, highlightEmptyObject]) => nodes.map((node) => {
        let isEmpty: boolean = false;

        if (node.kind === RedNodeKind.class || node.kind === RedNodeKind.struct) {
          const classOrStruct: RedClassAst = node as unknown as RedClassAst;

          isEmpty = classOrStruct.properties.length === 0 && classOrStruct.functions.length === 0;
        }
        return <TabItemNode>{
          id: node.id,
          name: node.name,
          isEmpty: highlightEmptyObject && isEmpty,
        };
      })),
      shareReplay(),
    );
  }

  private filterByQuery<T extends TabItemNode>(): OperatorFunction<[T[], string], T[]> {
    return pipe(
      map(([nodes, query]: [T[], string]) => {
        if (query.length === 0) {
          return nodes;
        }
        const words: string[] = query.toLowerCase().split(' ');

        return nodes.filter((node) => {
          return words.every((word) => node.name.toLowerCase().includes(word));
        });
      })
    );
  }

}
