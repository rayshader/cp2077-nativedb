import {Injectable} from "@angular/core";
import {RedDumpService} from "./red-dump.service";
import {BehaviorSubject, combineLatest, map, Observable, OperatorFunction, pipe, shareReplay} from "rxjs";
import {RedNodeAst} from "../red-ast/red-node.ast";

@Injectable({
  providedIn: 'root'
})
export class SearchService {
  readonly enums$: Observable<RedNodeAst[]>;
  readonly bitfields$: Observable<RedNodeAst[]>;
  readonly classes$: Observable<RedNodeAst[]>;
  readonly structs$: Observable<RedNodeAst[]>;
  readonly functions$: Observable<RedNodeAst[]>;

  private readonly querySubject: BehaviorSubject<string> = new BehaviorSubject('');
  private readonly query$: Observable<string> = this.querySubject.asObservable();

  constructor(dumpService: RedDumpService) {
    this.enums$ = combineLatest([dumpService.enums$.pipe(this.getTabData()), this.query$]).pipe(this.filterByQuery());
    this.bitfields$ = combineLatest([dumpService.bitfields$.pipe(this.getTabData()), this.query$]).pipe(this.filterByQuery());
    this.classes$ = combineLatest([dumpService.classes$.pipe(this.getTabData()), this.query$]).pipe(this.filterByQuery());
    this.structs$ = combineLatest([dumpService.structs$.pipe(this.getTabData()), this.query$]).pipe(this.filterByQuery());
    this.functions$ = combineLatest([dumpService.functions$.pipe(this.getTabData()), this.query$]).pipe(this.filterByQuery());
  }

  search(query: string): void {
    this.querySubject.next(query);
  }

  private getTabData<T extends RedNodeAst>(): OperatorFunction<T[], RedNodeAst[]> {
    return pipe(
      map((nodes) => nodes.map((node) => <RedNodeAst>{id: node.id, name: node.name})),
      shareReplay(),
    );
  }

  private filterByQuery<T extends RedNodeAst>(): OperatorFunction<[T[], string], T[]> {
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
