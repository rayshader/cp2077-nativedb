import {ClassDocumentation, MemberDocumentation} from "../services/documentation.service";
import {Injectable} from "@angular/core";
import {BrotliService} from "../services/brotli.service";

@Injectable({
  providedIn: 'root'
})
export class DocumentationParser {

  constructor(private readonly brotliService: BrotliService) {
  }

  async load(): Promise<void> {
    await this.brotliService.load();
  }

  write(documentation: ClassDocumentation[]): Blob {
    const data: any[] = documentation.map(this.writeClass.bind(this));
    const json: string = JSON.stringify(data);
    const buffer: Uint8Array = this.brotliService.compress(json);

    return new Blob([buffer], {type: 'application/octet-stream'});
  }

  private writeClass(object: ClassDocumentation): any {
    const json: any = {
      a: object.id
    };

    if (object.body) {
      json.b = object.body;
    }
    if (object.functions) {
      json.c = object.functions.map(this.writeFunction.bind(this));
    }
    return json;
  }

  private writeFunction(fn: MemberDocumentation): any {
    return {
      a: fn.id,
      b: fn.body
    };
  }

}
