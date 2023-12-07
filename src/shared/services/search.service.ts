import {Injectable} from "@angular/core";
import {RedDumpService} from "./red-dump.service";
import {BehaviorSubject, combineLatest, map, Observable, OperatorFunction, pipe, shareReplay} from "rxjs";
import {RedNodeAst, RedNodeKind} from "../red-ast/red-node.ast";
import {RedFunctionAst} from "../red-ast/red-function.ast";
import {TabItemNode} from "../../app/components/red-ast-tabs/red-ast-tabs.component";
import {RedClassAst} from "../red-ast/red-class.ast";

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

  constructor(dumpService: RedDumpService) {
    this.enums$ = combineLatest([dumpService.enums$.pipe(this.getTabData()), this.query$]).pipe(this.filterByQuery());
    this.bitfields$ = combineLatest([dumpService.bitfields$.pipe(this.getTabData()), this.query$]).pipe(this.filterByQuery());
    this.classes$ = combineLatest([dumpService.classes$.pipe(this.getTabData()), this.query$]).pipe(this.filterByQuery());
    this.structs$ = combineLatest([dumpService.structs$.pipe(this.getTabData()), this.query$]).pipe(this.filterByQuery());
    this.functions$ = combineLatest([dumpService.functions$.pipe(this.ignoreDuplicate(), this.getTabData()), this.query$]).pipe(this.filterByQuery());
  }

  search(query: string): void {
    this.querySubject.next(query);
  }

  private getTabData<T extends RedNodeAst>(): OperatorFunction<T[], TabItemNode[]> {
    return pipe(
      map((nodes) => nodes.map((node) => {
        let isEmpty: boolean = false;

        if (node.kind === RedNodeKind.class || node.kind === RedNodeKind.struct) {
          const classOrStruct: RedClassAst = node as unknown as RedClassAst;

          isEmpty = classOrStruct.properties.length === 0 && classOrStruct.functions.length === 0;
        }
        return <TabItemNode>{
          id: node.id,
          name: node.name,
          isEmpty: isEmpty,
        };
      })),
      shareReplay(),
    );
  }

  private ignoreDuplicate(): OperatorFunction<RedFunctionAst[], RedFunctionAst[]> {
    // TODO: use SettingsService to enable/disable this filtering.
    return pipe(
      map((funcs) => {
        return funcs.filter((func) => {
          return !func.name.startsWith('Operator') && !func.name.startsWith('Cast');
        });
      })
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
