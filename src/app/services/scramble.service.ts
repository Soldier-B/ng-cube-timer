import { Injectable } from '@angular/core';

enum MoveType {
    Normal,
    Prime,
    Double
}

function randomInt(n: number): number {
    return (Math.random() * n) | 0;
}


@Injectable({
    providedIn: 'root'
})
export class ScrambleService {

    constructor() { }

    getScramble(length: number): string {
        const sides: string = 'udlrfb',
            scramble: Array<string> = [];

        let lastpair: number = -1;

        while (scramble.length < length) {
            const pair = randomInt(3);

            if (pair != lastpair) {
                const offset: number = randomInt(2),
                    moveType: MoveType = randomInt(3) as MoveType;

                let move: string = sides.charAt(pair * 2 + offset);
                if (moveType == MoveType.Prime) move += "'";
                else if (moveType == MoveType.Double) move += "2";

                scramble.push(move);

                lastpair = pair;
            }
        }

        return scramble.join(' ');
    }
}
