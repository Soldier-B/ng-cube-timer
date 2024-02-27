import { Pipe, PipeTransform } from '@angular/core';

@Pipe({
    name: 'fixedlen',
    standalone: true
})
export class FixedlenPipe implements PipeTransform {

    transform(value: number, length: number = 2): string {
        const output = value.toString();
        return output + '\xa0'.repeat(length - output.length);
    }
    
}
