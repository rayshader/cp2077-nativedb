import {Injectable, isDevMode} from "@angular/core";
import {BrotliWasmType} from "brotli-wasm";

@Injectable({
  providedIn: 'root'
})
export class BrotliService {

  private readonly encoder: TextEncoder = new TextEncoder();
  private readonly decoder: TextDecoder = new TextDecoder();
  private brotli?: BrotliWasmType;

  async load(): Promise<void> {
    if (isDevMode()) {
      // NOTE: Use CDN to load WASM module as it is not natively supported by Angular CLI.
      //       See issue https://github.com/angular/angular-cli/issues/25102.
      // @ts-ignore
      this.brotli = await import("https://unpkg.com/brotli-wasm@2.0.1/index.web.js?module").then(m => m.default);
    } else {
      // NOTE: .wasm file is copied in src/ on 'postinstall' event.
      this.brotli = await import("brotli-wasm").then((m: any) => m.default);
    }
  }

  compress(data: string): Uint8Array {
    const buffer: Uint8Array = this.encoder.encode(data);

    return this.brotli!.compress(buffer);
  }

  decompress(buffer: Uint8Array): string {
    const data: Uint8Array = this.brotli!.decompress(buffer);

    return this.decoder.decode(data);
  }

}
