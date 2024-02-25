import { Pipe, PipeTransform } from '@angular/core';

@Pipe({
  name: 'stopwatch',
  standalone: true
})
export class StopwatchPipe implements PipeTransform {

  transform(time: number, hideWhileTiming:boolean = false, state:string = ''): string {
    // show no time if necessary
    if((state === '' && time === 0) || (hideWhileTiming && state === 'timing')) return '---------';

    // get minutes and seconds
    let minutes = Math.floor(time / 60).toString(),
      seconds = (time % 60).toFixed(3);
    // make sure we have a leading zero if less than 10
    if (minutes.length < 2) minutes = '0' + minutes;
    if (seconds.length < 6) seconds = '0' + seconds;

    return `${minutes}:${seconds}`;
  }

}
