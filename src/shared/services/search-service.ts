import {Injectable} from "@angular/core";
import {RedDumpService} from "./red-dump.service";
import {BehaviorSubject, combineLatest, map, Observable, OperatorFunction, pipe} from "rxjs";
import {RedEnumAst} from "../red-ast/red-enum.ast";
import {RedBitfieldAst} from "../red-ast/red-bitfield.ast";
import {RedClassAst} from "../red-ast/red-class.ast";
import {RedFunctionAst} from "../red-ast/red-function.ast";

interface WithName {
  readonly name: string;
}

@Injectable({
  providedIn: 'root'
})
export class SearchService {
  readonly enums$: Observable<RedEnumAst[]>;
  readonly bitfields$: Observable<RedBitfieldAst[]>;
  readonly classes$: Observable<RedClassAst[]>;
  readonly structs$: Observable<RedClassAst[]>;
  readonly functions$: Observable<RedFunctionAst[]>;

  private readonly querySubject: BehaviorSubject<string> = new BehaviorSubject('');
  private readonly query$: Observable<string> = this.querySubject.asObservable();

  constructor(dumpService: RedDumpService) {
    this.enums$ = combineLatest([dumpService.enums$, this.query$]).pipe(this.filterByQuery());
    this.bitfields$ = combineLatest([dumpService.bitfields$, this.query$]).pipe(this.filterByQuery());
    this.classes$ = combineLatest([dumpService.classes$, this.query$]).pipe(this.filterByQuery());
    this.structs$ = combineLatest([dumpService.structs$, this.query$]).pipe(this.filterByQuery());
    this.functions$ = combineLatest([dumpService.functions$, this.query$]).pipe(this.filterByQuery());
  }

  search(query: string): void {
    this.querySubject.next(query);
  }

  private filterByQuery<T extends WithName>(): OperatorFunction<[T[], string], T[]> {
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
