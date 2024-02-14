/// <reference lib="webworker" />

import {NDBCommand, NDBCommandHandler, NDBMessage} from "../../../shared/worker.common";
import {ClassDocumentation} from "../../../shared/services/documentation.service";
import {BrotliService} from "../../../shared/services/brotli.service";
import {DocumentationParser} from "../../../shared/parsers/documentation.parser";

const commands: NDBCommandHandler[] = [
  {command: NDBCommand.import, fn: importDocumentation},
  {command: NDBCommand.export, fn: exportDocumentation},
];

const brotliService: BrotliService = new BrotliService();
const parser: DocumentationParser = new DocumentationParser(brotliService);
let isReady: boolean = false;

(async () => {
  if ('onconnect' in self) {
    // SharedWorker
    addEventListener('connect', onConnection);
  } else {
    // Worker
    addEventListener('message', onMessage);
    await load();
  }
})();

async function onConnection(event: any): Promise<void> {
  const port: MessagePort = event.ports[0];

  port.onmessage = (message: MessageEvent) => onMessage(message, port);
  await load(port);
}

function onMessage(event: MessageEvent, port?: MessagePort): void {
  const message: NDBMessage = event.data;
  const command: NDBCommand = message.command;
  const handler: NDBCommandHandler | undefined = commands.find((item) => item.command === command);

  if (!handler) {
    console.warn('DocumentationWorker: unknown command.');
    return;
  }
  handler.fn(message.data, port);
}

async function load(port?: MessagePort): Promise<void> {
  if (isReady) {
    sendMessage(<NDBMessage>{
      command: NDBCommand.ready
    }, port);
    return;
  }
  await parser.load();
  isReady = true;
  sendMessage(<NDBMessage>{
    command: NDBCommand.ready
  }, port);
}

function sendMessage(message: NDBMessage, port?: MessagePort): void {
  if (port) {
    port.postMessage(message);
  } else {
    postMessage(message);
  }
}

function importDocumentation(buffer: Uint8Array, port?: MessagePort): void {
  try {
    const data: ClassDocumentation[] = parser.read(buffer);

    sendMessage(<NDBMessage>{
      command: NDBCommand.import,
      data: data
    }, port);
  } catch (error) {
    sendMessage(<NDBMessage>{
      command: NDBCommand.importError,
      data: error
    }, port);
  }
}

function exportDocumentation(data: ClassDocumentation[], port?: MessagePort): void {
  try {
    const file: Blob = parser.write(data);

    sendMessage(<NDBMessage>{
      command: NDBCommand.export,
      data: file
    }, port);
  } catch (error) {
    sendMessage(<NDBMessage>{
      command: NDBCommand.exportError,
      data: error
    }, port);
  }
}
