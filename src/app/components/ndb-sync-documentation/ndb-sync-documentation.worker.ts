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

(async () => {
  await parser.load();

  postMessage(<NDBMessage>{
    command: NDBCommand.ready
  });
})();

addEventListener('message', (event: MessageEvent) => {
  const message: NDBMessage = event.data;
  const command: NDBCommand = message.command;
  const handler: NDBCommandHandler | undefined = commands.find((item) => item.command === command);

  if (!handler) {
    console.warn('DocumentationWorker: unknown command.');
    return;
  }
  handler.fn(message.data);
});

function importDocumentation(buffer: Uint8Array): void {
  try {
    const data: ClassDocumentation[] = parser.read(buffer);

    postMessage(<NDBMessage>{
      command: NDBCommand.import,
      data: data
    });
  } catch (error) {
    postMessage(<NDBMessage>{
      command: NDBCommand.importError,
      data: error
    });
  }
}

function exportDocumentation(data: ClassDocumentation[]): void {
  try {
    const file: Blob = parser.write(data);

    postMessage(<NDBMessage>{
      command: NDBCommand.export,
      data: file
    });
  } catch (error) {
    postMessage(<NDBMessage>{
      command: NDBCommand.exportError,
      data: error
    });
  }
}
