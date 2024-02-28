import { NgTemplateOutlet } from '@angular/common';
import { Component, ContentChild, ElementRef, EventEmitter, HostBinding, Output, TemplateRef } from '@angular/core';

@Component({
    selector: 'app-dialog',
    standalone: true,
    imports: [NgTemplateOutlet],
    templateUrl: './dialog.component.html',
    styleUrl: './dialog.component.scss'
})
export class DialogComponent {
    @ContentChild('dialogContent') content!: TemplateRef<any>;
    @ContentChild('dialogButtons') buttons!: TemplateRef<any>;
    @HostBinding('class.shown') private shown: boolean = false;
    @Output() onAction = new EventEmitter<string>();
    @Output() onShow = new EventEmitter<void>();

    constructor(private host: ElementRef) {
        const root = host.nativeElement as HTMLElement;
        root.onpointerdown = root.onpointerup = (e) => e.stopImmediatePropagation();
        root.onclick = (e: MouseEvent) => {
            const target = e.target as HTMLElement;
            if (target.tagName === 'BUTTON') {
                this.hide(target.getAttribute('data-action') ?? '');
            }
        };
    }

    show() {
        this.onShow.emit();
        this.shown = true;
    }

    hide(action?: string) {
        if (!this.shown) return;
        this.shown = false;
        if (action !== undefined) this.onAction.emit(action);
    }

}
