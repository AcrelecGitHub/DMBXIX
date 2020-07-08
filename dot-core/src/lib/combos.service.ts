import { Button, ComboPage } from './models';
import { OrderAreaService } from './order-area.service';
import { ContentService } from './content.service';
import { BasketService } from './basket.service';
import { Log } from './logger/log';
import { Injectable } from '@angular/core';


@Injectable({
    providedIn: 'root'
})

export class CombosService {

    private _combo: Button;
    private _steps: ComboPage[] = [];
    private _selections: Button[] = [];

    constructor(private _orderAreaService: OrderAreaService,
        private _contentService: ContentService,
        private _basketService: BasketService) {
            Log.info('Combo Service instance created!');
    }

    public initialize(): void {
        Log.info('Combo Service initialized!');

        // Be sure that the content service is available in the basket service as
        // it is only register at the 'orderAreaService.initNewPage' function.
        this._basketService.registerProductsCatalog(this._contentService);

        this._orderAreaService.onInitializeCombo().subscribe((button: Button) => this.initializeCombo(button));
    }

    private initializeCombo(button: Button): void {
        this._combo = button;
        this._selections = [];

        // Remove invalid steps
        this._steps = button.ComboPage.Combos.filter(step => {
            if (!step.Buttons.some(_ => _.Visible && _.ButtonStatus !== '2')) {
                return false;
            }

            return true;
        });

        // Check if it is a modification of a previously added combo
        if (button.UUID) {
            const existingBasketItem = this._basketService.items.find(_ => _.UUID === button.UUID);

            for (let i = 0; i < this._steps.length; i++) {
                const selectionBasketItem = existingBasketItem.Combos[i];
                const selection = this.steps[i].Buttons.find(_ => _.Link === selectionBasketItem.ItemID);
                this._selections.push(selection);
            }
        } else {
            // Fill selections array with default values
            for (const step of this._steps) {
                const included = step.Buttons.find(_ => _['IncludedQuantity'] > 0);

                if (!!included) {
                    this._selections.push(included);
                } else if (step.Implicit === 1) {
                    this._selections.push(step.Buttons.first());
                } else {
                    this._selections.push(undefined);
                }
            }
        }

        Log.info('New combo initialized by Combos Service.');
    }

    public get title(): string {
        return this._combo.Caption;
    }

    public get steps(): ComboPage[] {
        return this._steps;
    }

    public get selections(): Button[] {
        return this._selections;
    }

    public get nextStep(): ComboPage {
        const index = this._selections.findIndex(_ => _ === undefined);
        return index >= 0 ? this._steps[index] : null;
    }

    private clear(): void {
        this._combo = undefined;
        this._steps = [];
        this._selections = [];

        Log.info('Combo service cleared!');
    }

    public select(selection: Button, step: ComboPage): void {
        const index = this._steps.indexOf(step);
        if (index >= 0) {
            this._selections[index] = selection;

            Log.info('Combo step {0} selected with button link {1}', index, selection ? selection.Link : '');
        }
    }

    public getStepSelecton(step: ComboPage): Button {
        const index = this._steps.indexOf(step);
        return index >= 0 ? this._selections[index] : undefined;
    }

    public complete(): void {
        this._basketService.addCombo(this._combo, this._selections);

        this.clear();

        this._orderAreaService.closeCombo();
        Log.info('Combo completed!');
    }

    public cancel(): void {
        this.clear();

        this._orderAreaService.cancelCombo();
        Log.info('Combo canceled!');
    }
}
