export enum NDBCommand {
  // Documentation
  ready,
  import,
  export,

  importError,
  exportError,

  // RedDump
  rd_load,
  rd_update,

  // WebWorker
  dispose
}

export interface NDBMessage {
  readonly command: NDBCommand;
  readonly data: any;
}

export interface NDBCommandHandler {
  readonly command: NDBCommand;
  readonly fn: (data: any) => void;
}
