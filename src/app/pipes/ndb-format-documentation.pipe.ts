import {Pipe, PipeTransform} from '@angular/core';

@Pipe({
  name: 'ndbFormatDocumentation',
  standalone: true
})
export class NDBFormatDocumentationPipe implements PipeTransform {

  transform(body: string): string {
    return body.replaceAll('\n', '<br>');
  }

}
