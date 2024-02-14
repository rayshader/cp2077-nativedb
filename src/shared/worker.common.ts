import {NgZone} from "@angular/core";

export enum NDBCommand {
  // Documentation
  ready,
  import,
  export,

  importError,
  exportError,

  // RedDump
  rd_load,
  rd_load_aliases,
  rd_load_inheritance,

  // WebWorker
  dispose
}

export interface NDBMessage {
  readonly command: NDBCommand;
  readonly data: any;
}

export interface NDBCommandHandler {
  readonly command: NDBCommand;
  readonly fn: (data: any, port?: MessagePort) => void | Promise<void>;
}

type WorkerMessageCallback = (event: MessageEvent) => void;

/**
 * Custom worker facade to send/receive messages with either a Worker or a SharedWorker.
 * Fallback to a worker per tab when SharedWorker is not supported (e.g. Chrome Android).
 */
export class NDBWorker {

  // Worker object is created outside to resolve URL in the right place when bundling is triggered.
  // NgZone is required to run message callbacks in Angular context.
  constructor(private readonly worker: Worker | SharedWorker,
              private readonly ngZone: NgZone) {
  }

  set onmessage(fn: WorkerMessageCallback) {
    if (this.worker instanceof Worker) {
      this.worker.onmessage = this.injectMessage(fn);
    } else if (this.worker instanceof SharedWorker) {
      this.worker.port.onmessage = this.injectMessage(fn);
    }
  }

  public static isCompatible(): boolean {
    return typeof Worker !== 'undefined' || typeof SharedWorker !== 'undefined';
  }

  public postMessage(message: any): void {
    if (this.worker instanceof Worker) {
      this.worker.postMessage(message);
    } else if (this.worker instanceof SharedWorker) {
      this.worker.port.postMessage(message);
    }
  }

  public terminate(): void {
    if (this.worker instanceof Worker) {
      this.worker.terminate();
    } else if (this.worker instanceof SharedWorker) {
      this.worker.port.close();
    }
  }

  private injectMessage(fn: WorkerMessageCallback): WorkerMessageCallback {
    return (event: MessageEvent) => {
      this.ngZone.run(() => fn(event));
    };
  }

}
