import { Injectable } from '@angular/core';
import { Subject, Observable } from 'rxjs';
import { Log } from './logger/log';
import { LocalizationService } from './localization.service';
import { ModifiersService } from './modifiers.service';

@Injectable({
    providedIn: 'root'
})
export class ComboBuilderModifierService {


    public pageIndex = 0;
    public items = [];
    public suggestiveModifiersSelected = false;
    public submitInfo = true;
    public itemToBeOpened = {};
    public itemsToBeSent = {};
    // public modifierNames = [];
    public currentStep = 0;

    private _suggestiveItem = null;
    private _mealItem = null;
    private _arrayStep: Number = 0;
    private _entireSuggestiveTree = null;
    private _totalSteps = 0;

    private _price = 0;
    private itemsModified = [];
    private storedItem = {};
    private _showOptionals = true;
    private itemUpdater = new Subject<any>();
    private suggestiveUpdater = new Subject<any>();
    private ageChecking = new Subject<any>();

    constructor(private localizationService: LocalizationService) { }

    public onItemUpdate() {
        return this.itemUpdater.asObservable();
    }

    public onAgeCheck() {
        return this.ageChecking.asObservable();
    }

    public get allSteps() {
        return this._totalSteps;
    }

    public set allSteps(value: number) {
        this._totalSteps = value;
    }

    public showAgeVerification(item) {
        this.ageChecking.next(item);
    }

    public onSuggestiveUpdate() {
        return this.suggestiveUpdater.asObservable();
    }

    public set suggestiveItem(value: Object) {
        this._suggestiveItem = value;
    }

    public get suggestiveItem(): Object {
        return this._suggestiveItem;
    }

    public set suggestiveItems(value: Object) {
        this._entireSuggestiveTree = value;
    }

    public set mealItem(value: Object) {
        this._mealItem = value;
    }

    public get mealItem(): Object {
        return this._mealItem;
    }

    public set arrayStep(value: Number) {
        this._arrayStep = value;
    }

    public get arrayStep(): Number {
        return this._arrayStep;
    }


    public registerAndParseItems(items: any): Object {
        this.storedItem = items;
        const tempItems = { mandatory: [], optional: [] };
        if (items.hasOwnProperty('Pages')) {
            for (let i = 0; i < items.Pages.length; i++) {
                if (this.isOptional(items.Pages[i])) {
                    tempItems.optional.push(items.Pages[i]);
                } else {
                    tempItems.mandatory.push(items.Pages[i]);
                }
                // this.modifierNames.push([]);
                this.itemsModified.push(0);
            }
        }
        return tempItems;
    }


    public get price(): string {
        return this.localizationService.formatCurrency(this._price);
    }

    public get shownOptionals(): boolean {
        return this._showOptionals;
    }

    public set shownOptionals(value: boolean) {
        this._showOptionals = value;
    }

    public searchForSpecificWizardtype(items, type) {
        const prop = 'ModifierTemplate';
        const desiredValue = type;
        let value = true;
        // tslint:disable-next-line: forin
        for (const item in items) {
            if (item === prop) {
                if (items[prop] === desiredValue) {
                    value = false;
                }
            }
            if (items[item] instanceof Object) {
                value = this.searchForSpecificWizardtype(items[item], desiredValue);
            }
            if (value === false) {
                Log.debug('value reached');
                break;
            }

        }
        return value;
    }

    public isOptional(page: any) {
        if (page && page.PageInfo && page.PageInfo.ForceMandatory) {
            return false;
        }
        if (page && page.PageInfo && page.PageInfo.MinQuantity === 0) {
            return true;
        }
        if (page.Buttons !== undefined && page.Buttons.length === 1) {
            return false;
        }
        if (page.Buttons !== undefined) {
            for (let i = 0; i < page.Buttons.length; i++) {
                if (page.Buttons[i].AutoComplete > 0) {
                    return true;
                }
            }
        } else {
            for (let j = 0; j < page.length; j++) {
                for (let t = 0; t < page[j].Buttons.length; t++) {
                    if (page[j].Buttons[t].AutoComplete > 0) {
                        return true;
                    }
                }
            }
        }
        return false;
    }

    public addNewItem(items) {
        const modifiersItem = {
            action: 'displayNewItem',
            item: items
        };
        this.updatingItem(modifiersItem);
    }


