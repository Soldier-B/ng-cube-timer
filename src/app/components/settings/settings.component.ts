import { Component } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { FixedlenPipe } from '../../pipes/fixedlen.pipe';
import { Theme } from '../../app.component';

@Component({
    selector: 'app-settings',
    imports: [FormsModule, FixedlenPipe],
    templateUrl: './settings.component.html',
    styleUrl: './settings.component.scss'
})
export class SettingsComponent {
    theme: Theme = 'auto';
    hideWhileTiming: boolean = false;
    showPreviousTimes: boolean = true;

    load(settings: ISettings) {
        this.theme = settings.theme;
        this.hideWhileTiming = settings.hideWhileTiming;
        this.showPreviousTimes = settings.showPreviousTimes;
    }

    save(): ISettings {
        return {
            theme: this.theme,
            hideWhileTiming: this.hideWhileTiming,
            showPreviousTimes: this.showPreviousTimes
        };
    }

}

export interface ISettings {
    theme: Theme;
    hideWhileTiming: boolean;
    showPreviousTimes: boolean;
}