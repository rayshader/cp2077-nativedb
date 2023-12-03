import {Injectable} from "@angular/core";
import {HttpClient} from "@angular/common/http";
import {RedEnumAst} from "../red-ast/red-enum.ast";
import {combineLatest, EMPTY, filter, map, mergeAll, Observable, OperatorFunction, pipe, shareReplay} from "rxjs";
import {RedBitfieldAst} from "../red-ast/red-bitfield.ast";
import {RedClassAst} from "../red-ast/red-class.ast";
import {RedStructAst} from "../red-ast/red-struct.ast";
import {RedFunctionAst} from "../red-ast/red-function.ast";
import {RedNodeAst, RedNodeKind} from "../red-ast/red-node.ast";
import {RedObjectAst} from "../red-ast/red-object.ast";

@Injectable({
  providedIn: 'root'
})
export class RedDumpService {
  readonly enums$: Observable<RedEnumAst[]>;
  readonly bitfields$: Observable<RedBitfieldAst[]>;
  readonly classes$: Observable<RedClassAst[]>;
  readonly structs$: Observable<RedStructAst[]>;
  readonly functions$: Observable<RedFunctionAst[]>;

  constructor(private readonly http: HttpClient) {
    this.enums$ = this.http.get(`/assets/reddump/enums.json`).pipe(
      map((json: any) => json.map((item: any) => RedEnumAst.fromJson(item))),
      shareReplay()
    );
    this.bitfields$ = this.http.get(`/assets/reddump/bitfields.json`).pipe(
      map((json: any) => json.map((item: any) => RedBitfieldAst.fromJson(item))),
      shareReplay()
    );
    this.classes$ = this.http.get(`/assets/reddump/classes.json`).pipe(
      map((json: any) => json.map((item: any) => RedClassAst.fromJson(item))),
      shareReplay()
    );
    this.structs$ = this.http.get(`/assets/reddump/structs.json`).pipe(
      map((json: any) => json.map((item: any) => RedStructAst.fromJson(item))),
      shareReplay()
    );
    this.functions$ = this.http.get(`/assets/reddump/functions.json`).pipe(
      map((json: any) => json.map((item: any) => RedFunctionAst.fromJson(item))),
      shareReplay()
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

  getStructById(id: number): Observable<RedStructAst | undefined> {
    return this.structs$.pipe(this.getById(id));
  }

  getFunctionById(id: number): Observable<RedFunctionAst | undefined> {
    return this.functions$.pipe(this.getById(id));
  }

  getParentsByName<T extends RedObjectAst>(name: string,
                                           kind: RedNodeKind.class | RedNodeKind.struct): Observable<T[]> {
    let query$: Observable<RedObjectAst[]>;

    if (kind === RedNodeKind.class) {
      query$ = this.classes$;
    } else if (kind === RedNodeKind.struct) {
      query$ = this.structs$;
    } else {
      return EMPTY;
    }
    return query$.pipe(
      map((objects) => {
        const parents: T[] = [];
        let parent = objects.find((object) => object.name === name);

        if (parent) {
          parents.push(parent as T);
        }
        while (parent && parent.parent) {
          parent = objects.find((object) => object.name === parent!.parent);
          if (parent) {
            parents.push(parent as T);
          }
        }
        return parents;
      })
    );
  }

  getChildrenByName<T extends RedObjectAst>(name: string,
                                            kind: RedNodeKind.class | RedNodeKind.struct): Observable<T[]> {
    let query$: Observable<RedObjectAst[]>;

    if (kind === RedNodeKind.class) {
      query$ = this.classes$;
    } else if (kind === RedNodeKind.struct) {
      query$ = this.structs$;
    } else {
      return EMPTY;
    }
    return query$.pipe(
      map((objects) => {
        return objects.filter((object) => object.parent === name) as T[];
      })
    );
  }

  private getById<T extends RedNodeAst>(id: number): OperatorFunction<T[], T | undefined> {
    return pipe(
      map((objects) => objects.find((object) => object.id === id))
    );
  }
}