    public addModifiersToItem(items) {
        const modifiersItem = {
            action: 'updatingItemModifiers',
            item: items
        };
        this.updatingItem(modifiersItem);
    }

    public addModifiersToSuggestiveItem(items) {
        this.suggestiveUpdater.next(items);
    }

    public updateItemsIndex(position) {
        this.itemsModified[position] = 1;
        let incr = 0;
        for (let i = 0; i < this.itemsModified.length; i++) {
            if (this.itemsModified[i] === 1) {
                incr++;
            }
        }
        this.pageIndex = incr;
    }

    public updatePrice(): void {

        this._price = this.sumUpItems();
    }

    private sumUpItems(): number {
        let tempTotal = Number(this.storedItem['Price']);
        for (let i = 0; i < this.storedItem['Pages'].length; i++) {
            const expresion = this.storedItem['Pages'][i];
            if (expresion.length > 1) {
                for (let j = 0; j < expresion.length; j++) {
                    tempTotal += this.calculateItemTotal(expresion[j]);
                }
            } else {
                tempTotal += this.calculateItemTotal(expresion);
            }
        }

        if (this._entireSuggestiveTree !== null && this._entireSuggestiveTree !== undefined) {
            if (this._entireSuggestiveTree['Buttons'] !== null && this._entireSuggestiveTree['Buttons'] !== undefined) {
                for (let b = 0; b < this._entireSuggestiveTree['Buttons'].length; b++) {
                    tempTotal += this.calculateItemTotal(this._entireSuggestiveTree['Buttons'][b]);
                }
            } else {
                // tslint:disable-next-line: max-line-length
                if (this._entireSuggestiveTree['Price'] !== null && this._entireSuggestiveTree['Price'] !== undefined && this._entireSuggestiveTree['Price'] !== '') {
                    tempTotal += this.calculateItemTotal(this._entireSuggestiveTree);
                }
            }

        }
        return tempTotal;
    }

    private calculateItemTotal(item): number {
        if (Number(item.Price) <= 0 || item.Price === undefined) {
            item.Price = 0;
        }

        if (Number(item.Quantity) <= 0 || item.Quantity === undefined) {
            item.Quantity = 0;
        }

        let priceTouse = Number(item.Price);
        if (priceTouse <= 0) {
            priceTouse = 0;
        }

        // let total = item.Qty * priceTouse;
        let total = item.Quantity * priceTouse;
        if (item['ModifiersPage'] !== null && item['ModifiersPage'] !== undefined) {
            if (item['ModifiersPage']['Modifiers'] !== null && item['ModifiersPage']['Modifiers'] !== undefined) {
                const expresion = item['ModifiersPage']['Modifiers'];
                for (let b = 0; b < expresion.length; b++) {
                    // tslint:disable-next-line: max-line-length
                    if (expresion[b] !== null && expresion[b] !== undefined && expresion[b]['Buttons'] !== null && expresion[b]['Buttons'] !== undefined) {
                        for (let i = 0; i < expresion[b]['Buttons'].length; i++) {
                            total += this.calculateItemTotal(expresion[b]['Buttons'][i]);
                        }
                    }
                }
            }
        } else {
            if (item['Buttons'] !== null && item['Buttons'] !== undefined) {
                for (let j = 0; j < item['Buttons'].length; j++) {
                    total += this.calculateItemTotal(item['Buttons'][j]);
                }
            }
        }

        return total;
    }

    public purgeData() {
        this.suggestiveItem = null;
        this._showOptionals = true;
        this.arrayStep = 0;
        this.currentStep = 0;
        this.pageIndex = 0;
        this.items = [];
        this.itemsModified = [];
        this.itemsToBeSent = {};
        this.itemToBeOpened = {};
    }

    public increaseQuantity(item): Object {
        item['Quantity'] = 1;
        return item;
    }

    public decreaseQuantity(item): Object {
        item['Quantity'] = 0;
        return item;
    }

    public addSuggestivePrice(price) {
        this._price = Number(this._price) + Number(price);
    }

    public decreaseSuggestivePrice(price) {
        this._price = Number(this._price) - Number(price);

    }

    public checkForSingleItemQuantity(arr): Object {
        let item = null;
        const selector = 'Quantity';
        for (let i = 0; i < arr.length; i++) {
            if (arr[i][selector] === 1) {
                item = arr[i];
                break;
            }
        }
        return item;
    }

