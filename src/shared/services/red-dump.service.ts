import {Injectable} from "@angular/core";
import {HttpClient} from "@angular/common/http";
import {
  combineLatest,
  EMPTY,
  filter,
  map,
  mergeAll,
  Observable,
  OperatorFunction,
  pipe,
  reduce,
  shareReplay
} from "rxjs";
import {RedNodeAst, RedNodeKind} from "../red-ast/red-node.ast";
import {RedEnumAst} from "../red-ast/red-enum.ast";
import {RedBitfieldAst} from "../red-ast/red-bitfield.ast";
import {RedClassAst} from "../red-ast/red-class.ast";
import {RedFunctionAst} from "../red-ast/red-function.ast";
import {RedPropertyAst} from "../red-ast/red-property.ast";

@Injectable({
  providedIn: 'root'
})
export class RedDumpService {
  readonly enums$: Observable<RedEnumAst[]>;
  readonly bitfields$: Observable<RedBitfieldAst[]>;
  readonly classes$: Observable<RedClassAst[]>;
  readonly structs$: Observable<RedClassAst[]>;
  readonly functions$: Observable<RedFunctionAst[]>;

  readonly badges$: Observable<number>;

  constructor(private readonly http: HttpClient) {
    this.enums$ = this.http.get(`/assets/reddump/enums.json`).pipe(
      map((json: any) => json.map(RedEnumAst.fromJson)),
      shareReplay()
    );
    this.bitfields$ = this.http.get(`/assets/reddump/bitfields.json`).pipe(
      map((json: any) => json.map(RedBitfieldAst.fromJson)),
      shareReplay()
    );
    const classes$ = this.http.get(`/assets/reddump/classes.json`).pipe(
      map((json: any) => json.map(RedClassAst.fromJson)),
      shareReplay()
    );

    this.classes$ = classes$.pipe(
      map((json: any) => json.filter((item: RedClassAst) => !item.isStruct)),
      shareReplay()
    );
    this.structs$ = classes$.pipe(
      map((json: any) => json.filter((item: RedClassAst) => item.isStruct)),
      shareReplay()
    );
    this.functions$ = this.http.get(`/assets/reddump/globals.json`).pipe(
      map((json: any) => json.map(RedFunctionAst.fromJson)),
      shareReplay(),
      this.ignoreDuplicate(),
    );
    this.badges$ = combineLatest([this.classes$, this.structs$]).pipe(
      mergeAll(),
      mergeAll(),
      map((object: RedClassAst) => {
        const props = object.properties.map(RedPropertyAst.computeBadges).reduce(this.getMax, 1);
        const funcs = object.functions.map(RedFunctionAst.computeBadges).reduce(this.getMax, 1);

        return Math.max(props, funcs);
      }),
      reduce(this.getMax),
      shareReplay(),
    );
  }

  getTypeById(id: number): Observable<RedNodeKind | undefined> {
    return combineLatest([
      this.enums$,
      this.bitfields$,
      this.classes$,
      this.structs$,
      this.functions$
    ]).pipe(
      mergeAll(),
      mergeAll(),
      filter((node: RedNodeAst) => node.id === id),
      map((node: RedNodeAst) => node.kind)
    );
  }

  getEnumById(id: number): Observable<RedEnumAst | undefined> {
    return this.enums$.pipe(this.getById(id));
  }

  getBitfieldById(id: number): Observable<RedBitfieldAst | undefined> {
    return this.bitfields$.pipe(this.getById(id));
  }

  getClassById(id: number): Observable<RedClassAst | undefined> {
    return this.classes$.pipe(this.getById(id));
  }

  getStructById(id: number): Observable<RedClassAst | undefined> {
    return this.structs$.pipe(this.getById(id));
  }

  getFunctionById(id: number): Observable<RedFunctionAst | undefined> {
    return this.functions$.pipe(this.getById(id));
  }

  getParentsByName(name: string,
                   kind: RedNodeKind.class | RedNodeKind.struct): Observable<RedClassAst[]> {
    let query$: Observable<RedClassAst[]>;

    if (kind === RedNodeKind.class) {
      query$ = this.classes$;
    } else if (kind === RedNodeKind.struct) {
      query$ = this.structs$;
    } else {
      return EMPTY;
    }
    return query$.pipe(
      map((objects) => {
        const parents: RedClassAst[] = [];
        let parent = objects.find((object) => object.name === name);

        if (parent) {
          parents.push(parent);
        }
        while (parent && parent.parent) {
          parent = objects.find((object) => object.name === parent!.parent);
          if (parent) {
            parents.push(parent);
          }
        }
        return parents;
      })
    );
  }

  getChildrenByName(name: string,
                    kind: RedNodeKind.class | RedNodeKind.struct): Observable<RedClassAst[]> {
    let query$: Observable<RedClassAst[]>;

    if (kind === RedNodeKind.class) {
      query$ = this.classes$;
    } else if (kind === RedNodeKind.struct) {
      query$ = this.structs$;
    } else {
      return EMPTY;
    }
    return query$.pipe(
      map((objects) => {
        return objects.filter((object) => object.parent === name);
      })
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

  private getById<T extends RedNodeAst>(id: number): OperatorFunction<T[], T | undefined> {
    return pipe(
      map((objects) => objects.find((object) => object.id === id))
    );
  }

  private getMax(a: number, b: number): number {
    return Math.max(a, b);
  }
}
