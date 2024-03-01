import { Component, ElementRef, HostBinding, HostListener, QueryList, SimpleChanges, ViewChild, ViewChildren } from '@angular/core';
import { TimerService } from './services/timer.service';
import { StopwatchPipe } from './pipes/stopwatch.pipe';
import { DialogComponent } from './components/dialog/dialog.component';
import { SettingsComponent } from './components/settings/settings.component';
import { ScrambleService } from './services/scramble.service';
import { WakeLockService } from './services/wake-lock.service';
import { StatsService } from './services/stats.service';
import * as confetti from 'canvas-confetti';

enum TimerState {
    Waiting = 'waiting',
    Staging = 'staging',
    Staged = 'staged',
    Timing = 'timing',
    Timed = 'timed'
}

export type Theme = 'auto' | 'light' | 'dark';

@Component({
    selector: 'body',
    standalone: true,
    imports: [StopwatchPipe, DialogComponent, SettingsComponent],
    templateUrl: './app.component.html',
    styleUrl: './app.component.scss'
})
export class AppComponent {
    // make enum available in template
    readonly TimerState: typeof TimerState = TimerState;

    // child component references
    @ViewChildren(DialogComponent) dialogs!: QueryList<DialogComponent>;
    @ViewChild(SettingsComponent) settings!: SettingsComponent;

    // settings
    @HostBinding('class') theme: Theme = 'auto';
    scrambleLength: number = 25;
    hideWhileTiming: boolean = false;
    showPreviousTimes: boolean = false;

    // state
    state: TimerState = TimerState.Waiting;
    scramble: string = '';
    pressed: boolean = false;
    fullscreen: boolean = false;
    best: number = 0;
    avg5: number = 0;
    avg12: number = 0;
    stagingTime: number = 0;
    solvingTime: number = 0;
    times: number[] = [];
    last: number[] = [];
    pointer?: number;

    kc: Array<number> = [38, 38, 40, 40, 37, 39, 37, 39, 66, 65];
    ci: number = 0;
    ce: boolean = false;

    constructor(
        private timerSvc: TimerService,
        private scrambleSvc: ScrambleService,
        private wakelockSvc: WakeLockService,
        private statsSvc: StatsService,
        private elRef: ElementRef) {
        // load settings from local db or localstorage
        this.theme = this.load<Theme>('thm', 'auto');
        this.scrambleLength = this.load<number>('scr', 20);
        this.hideWhileTiming = this.load<boolean>('hid', false);
        this.showPreviousTimes = this.load<boolean>('shw', true);
        this.times = this.load<Array<number>>('tim', []);

        this.init();
    }

    get elapsed(): number {
        return this.timerSvc.elapsed;
    }

    init() {
        // generate initial scramble
        this.scramble = this.scrambleSvc.getScramble(this.scrambleLength);

        // generate initial stats
        this.updateStats();

        // wire up key handlers
        window.onkeydown = window.onkeyup = (e: KeyboardEvent) => {
            switch (e.key) {
                case 'Escape':
                    this.cancelDialogs();
                    break;
                case ' ':
                    this.setPressed(e.type === 'keydown');
                    e.preventDefault();
                    break
                default:
                    if (e.type === 'keyup') return;
                    if (e.keyCode === this.kc[this.ci]) {
                        if (++this.ci === this.kc.length) {
                            this.celebrate(false);
                            this.ci = 0;
                            this.ce = !this.ce;
                        }
                    }
                    else
                        this.ci = 0
            }
        };

        document.onfullscreenchange = (e) => {
            this.fullscreen = !!document.fullscreenElement;
        }

        this.timerSvc.elapsedChanged.subscribe((elapsed) => {
            switch (this.state) {
                case TimerState.Staging:
                case TimerState.Staged:
                    this.stagingTime = elapsed;
                    if (this.pointer !== undefined)
                        this.setPressed(this.pressed);
                    break;
                case TimerState.Timing:
                    this.solvingTime = elapsed;
                    break;
            }
        });
    }

    load<T>(key: string, defaultValue: T): T {
        try {
            const json = localStorage.getItem(`cubetimer.${key}`);
            if (json != null) {
                const value: any = JSON.parse(json);
                return value as T;
            }
        }
        catch (e) { }

        return defaultValue;
    }

    save<T>(key: string, value: T) {
        localStorage.setItem(`cubetimer.${key}`, JSON.stringify(value));
    }

    toggleFullscreen(event: MouseEvent) {
        // stop event propagation and prevent element from being selected afterwards
        event.stopImmediatePropagation();
        (event.target as HTMLElement).blur();

        if (this.fullscreen)
            document.exitFullscreen();
        else
            this.elRef.nativeElement.requestFullscreen();
    }

