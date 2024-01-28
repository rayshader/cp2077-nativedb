import {Injectable} from "@angular/core";
import {HttpClient} from "@angular/common/http";
import {
  combineLatest,
  combineLatestWith,
  EMPTY,
  map,
  mergeAll,
  Observable,
  OperatorFunction,
  pipe,
  reduce,
  shareReplay,
  zip
} from "rxjs";
import {RedNodeAst, RedNodeKind} from "../red-ast/red-node.ast";
import {RedEnumAst} from "../red-ast/red-enum.ast";
import {RedBitfieldAst} from "../red-ast/red-bitfield.ast";
import {RedClassAst} from "../red-ast/red-class.ast";
import {RedFunctionAst} from "../red-ast/red-function.ast";
import {RedPropertyAst} from "../red-ast/red-property.ast";
import {SettingsService} from "./settings.service";
import {cyrb53} from "../string";
import {RedOriginDef} from "../red-ast/red-definitions.ast";

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

  private readonly nodes$: Observable<RedNodeAst[]>;

  constructor(private readonly http: HttpClient,
              private readonly settingsService: SettingsService) {
    this.enums$ = this.http.get(`/assets/reddump/enums.json`).pipe(
      map((json: any) => json.map(RedEnumAst.fromJson)),
      shareReplay(1)
    );
    this.bitfields$ = this.http.get(`/assets/reddump/bitfields.json`).pipe(
      map((json: any) => json.map(RedBitfieldAst.fromJson)),
      shareReplay(1)
    );
    const objects$: Observable<RedClassAst[]> = this.http.get(`/assets/reddump/classes.json`).pipe(
      map((json: any) => json.map(RedClassAst.fromJson)),
      map((objects: RedClassAst[]) => {
        objects.sort(RedClassAst.sort);
        objects.forEach((object) => {
          object.properties.sort(RedPropertyAst.sort);
          object.functions.sort(RedFunctionAst.sort);
        });
        return objects;
      })
    );

    this.classes$ = objects$.pipe(
      map((objects) => objects.filter((object) => !object.isStruct)),
      shareReplay(1),
      this.scriptOnly()
    );
    this.structs$ = objects$.pipe(
      map((objects) => objects.filter((object) => object.isStruct)),
      shareReplay(1),
      this.scriptOnly()
    );
    this.functions$ = this.http.get(`/assets/reddump/globals.json`).pipe(
      map((json: any) => json.map(RedFunctionAst.fromJson)),
      map((functions) => {
        functions.sort(RedFunctionAst.sort);
        return functions;
      }),
      shareReplay(1),
      this.ignoreDuplicate(),
    );
    this.badges$ = objects$.pipe(
      mergeAll(),
      map((object: RedClassAst) => {
        const props = object.properties.map(RedPropertyAst.computeBadges).reduce(this.getMax, 1);
        const funcs = object.functions.map(RedFunctionAst.computeBadges).reduce(this.getMax, 1);

        return Math.max(props, funcs);
      }),
      reduce(this.getMax),
      shareReplay(1),
    );
    this.nodes$ = zip([
      this.enums$,
      this.bitfields$,
      this.classes$,
      this.structs$,
      this.functions$,
    ]).pipe(
      map((data) => [
        ...data[0] as RedNodeAst[],
        ...data[1] as RedNodeAst[],
        ...data[2] as RedNodeAst[],
        ...data[3] as RedNodeAst[],
        ...data[4] as RedNodeAst[],
      ]),
      shareReplay(1)
    );
  }

  getById(id: number, nameOnly?: boolean): Observable<RedNodeAst | undefined> {
    nameOnly ??= false;
    return this.nodes$.pipe(
      map((nodes) => nodes.find((node) => {
        if (nameOnly) {
          return cyrb53(node.name) === id;
        }
        return node.id === id;
      }))
    );
  }

  getEnumById(id: number): Observable<RedEnumAst | undefined> {
    return this.enums$.pipe(this.findById(id));
  }

  getBitfieldById(id: number): Observable<RedBitfieldAst | undefined> {
    return this.bitfields$.pipe(this.findById(id));
  }

  getClassById(id: number): Observable<RedClassAst | undefined> {
    return this.classes$.pipe(this.findById(id));
  }

  getStructById(id: number): Observable<RedClassAst | undefined> {
    return this.structs$.pipe(this.findById(id));
  }

  getFunctionById(id: number): Observable<RedFunctionAst | undefined> {
    return this.functions$.pipe(this.findById(id));
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
    return pipe(
      combineLatestWith(this.settingsService.ignoreDuplicate$),
      map(([functions, ignoreDuplicate]) => {
        if (!ignoreDuplicate) {
          return functions;
        }
        return functions.filter((func) => {
          return !func.name.startsWith('Operator') && !func.name.startsWith('Cast');
        });
      })
    );
  }

  private scriptOnly(): OperatorFunction<RedClassAst[], RedClassAst[]> {
    return pipe(
      combineLatestWith(this.settingsService.scriptOnly$),
      map(([objects, scriptOnly]) => {
        if (!scriptOnly) {
          return objects;
        }
        return objects.filter((object) => object.origin === RedOriginDef.script);
      })
    );
  }

  private findById<T extends RedNodeAst>(id: number): OperatorFunction<T[], T | undefined> {
    return pipe(
      map((objects) => objects.find((object) => object.id === id))
    );
  }

  private getMax(a: number, b: number): number {
    return Math.max(a, b);
  }
}
