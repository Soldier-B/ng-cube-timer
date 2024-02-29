import { Injectable } from '@angular/core';

@Injectable({
    providedIn: 'root'
})
export class WakeLockService {
    private hasSupport: boolean;
    private wakelock?: WakeLockSentinel

    constructor() {
        this.hasSupport = ('wakeLock' in navigator);

        if (this.hasSupport) {
            document.addEventListener('visibilitychange', async () => {
                if (this.wakelock !== undefined && document.visibilityState === 'visible')
                    this.requestWakeLock();
            });
        }
    }

    async requestWakeLock() {
        if (!this.hasSupport) return;

        try {
            this.wakelock = await navigator.wakeLock.request('screen');
        }
        catch { }
    }

    async releaseWakeLock() {
        if (!this.hasSupport || this.wakelock === undefined) return;
        await this.wakelock.release();
        this.wakelock = undefined;
    }
}
