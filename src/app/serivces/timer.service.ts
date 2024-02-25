import { Injectable } from '@angular/core';
import { Subject } from 'rxjs';

@Injectable({
    providedIn: 'root'
})
export class TimerService {
    private _timer: number = 0;
    private _running: boolean = false;
    private _elapsed: number = 0;
    private _tickFn: () => void;

    elapsedChanged: Subject<number> = new Subject<number>();

    constructor() {
        this._tickFn = this.tick.bind(this);
    }

    start() {
        if (this._running) return;
        this.setElapsed(0);
        this._running = true;
        requestAnimationFrame(this._tickFn);
    }

    stop() {
        this._running = false;
    }

    restart() {
        this.stop();
        this.start();
    }

    private tick() {
        this.setElapsed((performance.now() - this._timer) / 1000);
        if (this._running) requestAnimationFrame(this._tickFn);
    }

    private setElapsed(elapsed: number) {
        if (elapsed === 0) this._timer = performance.now();
        this._elapsed = elapsed;
        this.elapsedChanged.next(elapsed);
    }

    get elapsed(): number {
        return this._elapsed;
    }

}