    public numberOfItemsSelected(arr): number {
        return arr.filter(x => x['Quantity'] >= 1).length;
    }


    public resetQuantities(item: any): any {
        if (!item) {
            return;
        }

        Object.keys(item).forEach(key => {
            if (key === 'Quantity') {
                item[key] = 0;
            }
            if (item[key] instanceof Object) {
                this.resetQuantities(item[key]);
            }
        });
        return item;
    }

    public changeQuantitiesToBackup(itemToBeChanged, backupItem) {
        for (let i = 0; i < itemToBeChanged['Buttons'].length; i++) {
            itemToBeChanged['Buttons'][i]['Quantity'] = backupItem['Buttons'][i]['Quantity'];
        }
    }



    private buildModifiersArray(arr): Array<any> {
        const tempArr = [];
        for (let i = 0; i < arr.length; i++) {
            const item = arr[i];
            Log.debug(JSON.stringify(arr[i]) + 'fiecare item.....');
            if (item['ModifiersPage'] !== null && item['ModifiersPage'] !== undefined) {
                if (item['ModifiersPage']['Modifiers'] !== null && item['ModifiersPage']['Modifiers'] !== undefined) {
                    const expresion = item['ModifiersPage']['Modifiers'][0]['Buttons'];
                    for (let j = 0; j < expresion.length; j++) {
                        if (expresion[j]['Price'] !== '' && Number(expresion[j]['Price']) > 0 && expresion[j]['Quantity'] > 0) {
                            let itemQty = expresion[j]['Quantity'];
                            while (itemQty > 0) {
                                tempArr.push(expresion[j]);
                                itemQty--;
                            }
                        }
                    }
                }
            }
            /*for (let b = 0; b < tempArr.length; b++) {
                if (tempArr[b + 1] !== null && tempArr[b + 1] !== undefined && (tempArr[b].Link === tempArr[b + 1].Link)) {
                    Log.debug('duplicat');
                }
            }*/
            return tempArr;
        }
    }

    private increasePrice(item): void {
        if (item['Price'] !== null && item['Price'] !== undefined && item['Price'] !== '') {
            let itemPrice = 0;
            const modifierPrice = this.addModifiersPrice(item);
            if (item['Price'] > 0) {
                itemPrice = item['Price'];
            }
            this._price = Number(this._price) + Number(itemPrice) + Number(modifierPrice);
        } else {
            if (item['Buttons'] !== null && item['Buttons'] !== undefined && item['Buttons'].length > 1) {
                const modifiersPrice = this.addModifiersPrice(item);
                this._price = Number(this._price) + Number(modifiersPrice);
            }
        }
    }

    private decreasePrice(item) {
        if (item['Price'] !== null && item['Price'] !== undefined && item['Price'] !== '') {
            let itemPrice = 0;
            const modifierPrice = this.addModifiersPrice(item);
            if (item['Price'] > 0) {
                itemPrice = item['Price'];
            }
            this._price = Number(this._price) - Number(itemPrice) - Number(modifierPrice);
        } else {
            if (item['Buttons'] !== null && item['Buttons'] !== undefined && item['Buttons'].length > 1) {
                const modifiersPrice = this.addModifiersPrice(item);
                this._price = Number(this._price) - Number(modifiersPrice);
            }
        }
    }


    private addModifiersPrice(item): number {
        let returnNr = 0;
        if (item['ModifiersPage'] !== null && item['ModifiersPage'] !== undefined) {
            if (item['ModifiersPage']['Modifiers'] !== null && item['ModifiersPage']['Modifiers'] !== undefined) {
                const expresion = item['ModifiersPage']['Modifiers']; // [0]['Buttons'];
                // tslint:disable-next-line: max-line-length
                if (expresion[0] !== null && expresion[0] !== undefined && expresion[0]['Buttons'] !== null && expresion[0]['Buttons'] !== undefined) {
                    for (let i = 0; i < expresion[0]['Buttons'].length; i++) {
                        if (expresion[0]['Buttons'][i]['Price'] !== '' && expresion[0]['Buttons'][i]['Quantity'] > 0) {
                            returnNr = Number(returnNr) + Number(expresion[0]['Buttons'][i]['Price']);
                        }
                    }
                }
            }
        }
        return returnNr;
    }

    private updatingItem(item) {
        this.itemUpdater.next(item);
    }
}
