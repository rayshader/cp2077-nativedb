import {ClassDocumentation} from "./services/documentation.service";

export enum NDBCommand {
  ready,
  import,
  export
}

export interface NDBMessage {
  readonly command: NDBCommand;
  readonly data: ClassDocumentation[] | Blob | Uint8Array;
}

export interface NDBCommandHandler {
  readonly command: NDBCommand;
  readonly fn: (data: any) => void;
}
