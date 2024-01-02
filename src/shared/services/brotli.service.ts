import {Injectable} from "@angular/core";

interface Brotli {
  compress(buffer: Uint8Array): Uint8Array;

  decompress(buffer: Uint8Array): Uint8Array;
}

@Injectable({
  providedIn: 'root'
})
export class BrotliService {

  private readonly encoder: TextEncoder = new TextEncoder();
  private readonly decoder: TextDecoder = new TextDecoder();
  private brotli?: Brotli;

  async load(): Promise<void> {
    // @ts-ignore
    this.brotli = await import("https://unpkg.com/brotli-wasm@1.3.1/index.web.js?module").then(m => m.default);
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
