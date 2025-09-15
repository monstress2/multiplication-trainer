import { Pipe, PipeTransform } from '@angular/core';

@Pipe({
  name: 'orderBy',
  standalone: true
})
export class OrderByPipe implements PipeTransform {
  transform(array: any[], field1: string, field2: string): any[] {
    if (!Array.isArray(array)) return array;
    
    return array.sort((a, b) => {
      if (a[field1] !== b[field1]) {
        return a[field1] - b[field1];
      }
      return a[field2] - b[field2];
    });
  }
}