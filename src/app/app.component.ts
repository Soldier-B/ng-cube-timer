import { Component, HostBinding, QueryList, SimpleChanges, ViewChild, ViewChildren } from '@angular/core';
import { TimerService } from './services/timer.service';
import { StopwatchPipe } from './pipes/stopwatch.pipe';
import { DialogComponent } from './components/dialog/dialog.component';
import { SettingsComponent } from './components/settings/settings.component';
import { ScrambleService } from './services/scramble.service';
import { WakeLockService } from './services/wake-lock.service';

enum TimerState {
    Waiting = 'waiting',
    Staging = 'staging',
    Staged = 'staged',
    Timing = 'timing',
    Timed = 'timed'
}

enum MoveType {
    Normal,
    Prime,
    Double
}

function randomInt(n: number): number {
    return (Math.random() * n) | 0;
}

export type Theme = 'auto' | 'light' | 'dark';

@Component({
    selector: 'app-root',
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

    body: HTMLElement = document.body;

    constructor(private timerSvc: TimerService, private scrambleSvc: ScrambleService, private wakelockSvc: WakeLockService) {
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
            if (e.key === 'Escape') return this.cancelDialogs();
            if (e.key !== ' ') return;
            this.setPressed(e.type === 'keydown');
            e.preventDefault();
        };

        this.body.onpointerdown = this.body.onpointerup = (e) => {
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
            this.body.requestFullscreen();
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
        if (newTime !== undefined)
            this.times.push(newTime);

        this.save<Array<number>>('tim', this.times);

        const len = this.times.length;

        this.best = len >= 1 ? Math.min(...this.times) : 0;
        this.avg5 = len >= 5 ? this.averageOf(5) : 0;
        this.avg12 = len >= 12 ? this.averageOf(12) : 0;

        this.last = this.times.slice(-10);
    }

    clearStats() {
        this.solvingTime = 0;
        this.times.length = 0;
        this.updateStats();
    }

    averageOf(times: number) {
        return this.times.slice(-times).reduce((p, c) => p + c, 0) / times;
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
        for (const dialog of this.dialogs) {
            dialog.hide('cancel');
        }
    }
}
