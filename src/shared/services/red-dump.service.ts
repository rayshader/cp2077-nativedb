import {computed, inject, Injectable, NgZone, Signal, signal} from "@angular/core";
import {RedNodeAst, RedNodeKind} from "../red-ast/red-node.ast";
import {RedEnumAst} from "../red-ast/red-enum.ast";
import {RedBitfieldAst} from "../red-ast/red-bitfield.ast";
import {RedClassAst} from "../red-ast/red-class.ast";
import {RedFunctionAst} from "../red-ast/red-function.ast";
import {SettingsService} from "./settings.service";
import {cyrb53} from "../string";
import {NDBCommand, NDBCommandHandler, NDBMessage, NDBWorker} from "../worker.common";
import {v4 as uuid} from "uuid";

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

export interface RedDumpWorkerLoadInheritance {
  readonly token: string;
  readonly id: number;
  readonly klass: RedClassAst;
}

@Injectable({
  providedIn: 'root'
})
export class RedDumpService {

  private readonly settingsService: SettingsService = inject(SettingsService);
  private readonly ngZone: NgZone = inject(NgZone);

  private readonly _isReady = signal<boolean>(false);
  private readonly _inheritance = signal<string | undefined>(undefined);
  private readonly _badges = signal<number>(1);

  private readonly _enums = signal<RedEnumAst[]>([]);
  private readonly _bitfields = signal<RedBitfieldAst[]>([]);
  private readonly _functions = signal<RedFunctionAst[]>([]);
  private readonly _classes = signal<RedClassAst[]>([]);
  private readonly _structs = signal<RedClassAst[]>([]);

  readonly isReady: Signal<boolean> = this._isReady;
  readonly inheritance: Signal<string | undefined> = this._inheritance;
  readonly badges: Signal<number> = this._badges;

  readonly nodes = computed<RedNodeAst[]>(() => [
    ...this.enums(),
    ...this.bitfields(),
    ...this.classes(),
    ...this.structs(),
    ...this.functions()
  ]);
  readonly enums: Signal<RedEnumAst[]> = this._enums;
  readonly bitfields: Signal<RedBitfieldAst[]> = this._bitfields;
  readonly functions = computed<RedFunctionAst[]>(() => {
    const functions = this._functions();
    const ignoreDuplicate = this.settingsService.ignoreDuplicate();

    if (!ignoreDuplicate) {
      return functions;
    }
    return functions.filter((item) => {
      return !item.name.startsWith('Operator') && !item.name.startsWith('Cast');
    });
  });
  readonly classes: Signal<RedClassAst[]> = this._classes;
  readonly structs: Signal<RedClassAst[]> = this._structs;

  private worker?: NDBWorker;
  private readonly commands: NDBCommandHandler[] = [
    {command: NDBCommand.rd_load, fn: this.onWorkerLoad.bind(this)},
    {command: NDBCommand.rd_load_aliases, fn: this.onWorkerLoadAliases.bind(this)},
    {command: NDBCommand.rd_load_inheritance, fn: this.onWorkerLoadInheritance.bind(this)},
    {command: NDBCommand.dispose, fn: this.onWorkerDispose.bind(this)},
  ];

  constructor() {
    this.loadWorker();
  }

  getById(id: number, nameOnly?: boolean): RedNodeAst | undefined {
    nameOnly ??= false;

    return this.nodes().find((node) => {
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
    });
  }

  getEnumById(id: number): RedEnumAst | undefined {
    return this.enums().find((item) => item.id === id);
  }

  getBitfieldById(id: number): RedBitfieldAst | undefined {
    return this.bitfields().find((item) => item.id === id);
  }

  getClassById(id: number): RedClassAst | undefined {
    const klass: RedClassAst | undefined = this.classes().find((item) => item.id === id);

    if (!klass) {
      return undefined;
    }
    return this.loadInheritance(klass);
  }

  getStructById(id: number): RedClassAst | undefined {
    return this.structs().find((item) => item.id === id);
  }

  getFunctionById(id: number): RedFunctionAst | undefined {
    return this.functions().find((item) => item.id === id);
  }

  private loadInheritance(object: RedClassAst): RedClassAst {
    if (object.isInheritanceLoaded) {
      return object;
    }
    const token: string = uuid();

    this.worker?.postMessage(<NDBMessage>{
      command: NDBCommand.rd_load_inheritance,
      data: {
        token: token,
        id: object.id,
      }
    });
    return object;
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
    this._enums.set(data.enums);
    this._bitfields.set(data.bitfields);
    this._functions.set(data.functions);
    this._classes.set(data.classes);
    this._structs.set(data.structs);
    this._badges.set(data.badges);
    this._isReady.set(true);
  }

  private onWorkerLoadAliases(data: RedDumpWorkerLoadAliases): void {
    if (data.functions) {
      this._functions.set(data.functions);
    }
    this._classes.set(data.classes);
    this._structs.set(data.structs);
  }

  private async onWorkerLoadInheritance(data: RedDumpWorkerLoadInheritance): Promise<void> {
    this._classes.update((classes) => {
      const index: number = classes.findIndex((klass) => klass.id === data.id);
      if (index === -1) {
        return classes;
      }

      const klass = classes[index];
      if (klass.isInheritanceLoaded) {
        return classes;
      }

      classes = [...classes];
      classes[index] = data.klass;
      return classes;
    });
    this._inheritance.set(data.token);
  }

  private onWorkerDispose(): void {
    this.worker?.terminate();
    this.worker = undefined;
  }
}
