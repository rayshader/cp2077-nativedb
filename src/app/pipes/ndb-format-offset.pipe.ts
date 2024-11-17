import {Pipe, PipeTransform} from '@angular/core';

@Pipe({
  name: 'ndbFormatOffset',
  standalone: true
})
export class NDBFormatOffsetPipe implements PipeTransform {

  transform(offset: number): string {
    return `0x${offset.toString(16).toUpperCase()}`;
  }

}
