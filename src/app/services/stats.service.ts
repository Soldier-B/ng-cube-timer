import { Injectable } from '@angular/core';

function average(arr: Array<number>): number {
    return 0;
}

@Injectable({
    providedIn: 'root'
})
export class StatsService {

    constructor() { }

    average(arr: Array<number>): number {
        return arr.reduce((a, b) => a + b) / arr.length;
    }

    wcaAverage(arr: Array<number>): number {
        arr.sort();
        return this.average(arr.slice(1, arr.length - 1));
    }

    best(arr: Array<number>): number {
        return Math.min(...arr);
    }

    worst(arr: Array<number>): number {
        return Math.max(...arr);
    }
}
