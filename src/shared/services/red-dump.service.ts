import {Injectable, NgZone} from "@angular/core";
import {
  BehaviorSubject,
  combineLatest,
  combineLatestWith,
  firstValueFrom,
  map,
  Observable,
  of,
  OperatorFunction,
  pipe,
  shareReplay,
  Subject,
  switchMap,
  take
} from "rxjs";
import {RedNodeAst, RedNodeKind} from "../red-ast/red-node.ast";
import {RedEnumAst} from "../red-ast/red-enum.ast";
import {RedBitfieldAst} from "../red-ast/red-bitfield.ast";
import {RedClassAst} from "../red-ast/red-class.ast";
import {RedFunctionAst} from "../red-ast/red-function.ast";
import {SettingsService} from "./settings.service";
import {cyrb53} from "../string";
import {NDBCommand, NDBCommandHandler, NDBMessage, NDBWorker} from "../worker.common";
import {InheritData} from "../../app/pages/object/object.component";

export interface RedDumpWorkerLoad {
  readonly enums: RedEnumAst[];
  readonly bitfields: RedBitfieldAst[];
  readonly functions: RedFunctionAst[];
  readonly classes: RedClassAst[];
  readonly structs: RedClassAst[];
  readonly badges: number;
}

export interface RedDumpWorkerLoadAliases {
  readonly functions?: RedFunctionAst[];
  readonly classes: RedClassAst[];
  readonly structs: RedClassAst[];
}

@Injectable({
  providedIn: 'root'
})
export class RedDumpService {

  readonly enums$: Observable<RedEnumAst[]>;
  readonly bitfields$: Observable<RedBitfieldAst[]>;
  readonly functions$: Observable<RedFunctionAst[]>;
  readonly classes$: Observable<RedClassAst[]>;
  readonly structs$: Observable<RedClassAst[]>;
  readonly badges$: Observable<number>;
  readonly isReady$: Observable<boolean>;

  private readonly enums: BehaviorSubject<RedEnumAst[]> = new BehaviorSubject<RedEnumAst[]>([]);
  private readonly bitfields: BehaviorSubject<RedBitfieldAst[]> = new BehaviorSubject<RedBitfieldAst[]>([]);
  private readonly functions: BehaviorSubject<RedFunctionAst[]> = new BehaviorSubject<RedFunctionAst[]>([]);
  private readonly classes: BehaviorSubject<RedClassAst[]> = new BehaviorSubject<RedClassAst[]>([]);
  private readonly structs: BehaviorSubject<RedClassAst[]> = new BehaviorSubject<RedClassAst[]>([]);
  private readonly badges: BehaviorSubject<number> = new BehaviorSubject<number>(1);
  private readonly inheritance: Subject<RedClassAst> = new Subject<RedClassAst>();
  private readonly isReady: BehaviorSubject<boolean> = new BehaviorSubject<boolean>(false);

  private readonly nodes$: Observable<RedNodeAst[]>;
  private readonly inheritance$: Observable<RedClassAst> = this.inheritance.asObservable();

  private worker?: NDBWorker;
  private readonly commands: NDBCommandHandler[] = [
    {command: NDBCommand.rd_load, fn: this.onWorkerLoad.bind(this)},
    {command: NDBCommand.rd_load_aliases, fn: this.onWorkerLoadAliases.bind(this)},
    {command: NDBCommand.rd_load_inheritance, fn: this.onWorkerLoadInheritance.bind(this)},
    {command: NDBCommand.dispose, fn: this.onWorkerDispose.bind(this)},
  ];

  constructor(private readonly settingsService: SettingsService,
              private readonly ngZone: NgZone) {
    this.enums$ = this.enums.asObservable();
    this.bitfields$ = this.bitfields.asObservable();
    this.functions$ = this.functions.asObservable().pipe(
      this.ignoreDuplicate()
    );
    this.classes$ = this.classes.asObservable();
    this.structs$ = this.structs.asObservable();
    this.badges$ = this.badges.asObservable();
    this.isReady$ = this.isReady.asObservable();
    this.loadWorker();

    this.nodes$ = combineLatest([
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
        let match: boolean;

        if (nameOnly || node.kind === RedNodeKind.function) {
          match = cyrb53(node.name) === id;
        } else {
          match = node.id === id;
        }
        if (!match && node.aliasName) {
          match = cyrb53(node.aliasName) === id;
        }
        return match;
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
    return this.classes$.pipe(
      this.findById(id),
      this.loadInheritance()
    );
  }

  getStructById(id: number): Observable<RedClassAst | undefined> {
    return this.structs$.pipe(
      this.findById(id),
      this.loadInheritance()
    );
  }

  getFunctionById(id: number): Observable<RedFunctionAst | undefined> {
    return this.functions$.pipe(this.findById(id));
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

  private findById<T extends RedNodeAst>(id: number): OperatorFunction<T[], T | undefined> {
    return pipe(
      map((objects) => objects.find((object) => object.id === id))
    );
  }

  private loadInheritance(): OperatorFunction<RedClassAst | undefined, RedClassAst | undefined> {
    return pipe(
      switchMap((object) => {
        if (!object) {
          return of(object);
        }
        if (object.isInheritanceLoaded) {
          return of(object);
        }
        this.worker?.postMessage(<NDBMessage>{
          command: NDBCommand.rd_load_inheritance,
          data: object.id
        });
        return this.inheritance$.pipe(take(1));
      })
    );
  }

  private loadWorker(): void {
    if (!NDBWorker.isCompatible()) {
      return;
    }
    let instance: Worker | SharedWorker;

    if (typeof SharedWorker !== 'undefined') {
      instance = new SharedWorker(new URL('./red-dump.worker', import.meta.url));
    } else {
      instance = new Worker(new URL('./red-dump.worker', import.meta.url));
    }
    this.worker = new NDBWorker(instance!, this.ngZone);
    this.worker.onmessage = this.onMessage.bind(this);
  }

  private async onMessage(event: MessageEvent): Promise<void> {
    const message: NDBMessage = event.data as NDBMessage;
    const handler: NDBCommandHandler | undefined = this.commands.find((item) => item.command === message.command);

    if (!handler) {
      console.warn('MainWorker: unknown command.');
      return;
    }
    await handler.fn(message.data);
  }

  private onWorkerLoad(data: RedDumpWorkerLoad): void {
    this.enums.next(data.enums);
    this.bitfields.next(data.bitfields);
    this.functions.next(data.functions);
    this.classes.next(data.classes);
    this.structs.next(data.structs);
    this.badges.next(data.badges);
    this.isReady.next(true);
  }

  private onWorkerLoadAliases(data: RedDumpWorkerLoadAliases): void {
    if (data.functions) {
      this.functions.next(data.functions);
    }
    this.classes.next(data.classes);
    this.structs.next(data.structs);
  }

  private async onWorkerLoadInheritance([id, parents, children]: [number, InheritData[], InheritData[]]): Promise<void> {
    const object: RedClassAst | undefined = await firstValueFrom(this.getById(id)) as RedClassAst;

    if (!object || object.isInheritanceLoaded) {
      return;
    }
    object.parents.push(...parents);
    object.children.push(...children);
    object.isInheritanceLoaded = true;
    this.inheritance.next(object);
  }

  private onWorkerDispose(): void {
    this.worker?.terminate();
    this.worker = undefined;
  }
}
