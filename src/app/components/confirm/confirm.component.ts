import { Component, ElementRef } from '@angular/core';
import { NumberValueAccessor } from '@angular/forms';

@Component({
    selector: 'app-confirm',
    standalone: true,
    imports: [],
    templateUrl: './confirm.component.html',
    styleUrl: './confirm.component.scss'
})
export class ConfirmComponent {
    shown: boolean = false;
    private resolve!: () => void;
    private reject!: () => void;

    constructor(private host: ElementRef) {
        const root = host.nativeElement as HTMLElement;
        root.onpointerdown = root.onpointerup = (e) => e.stopImmediatePropagation();
    }

    show(): Promise<void> {
        console.log('show');
        this.shown = true;
        return new Promise<void>((resolve, reject) => {
            this.resolve = resolve;
            this.reject = reject;
        });
    }

    complete(event: MouseEvent, confirm: boolean) {
        this.shown = false;
        confirm ? this.resolve() : this.reject();
    }

}