    setPressed(pressed: boolean) {
        this.pressed = pressed;

        switch (this.state) {
            case TimerState.Waiting:
                if (this.pressed) {
                    this.timerSvc.start();
                    this.state = TimerState.Staging;
                }
                break;

            case TimerState.Staging:
                if (this.pressed && this.timerSvc.elapsed >= .5)
                    this.state = TimerState.Staged;
                else if (!this.pressed) {
                    this.timerSvc.stop();
                    this.state = TimerState.Waiting;
                }
                break;

            case TimerState.Staged:
                if (!this.pressed) {
                    this.wakelockSvc.requestWakeLock();
                    this.timerSvc.restart();
                    this.state = TimerState.Timing;
                }
                break;

            case TimerState.Timing:
                if (this.pressed) {
                    this.timerSvc.stop();
                    this.scramble = this.scrambleSvc.getScramble(this.scrambleLength);
                    this.updateStats(this.solvingTime);
                    this.wakelockSvc.releaseWakeLock();
                    this.state = TimerState.Timed;
                }
                break;
            case TimerState.Timed:
                if (!this.pressed)
                    this.state = TimerState.Waiting;
                break;
        }

    }

    updateStats(newTime?: number) {
        if (newTime !== undefined) {
            if (this.times.length > 0 && newTime < this.best && this.ce)
                this.celebrate(true);
            this.times.push(newTime);
        }

        this.save<Array<number>>('tim', this.times);

        const len = this.times.length;

        this.best = len >= 1 ? this.statsSvc.best(this.times) : 0;
        this.avg5 = len >= 5 ? this.statsSvc.average(this.times.slice(-5)) : 0;
        this.avg12 = len >= 12 ? this.statsSvc.average(this.times.slice(-12)) : 0;

        this.last = this.times.slice(-10);
    }

    clearStats() {
        this.solvingTime = 0;
        this.times.length = 0;
        this.updateStats();
    }

    get hasMoreTimes(): boolean {
        return this.times.length > this.last.length;
    }

    showSettings() {
        this.settings.load({
            theme: this.theme,
            scrambleLength: this.scrambleLength,
            hideWhileTiming: this.hideWhileTiming,
            showPreviousTimes: this.showPreviousTimes
        });
    }

    handleAction(action: string) {
        console.log('handle action', action);
        switch (action) {
            case 'clear':
                this.clearStats();
                break;
            case 'save':
                // get updated settings and save them
                const settings = this.settings.save();
                this.updateTheme(settings.theme);
                this.updateScrambleLength(settings.scrambleLength);
                this.updateHideWhileTiming(settings.hideWhileTiming);
                this.updateShowPreviousTimes(settings.showPreviousTimes);
                break;
        }
    }

    updateTheme(theme: Theme) {
        if (theme !== this.theme) {
            this.theme = theme;
            this.save<Theme>('thm', this.theme);
        }
    }

    updateScrambleLength(scrambleLength: number) {
        if (scrambleLength !== this.scrambleLength) {
            this.scrambleLength = scrambleLength;
            this.scramble = this.scrambleSvc.getScramble(this.scrambleLength);
            this.save<number>('sln', this.scrambleLength);
        }
    }

    updateHideWhileTiming(hideWhileTiming: boolean) {
        if (hideWhileTiming !== this.hideWhileTiming) {
            this.hideWhileTiming = hideWhileTiming;
            this.save<boolean>('hid', this.hideWhileTiming);
        }
    }

    updateShowPreviousTimes(showPreviousTimes: boolean) {
        if (showPreviousTimes !== this.showPreviousTimes) {
            this.showPreviousTimes = showPreviousTimes;
            this.save<boolean>('shw', this.showPreviousTimes);
        }
    }

    cancelDialogs() {
        for (const dialog of this.dialogs) dialog.hide('cancel');
    }

    celebrate(newBest: boolean) {
        if (newBest) {
            for (var i = 0; i < 3; i++) {
                setTimeout(() => {
                    confetti.default({
                        spread: 360,
                        ticks: 50,
                        gravity: 0,
                        decay: 0.94,
                        startVelocity: 30,
                        colors: ['FFE400', 'FFBD00', 'E89400', 'FFCA6C', 'FDFFB8'],
                        particleCount: 40,
                        scalar: 1.2,
                        shapes: ['star']
                    })
                }, i * 150);
            }
        }
        else {
            confetti.default({
                particleCount: 100,
                spread: 160,
                origin: { y: 0.6 }
            });
        }
    }

    @HostListener('pointerdown', ['$event'])
    @HostListener('pointerup', ['$event'])
    onPointer(e: PointerEvent) {
        if ((e.target as HTMLElement).tagName === 'BUTTON') return;

        let handled = true;

        if (e.type === 'pointerdown' && this.pointer === undefined) {
            this.pointer = e.pointerId;
            this.setPressed(true);
            handled = true;
        }
        else if (e.type === 'pointerup' && this.pointer === e.pointerId) {
            this.pointer = undefined;
            this.setPressed(false);
            handled = true;
        }

        if (!handled) return;

        e.stopImmediatePropagation();
        e.preventDefault();
    };

}
