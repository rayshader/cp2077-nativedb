export enum NDBCommand {
  ready,
  import,
  export
}

export interface NDBMessage {
  readonly command: NDBCommand;
  readonly data: any;
}

export interface NDBCommandHandler {
  readonly command: NDBCommand;
  readonly fn: (data: any) => void;
}
