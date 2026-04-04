import { NgTemplateOutlet } from '@angular/common';
import { ChangeDetectorRef, Component, ContentChild, EventEmitter, HostBinding, HostListener, Output, TemplateRef } from '@angular/core';

@Component({
    selector: 'app-dialog',
    imports: [NgTemplateOutlet],
    templateUrl: './dialog.component.html',
    styleUrl: './dialog.component.scss'
})
export class DialogComponent {
    @ContentChild('dialogContent') content!: TemplateRef<any>;
    @ContentChild('dialogButtons') buttons!: TemplateRef<any>;
    @HostBinding('class.shown') protected shown: boolean = false;
    @Output() onAction = new EventEmitter<string>();
    @Output() onShow = new EventEmitter<void>();

    constructor(private cdr: ChangeDetectorRef) {}

    @HostListener('pointerdown', ['$event'])
    @HostListener('pointerup', ['$event'])
    onPointer(e: PointerEvent) {
        e.stopImmediatePropagation();
    }

    @HostListener('click', ['$event'])
    onClick(e: MouseEvent) {
        const target = e.target as HTMLElement;
        if (target.tagName === 'BUTTON') {
            this.hide(target.getAttribute('data-action') ?? '');
        }
    }

    show() {
        this.onShow.emit();
        this.shown = true;
        this.cdr.markForCheck();
    }

    hide(action?: string) {
        if (!this.shown) return;
        this.shown = false;
        this.cdr.markForCheck();
        if (action !== undefined) this.onAction.emit(action);
    }

}
