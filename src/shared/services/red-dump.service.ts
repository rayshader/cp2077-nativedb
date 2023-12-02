import {Injectable} from "@angular/core";
import {HttpClient} from "@angular/common/http";
import {RedEnumAst} from "../red-ast/red-enum.ast";
import {combineLatest, filter, map, mergeAll, Observable, shareReplay} from "rxjs";
import {RedBitfieldAst} from "../red-ast/red-bitfield.ast";
import {RedClassAst} from "../red-ast/red-class.ast";
import {RedStructAst} from "../red-ast/red-struct.ast";
import {RedFunctionAst} from "../red-ast/red-function.ast";
import {RedNodeAst, RedNodeKind} from "../red-ast/red-node.ast";

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
      filter((node: RedNodeAst) => node.id == id),
      map((node: RedNodeAst) => node.kind)
    );
  }

  getEnumById(id: number): Observable<RedEnumAst | undefined> {
    return this.enums$.pipe(
      mergeAll(),
      filter((node) => node.id == id)
    );
  }

  getBitfieldById(id: number): Observable<RedBitfieldAst | undefined> {
    return this.bitfields$.pipe(
      mergeAll(),
      filter((node) => node.id == id)
    );
  }

  getClassById(id: number): Observable<RedClassAst | undefined> {
    return this.classes$.pipe(
      mergeAll(),
      filter((node) => node.id == id)
    );
  }

  getStructById(id: number): Observable<RedStructAst | undefined> {
    return this.structs$.pipe(
      mergeAll(),
      filter((node) => node.id == id)
    );
  }

  getFunctionById(id: number): Observable<RedFunctionAst | undefined> {
    return this.functions$.pipe(
      mergeAll(),
      filter((node) => node.id == id)
    );
  }
}
