import { Component, EventEmitter, Input, Output, SimpleChanges } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { FixedlenPipe } from '../../pipes/fixedlen.pipe';
import { Theme } from '../../app.component';

@Component({
    selector: 'app-settings',
    standalone: true,
    imports: [FormsModule, FixedlenPipe],
    templateUrl: './settings.component.html',
    styleUrl: './settings.component.scss'
})
export class SettingsComponent {
    theme: Theme = 'auto';
    scrambleLength: number = 25;
    hideWhileTiming: boolean = false;
    showPreviousTimes: boolean = false;

    load(settings: ISettings) {
        this.theme = settings.theme;
        this.scrambleLength = settings.scrambleLength;
        this.hideWhileTiming = settings.hideWhileTiming;
        this.showPreviousTimes = settings.showPreviousTimes;
    }

    save(): ISettings {
        return {
            theme: this.theme,
            scrambleLength: this.scrambleLength,
            hideWhileTiming: this.hideWhileTiming,
            showPreviousTimes: this.showPreviousTimes
        };
    }

}

export interface ISettings {
    theme: Theme;
    scrambleLength: number;
    hideWhileTiming: boolean;
    showPreviousTimes: boolean;
}