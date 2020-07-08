import { Injectable } from '@angular/core';
import { Subject } from 'rxjs';

import { Log } from './logger/log';
import { ConfigurationService } from './configuration.service';
import { InternationalizationService } from './internationalization.service';
import { LocalizationService } from './localization.service';
import { BasketService } from './basket.service';
import { Button } from './models';
import { ComboBuilderModifierService } from './combo-builder-modifier.service';
import { SuggestiveSalesService } from './suggestive-sales.service';

@Injectable({
    providedIn: 'root'
})
export class ModifiersService {

    private static MSG_INDEX_FOR_MULTIPLE_ITEMS = 2014012201;
    public static MSG_TO_REMOVE = '{$INDEX#2014012201}';

    public strData = '{"Combos":[]}';
    public data = { Combos: [] };

    private modifierScreenSubject: Subject<any> = new Subject();
    private modifierScreenClose: Subject<any> = new Subject();

    public isSubmited = false;
    public pageIndex: number;
    public objectModifiers: Array<any>;
    public allSelectedItems = [];

    private allSuggestiveItems = [];
    private modifiersSubject: Subject<any> = new Subject();
    private showLastStepDeallyed: boolean;
    private useDlgMessage: any;
    private decodeItem = false;
    private i = 0;
    private _modifierData: any;
    private _modifierButtons: Array<any>;
    private _item: Object;
    private _suggestiveItem = null;
    private _mealItem = null;
    private _itemInfo: Object;
    private _topButtons: Array<any>;
    private _groups: any;
    private _autoCompleteData: any = null;
    private _selItems: Array<any> = [];
    protected itemCopy = {};
    public crtMenuStructure = {};


    private _currentPersonalizationItem: Button;

    public _tempButton: any;
    public isSubmitted: boolean;

    constructor(private configService: ConfigurationService,
        private localisationService: LocalizationService,
        private basketService: BasketService,
        private suggestiveSaleService: SuggestiveSalesService,
        protected comboBuilderModifierService: ComboBuilderModifierService,
        private internationalizationService: InternationalizationService) { }

    public init(modifierData, modifierButtons, modifierItemInfo) {
        Log.debug('Modifiers init ' + modifierData + '  ' + modifierButtons + '   ' + modifierItemInfo);

        this.initModifierStepData(modifierData, modifierButtons, modifierItemInfo);
        this.resetQuantitiesToDefault();
        this.clearFreeQunatities();
        this.groupAndFilterButtons();

        if (this.topButtons) {
            for (let i = 0; i < this.topButtons.length; i++) {
                if (this.topButtons[i].Implicit === '1') {
                    if (this.modifierData.MinQuantity <= 0) {
                        this.topButtons[i].Quantity = 1;
                    } else {
                        this.topButtons[i].Quantity = this.modifierData.MinQuantity;
                    }

                    this.submitInfo();
                    return;
                }
            }
        }

        let firstProductPrice: string;
        if (this.topButtons && this.topButtons[0]) {
            firstProductPrice = this.localisationService.formatNumber(this.topButtons[0].Price, 2);
        }

        let title: string;
        if (this.modifierData && this.modifierData.Title) {
            title = this.modifierData.Title;
        }

        this.evalAutoSubmit();

        if (this.topButtons && this.topButtons.length === 0) {
            const buttonInfo: any = this.autoCompleteData;
            // if the autocomplete button has sub modifiers first show the submmodifiers then autosubmit
            if (this.autoCompleteData != null && buttonInfo && buttonInfo.ModifiersPage &&
                buttonInfo.ModifiersPage.Modifiers && buttonInfo.ModifiersPage.Modifiers.length > 0) {
                buttonInfo.Width = 100;
                buttonInfo.Height = 100;

                const autoCompletePageButton: any = buttonInfo;
                this.onModifierButtonClicked(autoCompletePageButton);
            } else {
                // this.onBtnOkHitted();
            }
        }

    }

    aplyImplicitQuantities(item) {
        /* if (item.hasOwnProperty('ModifiersPage')) {
            for (let i = 0; i < item['ModifiersPage']['Modifiers'].length; i++) {
                const modifier = item['ModifiersPage']['Modifiers'][i];
                for (let j = 0; j < modifier.Buttons.length; j++) {
                    const button = modifier.Buttons[j];
                    if (button.IncludedQuantity) {
                        button.Quantity = button.IncludedQuantity;
                        if (button.ModifiersPage) {
                            this.aplyImplicitQuantities(button);
                        }
                    }
                }
            }
        }
        */
        const desiredNode = 'IncludedQuantity';
        // tslint:disable-next-line: forin
        for (const obj in item) {
            if (obj === desiredNode) {
                if (item[desiredNode] > 0 && (item['Quantity'] === null || item['Quantity'] === undefined || item['Quantity'] == 0)) {
                    item['Quantity'] = item[desiredNode];
                }
            }

            if (item[obj] instanceof Object) {
                item[obj] = this.aplyImplicitQuantities(item[obj]);
            }
        }
        return item;
    }

    get currentPersonalizationItem() {
        return this._currentPersonalizationItem;
    }

    set currentPersonalizationItem(item: Button) {
        this._currentPersonalizationItem = item;
    }

    public set currentSuggestiveItem(value: Object) {
        this._suggestiveItem = value;
    }

    public get currentSuggestiveItem(): Object {
        return this._suggestiveItem;
    }

    public set currentMealOptionsItem(value: Object) {
        this._mealItem = value;
    }

    public get currentMealOptionsItem(): Object {
        return this._mealItem;
    }

    public reevaluateSiblings() {
        this.insertChildrenBackToParent(this.crtMenuStructure);
        this.determineWizardType(this.currentPersonalizationItem);

        // this.evalSpecialComboBuilderRulesItems(this.currentPersonalizationItem);
    }

    public evalSpecialComboBuilderRulesItems(item) {
        // if it is combo builder modifier check for suggestions, hide siblings and extract siblings
        if (item['ModifiersPage']['Modifiers'].length > 0) {
            const comboObj = item['ModifiersPage']['Modifiers'].find(obj => obj['PageInfo']['ModifierTemplate'] === 'combobuilder');
            if (comboObj) {


                const suggestivePageMeal = this.suggestiveSaleService.getMakeItAMealSuggestionForItem(item.Link);
                if (suggestivePageMeal !== null && suggestivePageMeal !== undefined) {
                    this._mealItem = JSON.parse(JSON.stringify(suggestivePageMeal));
                }

                const suggestivePagRegular = this.suggestiveSaleService.getRegularSuggestionForItem(item.Link);
                if (suggestivePagRegular !== null && suggestivePagRegular !== undefined) {
                    this._suggestiveItem = JSON.parse(JSON.stringify(suggestivePagRegular));
                }

                // tslint:disable-next-line: max-line-length
                this.comboBuilderModifierService.shownOptionals = this.comboBuilderModifierService.searchForSpecificWizardtype(item, 'ComboBuilderHidden');
                item = this.hideSiblings(item);
                item = this.extractSiblings(item);
            }
        }

        return item;
    }

    public determineWizardType(item, pageIndex: number = 0) {
        Log.debug(JSON.stringify(item));
        let wizardType = '';
        this.pageIndex = pageIndex;
        let itemToBeSent = {};

        item = this.evalSpecialComboBuilderRulesItems(item);

        this.itemCopy = JSON.parse(JSON.stringify(item));
        this.itemCopy = this.comboBuilderModifierService.resetQuantities(this.itemCopy);
        if (item.hasOwnProperty('ModifiersPage')) {
            if (item['ModifiersPage'].hasOwnProperty('Modifiers')) {


                // first determine if it is a menu or a sequence of modifiers
                const pages = [];
                if (item['ModifiersPage']['Modifiers'].length > 1) {
                    // wizardType = 'menu';
                    item = this.remakeMenuJSON(item);

                    const comboObj = item['ModifiersPage']['Modifiers'].find(obj => obj['PageInfo']['ModifierTemplate'] === 'combobuilder');
                    if (comboObj) {
                        wizardType = 'menu';
                        item['ModifiersPage']['Modifiers'].forEach(element => {
                            // tslint:disable-next-line: max-line-length
                            if (element['PageInfo']['ModifierTemplate'] != 'ComboBuilderHidden' && element['PageInfo']['ModifierTemplate'] != 'HiddenChild') {
                                element['PageInfo']['ModifierTemplate'] = 'combobuilder';
                            }
                        });
                    }


                    for (let i = 0; i < item['ModifiersPage']['Modifiers'].length; i++) {
                        pages.push(item['ModifiersPage']['Modifiers'][i]);
                        // tslint:disable-next-line: max-line-length
                        if (item['ModifiersPage']['Modifiers'][i]['PageInfo']['ModifierTemplate'] != 'combobuilder' && item['ModifiersPage']['Modifiers'][i]['PageInfo']['ModifierTemplate'] != 'ComboBuilderHidden' && item['ModifiersPage']['Modifiers'][i]['PageInfo']['ModifierTemplate'] != 'HiddenChild') {
                            itemToBeSent = item['ModifiersPage']['Modifiers'][0];
                            this.itemInfo = itemToBeSent['ItemInfo'] = item['ModifiersPage']['ItemInfo'];
                            wizardType = item['ModifiersPage']['Modifiers'][0]['PageInfo']['ModifierTemplate'];
                            break;
                        }
                    }
                    // tslint:disable-next-line: max-line-length
                } else if (item['ModifiersPage']['Modifiers'][0] && item['ModifiersPage']['Modifiers'][0]['PageInfo']['ModifierTemplate'] === 'combobuilder') {
                    item = this.remakeMenuJSON(item);
                    wizardType = 'menu';
                    pages.push(item['ModifiersPage']['Modifiers'][0]);

                }

                if (wizardType == 'menu') {
                    itemToBeSent['Pages'] = pages;
                    itemToBeSent['ItemInfo'] = item['ModifiersPage']['ItemInfo'];
                    this.itemInfo = itemToBeSent['ItemInfo'] = item['ModifiersPage']['ItemInfo'];
                    itemToBeSent['MaxQuantity'] = item.MaxQuantity;
                    itemToBeSent['Caption'] = item.Caption;
                    itemToBeSent['Description'] = item.Description;
                    itemToBeSent['Link'] = item.Link;
                    itemToBeSent['Price'] = item.Price;
                    itemToBeSent['score'] = item.score;

                } else {
                    itemToBeSent = {};
                    if (item['ModifiersPage']['Modifiers'].length > 0) {
                        if (item['ModifiersPage']['Modifiers'][this.pageIndex].hasOwnProperty('PageInfo')) {
                            if (item['ModifiersPage']['Modifiers'][this.pageIndex]['PageInfo'].hasOwnProperty('ModifierTemplate')) {
                                wizardType = item['ModifiersPage']['Modifiers'][this.pageIndex]['PageInfo']['ModifierTemplate'];
                                const btnArr = [];
                                for (let b = 0; b < item['ModifiersPage']['Modifiers'][this.pageIndex]['Buttons'].length; b++) {
                                    btnArr.push(item['ModifiersPage']['Modifiers'][this.pageIndex]['Buttons'][b]);
                                }

                                if (wizardType === 'ComboBuilderSiblings' || wizardType === 'ComboBuilderHidden') {
                                    wizardType = 'classic';
                                }

                                if (wizardType === 'combobuilder') {
                                    wizardType = 'dualModifiers';
                                }
                                if (wizardType === null || wizardType === undefined || wizardType === '') {
                                    wizardType = 'classic';
                                }
                                itemToBeSent['Buttons'] = btnArr;
                                itemToBeSent['PageInfo'] = item['ModifiersPage']['Modifiers'][this.pageIndex]['PageInfo'];
                                if (item['ModifiersPage'].hasOwnProperty('ItemInfo')) {
                                    this.itemInfo = itemToBeSent['ItemInfo'] = item['ModifiersPage']['ItemInfo'];
                                }
                                if (item.hasOwnProperty('MaxQuantity')) {
                                    itemToBeSent['MaxQuantity'] = item.MaxQuantity;
                                }
                                if (item.hasOwnProperty('Caption')) {
                                    itemToBeSent['Caption'] = item.Caption;
                                }
                                if (item.hasOwnProperty('Description')) {
                                    itemToBeSent['Description'] = item.Description;
                                }
                                if (item.hasOwnProperty('Link')) {
                                    itemToBeSent['Link'] = item.Link;
                                }
                            } else if ((item['ModifiersPage']['Modifiers'][this.pageIndex]['PageInfo'].hasOwnProperty('classic'))) {
                                wizardType = 'classic';
                                itemToBeSent = item;
                            }
                        } else {
                            wizardType = 'classic';
                            itemToBeSent = item;
                        }
                    } else {
                        wizardType = 'classic';
                        itemToBeSent = item;
                    }
                }
            }
        }
        const modifiersScreen = {
            type: wizardType,
            item: itemToBeSent
        };
        this.modifierScreen(modifiersScreen);
    }

    private checkStructure(item): Boolean {
        for (let i = 0; i < item['ModifiersPage']['Modifiers'].length; i++) {
            const tempItem = item['ModifiersPage']['Modifiers'][i];
            if (tempItem['PageInfo'] === null || tempItem['PageInfo'] === undefined) {
                return true;
            }
        }
        return false;
    }

    public onModifiers() {
        return this.modifiersSubject.asObservable();
    }

    public autoSubmitData() {
        if (this.modifierData.AutoSubmit === true) {
            if (this.modifierData.MaxQuantity === this.selItems.length) {
                if (this.showLastStepDeallyed === true && this.modifierData.MaxQuantity > 1) {
                    setTimeout(this.submitInfo.bind(this), 1500);
                } else {
                    this.submitInfo();
                }
            }
        } else {
            if (this.modifierData.MaxQuantity === this.selItems.length) {
                this.submitInfo();
            }
        }
    }

    public reset() {
        this.resetQuantitiesToDefault();
        this.selItems = [];
        // this.listAllSelectedOptions();
    }

    public submitInfo() {
        this.isSubmitted = true;
        this.updateItemQuantities();
        this.calculatePaidQuantities();
        if (this.modifierButtons != null && this.modifierButtons != undefined) {
            this.basketService.addProduct(<any>this.itemInfo, this.item['Modifiers'][this.pageIndex]['Buttons']);
        }

    }

    private hideSiblings(item): any {
        for (let j = 0; j < item['ModifiersPage']['Modifiers'].length; j++) {
            const parent = item['ModifiersPage']['Modifiers'][j];
            if (parent !== null && parent !== undefined) {
                if (parent['Buttons'] !== null && parent['Buttons'] !== undefined) {
                    for (let i = 0; i < parent['Buttons'].length; i++) {
                        // tslint:disable-next-line: max-line-length
                        if (parent['Buttons'][i]['ModifiersPage'] && parent['Buttons'][i]['ModifiersPage']['Modifiers'] !== null && parent['Buttons'][i]['ModifiersPage']['Modifiers'] !== undefined) {
                            // tslint:disable-next-line: max-line-length
                            if (parent['Buttons'][i]['ModifiersPage']['Modifiers'][i] !== null && parent['Buttons'][i]['ModifiersPage']['Modifiers'][0] !== undefined) {
                                const expresion = parent['Buttons'][i]['ModifiersPage']['Modifiers'][0];
                                if (expresion['PageInfo']['ModifierTemplate'] === 'HiddenChild') {
                                    parent['Buttons'][i]['ModifiersPage']['ItemInfo']['HideChildren'] = true;
                                }
                            }
                        }
                    }
                }
            } else {

            }
        }
        return item;
    }

    private extractSiblings(item): any {
        for (let j = 0; j < item['ModifiersPage']['Modifiers'].length; j++) {
            const parent = item['ModifiersPage']['Modifiers'][j];
            if (parent !== null && parent !== undefined && parent['PageInfo'] && parent['PageInfo']['ModifierTemplate'] == 'combobuilder') {
                if (parent['Buttons'] !== null && parent['Buttons'] !== undefined) {
                    for (let i = 0; i < parent['Buttons'].length; i++) {

                        const button = parent['Buttons'][i];
                        let qty = 0;
                        if ( button['Quantity'] ) {
                            qty = button['Quantity'];
                        // } else if ( button['IncludedQuantity']) {
                        //    qty = button['IncludedQuantity'];
                        } else if ( button['AutoComplete']) {
                            qty = button['AutoComplete'];
                        }

                        // only extrac if product qty is larger than 0 and
                        // tslint:disable-next-line: max-line-length
                        if (qty > 0 && button['ModifiersPage'] && button['ModifiersPage']['Modifiers'] !== null && button['ModifiersPage']['Modifiers'] !== undefined) {
                            // tslint:disable-next-line: max-line-length
                            if (button['ModifiersPage']['Modifiers'][0] !== null && button['ModifiersPage']['Modifiers'][0] !== undefined) {
                                const expresion = button['ModifiersPage']['Modifiers'][0];
                                if (expresion['PageInfo']['ModifierTemplate'] === 'ComboBuilderSiblings') {
                                    expresion['PageInfo']['ForceMandatory'] = 1;
                                    expresion['PageInfo']['ParentLink'] = parent['PageInfo']['Link'];
                                    item['HasSiblings'] = true;
                                    item['ModifiersPage']['Modifiers'].push(expresion);
                                    button['ModifiersPage']['ItemInfo']['HideChildren'] = true;
                                    break;
                                } // parent['Buttons'][0]['ModifiersPage']['Modifiers'] = '';
                            }
                        }
                    }
                }
            } else {

            }
        }
        return item;
    }

    protected remakeMenuJSON(item): Object {
        let remadeItem = {};
        const itemsArray = [];
        remadeItem = item;
        for (let i = 0; i < item['ModifiersPage']['Modifiers'].length; i++) {
            let tempItem = item['ModifiersPage']['Modifiers'][i];
            if (tempItem['PageInfo'] !== null && tempItem['PageInfo'] !== undefined) {
                if (tempItem['PageInfo']['MaxQuantity'] > 1) {
                    this.decodeItem = true;
                    const breakedItem = this.breakApartItems(tempItem);
                    breakedItem['PageInfo'] = tempItem['PageInfo'];
                    itemsArray.push(breakedItem);
                } else {
                    itemsArray.push(item['ModifiersPage']['Modifiers'][i]);
                }
            } else {
                tempItem = JSON.parse(JSON.stringify(tempItem));
                tempItem['PageInfo'] = JSON.parse(JSON.stringify(tempItem[0]['PageInfo']));
                tempItem['PageInfo']['MaxQuantity'] = tempItem.length;
                itemsArray.push(tempItem);
                /*if (tempItem['PageInfo']['MaxQuantity'] > 1) {
                    this.decodeItem = true;
                    const breakedItem = this.breakApartItems(tempItem);
                    breakedItem['PageInfo'] = tempItem['PageInfo'];
                    itemsArray.push(breakedItem);
                } else {
                    itemsArray.push(item['ModifiersPage']['Modifiers'][i]);
                }*/
            }
        }
        remadeItem['ModifiersPage']['Modifiers'] = itemsArray;

        return remadeItem;
    }

    private breakApartItems(item): Array<any> {
        const arr = [];
        // let currrentStep = 0;
        for (let i = 0; i < Number(item['PageInfo']['MaxQuantity']); i++) {
            let copiedItem = JSON.parse(JSON.stringify(item));
            copiedItem['PageInfo']['MaxQuantity'] = 1;
            copiedItem['PageInfo']['MinQuantity'] = 1;
            copiedItem = this.setCurrentItemQtys(copiedItem);
            for (let j = 0; j < item.Buttons.length; j++) {
                if (item.Buttons[j].Quantity > 1) {
                    Log.debug(item.Buttons[j].Caption + 'caption current item, qty > 1');
                    item.Buttons[j].Quantity = Number(item.Buttons[j].Quantity) - 1;
                    break;
                } else if (item.Buttons[j].Quantity === 1) {
                    Log.debug(item.Buttons[j].Caption + 'caption current item, qty === 1');
                    item.Buttons[j].Quantity = 0;
                    break;
                }
            }
            /*if (item.Buttons[i].Quantity > 1) {
                Log.debug(item.Buttons[i].Caption + 'caption current item, qty > 1');
                item.Buttons[i].Quantity = Number(item.Buttons[i].Quantity) - 1;
            } else if (item.Buttons[i].Quantity === 1) {
                Log.debug(item.Buttons[i].Caption + 'caption current item, qty === 1');
                item.Buttons[i].Quantity = 0;
            }*/
            /*for (let j = 0; j < copiedItem.Buttons.length; j++) {
                if (copiedItem.Buttons[j].Quantity === 1) {
                    item.Buttons[j].Quantity = 0;
                    arr.push(copiedItem);
                    break;
                } else if (copiedItem.Buttons[j].Quantity > 1) {
                    for ( let b = 0; b < copiedItem.Buttons[j].Quantity; b++) {
                        arr.push(copiedItem);
                    }
                    item.Buttons[j].Quantity = 0;
                    break;
                }


            }*/
            arr.push(copiedItem);
        }
        return arr;
    }

    private setCurrentItemQtys(item): Object {
        let firstStep = false;
        for (let i = 0; i < item.Buttons.length; i++) {
            if (item.Buttons[i].Quantity > 1) {
                if (firstStep === false) {
                    item.Buttons[i].Quantity = 1;
                    firstStep = true;
                    continue;
                }
            } else if (item.Buttons[i].Quantity === 1) {
                if (firstStep === false) {
                    firstStep = true;
                    continue;
                }
            }

            if (firstStep === true) {
                if (item.Buttons[i].Quantity > 0) {
                    item.Buttons[i].Quantity = 0;
                }
            }
        }
        return item;
    }

    private hasQuantities(item): Boolean {
        for (let i = 0; i < item['Buttons'].length; i++) {
            if (item['Buttons']['Quantity'] > 0) {
                return true;
            }
        }
        return false;
    }

    private updateItemQuantities() {
        for (let i = 0; i < this.item['Modifiers'][this.pageIndex]['Buttons'].length; i++) {
            for (let t = 0; t < this.selItems.length; t++) {
                if (this.selItems[t].Caption == this.item['Modifiers'][this.pageIndex]['Buttons'][i].Caption) {
                    this.item['Modifiers'][this.pageIndex]['Buttons'][i].Quantity = this.selItems[t].Quantity;
                }
            }
        }
    }

    public modifiersHandled(obj) {
        this.modifiersSubject.next(obj);
    }

    incrementItemToList(itemButton: any): void {
        if (itemButton != null) {
            const buttonInfo: any = itemButton;
            const selectedItemsQty: Number = (this.selItems.length + 1);
            if (this.useDlgMessage && buttonInfo.DlgMessage) {
                this._tempButton = itemButton;

                // eventObject = {Message:buttonInfo.DlgMessage, ID:'1', type:'beer',
                // functionToCallOnYes:this.callButtonClick.bind(this), paramToCall:String(buttonInfo.ID),
                // functionToCallOnNo:Config.view.closeGeneralPopup };
                // Config.root.showConfirmationPopup(eventObject);
                return;
            }

            if (this.modifierData.MaxQuantity >= selectedItemsQty) {
                let itemQuantity = 0;
                if (buttonInfo.hasOwnProperty('Quantity')) {
                    itemQuantity = buttonInfo.Quantity;
                } else {
                    itemQuantity = 0;
                    buttonInfo.Quantity = 0;
                }
                if (itemQuantity < buttonInfo.MaxQuantity) {

                    this.selItems.push(itemButton);
                    buttonInfo.Quantity += 1;
                }
            }
        }

        this.sortByPrice();
        this.autoSubmitData();

    }

    public onModifierButtonClicked(itemButton: any): void {
        // this.lastButtonClicked = itemButton;
        const buttonInfo: any = itemButton;
        if (buttonInfo.Parameters && String(buttonInfo.Parameters.Type).toLowerCase() === 'group') {
            // this.launchGroupPage( this.dataManager.groups[buttonInfo.Action], buttonInfo.Skin );
            // tslint:disable-next-line: max-line-length
        } else if (buttonInfo && buttonInfo.ModifiersPage && buttonInfo.ModifiersPage.Modifiers && buttonInfo.ModifiersPage.Modifiers.length > 0) {
            this.launchSubModifiers(buttonInfo.ModifiersPage);
        } else {
            this.incrementItemToList(itemButton);
        }
    }

    /*
    @decrement items from list
     */
    public onModifierButtonThumbClicked(itemButton: any): void {

        const buttonInfo = itemButton;
        buttonInfo.Quantity--;
        for (let i = 0; i < this.selItems.length; i++) {
            if (this.selItems[i] == buttonInfo) {

                this.selItems.splice(i, 1);
                return;
            }
        }
    }

    /*
     @checkes if the button needs to have combo builder wrapper or not
     */
    public checkIfComboWrapperIsNeeded(button: Button): boolean {
        if (this.configService.allItemsAsCombo !== true) {
            return false;
        }

        if (button.IgnoreAllItemsAsCombo == true) {
            return false;
        }

        if (button.ModifiersPage && button.ModifiersPage.Modifiers && button.ModifiersPage.Modifiers.length > 0) {
            // if none of the modifiers are combo builder, then we need to add the combo builder wrapper
            const comboObj = button['ModifiersPage']['Modifiers'].find(obj => obj['PageInfo']['ModifierTemplate'] === 'combobuilder');
            if (comboObj) {
                return false;
            } else {
                return true;
            }
        }
        return true;
    }

    /*
     @converts the simple item to a combos item
      */
    public convertToComboBuilderItem(button: Button): Button {

        button['Quantity'] = 1;
        const newButton: unknown = {
            'Selected': false,
            'Enabled': true,
            'Picture': button.Picture,
            'Caption': button.Caption,
            'CaptionDictionary': '',
            'Description': button.Description,
            'Visible': true,
            'ButtonType': 2,
            'PageID': 0,
            'DisplayMode': button.DisplayMode,
            'IsFakeComBuilderWrapper': true,
            'DlgMessage': '',
            'Link': button.Link,
            'Jump': null,
            'ButtonStatus': button.ButtonStatus,
            'ServiceType': 3,
            'ModifiersPage': {
                'Modifiers': [{
                    'PageInfo': {
                        'ChargeThreshold': 0,
                        'Groups': null,
                        'DefaultQuantity': 0,
                        'ModifierID': 13172,
                        'KeepModifiersSelection': false,
                        'MinQuantity': 1,
                        'ItemID': '101810',
                        'ModifierTemplate': 'combobuilder',
                        'ID': 13172,
                        'LaunchedFromMenu': false,
                        'FType': 0,
                        'Title': button.Caption,
                        'MaxQuantity': 1,
                        'Name': button.Caption,
                        'DisplayCancel': 0,
                        'Background': null,
                        'AutoPopFeat': '1'
                    },
                    'Buttons': [
                        button
                    ]
                }],
                'ItemInfo': {
                    'Price': '0',
                    'CompositionLabel': null,
                    'CanaddsLabel': null,
                    'Action': button.Link,
                    'Picture': button.Picture,
                    'Caption': button.Caption,
                    'CaptionDictionary': ''
                }
            },
            'DefaultQuantity': button.DefaultQuantity,
            'MinQuantity': button.MinQuantity,
            'ChargeThreshold': 0,
            'MaxQuantity': 0,
            'Price': '0',
            'Visibility': '0',
            'Tags': '',
            'Categories': '',
            'Order': button.Order
        };


        return newButton as Button;
    }

    /*
     @converts the combos item back to a simple item
      */
    public extractFakeComBuilderWrapper(product: Button, allSelectedItems: Array<any>): any {
        const extracted = {};

        if (product['IsFakeComBuilderWrapper'] === true) {
            extracted['currentPersonalizationItem'] = product['ModifiersPage']['Modifiers'][0]['Buttons'][0];
            if (allSelectedItems[0] && allSelectedItems[0]['ModifiersPage'] && allSelectedItems[0]['ModifiersPage']['Modifiers']) {
                const selected = [];
                for (let i = 0; i < allSelectedItems[0]['ModifiersPage']['Modifiers'].length; i++) {
                    const element = allSelectedItems[0]['ModifiersPage']['Modifiers'][i];
                    for (let j = 0; j < element['Buttons'].length; j++) {
                        selected.push(element['Buttons'][j]);
                    }
                }
                extracted['allSelectedItems'] = selected;
            } else {
                extracted['allSelectedItems'] = [];
            }
        } else {
            extracted['currentPersonalizationItem'] = product;
            extracted['allSelectedItems'] = allSelectedItems;
        }
        return extracted;
    }

    public onModifierScreen() {
        return this.modifierScreenSubject.asObservable();
    }

    public onModifierScreenClose() {
        return this.modifierScreenClose.asObservable();
    }

    public startModifier(obj: any, objModifier: any = null) {
        this.pageIndex = 0;
        if (objModifier != null) {
            this.objectModifiers = objModifier;
        } else {
            this.objectModifiers = obj.Combos;
        }
        this.itemInfo = obj;
        this.launchPersonalise();
    }

    private launchPersonalise(): void {
        if (!this.pageIndex) {
            this.pageIndex = 0;
        }


        const crtPageData: Object = this.objectModifiers['Modifiers'][this.pageIndex];
        try {
            const iceItem = crtPageData['Buttons'][0].Caption;
            if (iceItem === 'Ice') {
                crtPageData['PageInfo'].ModifierTemplate = 'ice';
            }
        } catch (e) {
            // trace('');
        }

        const modifiersScreen = {
            action: 'startModifiers',
            obj: this.objectModifiers,
            timeout: this.configService.screenTimeout
        };
        this.modifierScreen(modifiersScreen);
    }


    public addItemWithModifiers(items, itemInfo = null) {

        if (this.currentPersonalizationItem['LaunchedFromCombo'] == true ) {
            // in case the user did not fill all the mandatory combos, we apply autocomplete to prevent injection errors
            this.checkForAutoComplete(<any>this.currentPersonalizationItem);

            // nothing else, the itmes have been updated, the comboStep should handle the rest
            return;
        }

        if (itemInfo != null) {
            this.itemInfo = itemInfo;
        }

        this.allSelectedItems = [];
        this.allSuggestiveItems = [];
        if (this.currentPersonalizationItem['HasSiblings'] === true) {
            items = this.insertChildrenBackToParent(items);
            this.currentPersonalizationItem['HasSiblings'] = false;
        }
        this.checkForAutoComplete(<any>this.currentPersonalizationItem);

        if (this.currentPersonalizationItem['SinglePersonalizationItem']) {
            items = this.currentPersonalizationItem.ModifiersPage.Modifiers;
            // this.basketService.addProduct(<any>this.currentPersonalizationItem, this.currentPersonalizationItem.ModifiersPage.Modifiers);
            // return;
        }


        // if there are multiple pages to be inserted
        if (items[0] && (items[0].Buttons || items[0].PageInfo) ) {
            // console.log(' items[0].Buttons = ',  items[0].Buttons);

            for (let j = 0; j < items.length; j++) {
                const buttons = items[j].Buttons;
                if (buttons !== undefined) {
                    if (items[j].PageInfo.ModifierTemplate === 'ComboBuilderSiblings') {
                        continue;
                    }
                    for (let i = 0; i < buttons.length; i++) {
                        // if (buttons[i].hasOwnProperty('Quantity')) {
                        // cfe: added 'buttons[i].AllowQtyZero' as Pickup Modifier should be allowed with Quantity == 0 (check DOT19-191)
                        if (buttons[i].Quantity > 0 || buttons[i].AllowQtyZero) {
                            // console.log(' found quantity push = ',  buttons[i]);
                            this.allSelectedItems.push(buttons[i]);
                        }
                        // }
                    }
                } else {
                    for (let b = 0; b < items[j].length; b++) {
                        const btns = items[j][b].Buttons;
                        for (let i = 0; i < btns.length; i++) {
                            // if (buttons[i].hasOwnProperty('Quantity')) {
                            /* cfe: added 'buttons[i].AllowQtyZero' as Pickup Modifier
                            should be allowed with Quantity == 0 (check DOT19-191)*/
                            if (btns[i].Quantity > 0 || btns[i].AllowQtyZero) {
                                // console.log(' found quantity push = ',  buttons[i]);
                                this.allSelectedItems.push(btns[i]);
                            }
                            // }
                        }
                    }
                }
            }
        } else {
            for (let i = 0; i < items.length; i++) {
                // if (items[i].hasOwnProperty('Quantity')) {
                // cfe: added 'items[i].AllowQtyZero' as Pickup Modifier should be allowed with Quantity == 0 (check DOT19-191)
                if (items[i].Quantity > 0 || items[i].AllowQtyZero) {
                    this.allSelectedItems.push(items[i]);
                }
                // }
            }
        }

        // make an array with the selected suggestions
        const suggestions = [];
        if (this._suggestiveItem !== null &&
            this._suggestiveItem !== undefined &&
            this._suggestiveItem !== {}) {
            for (let g = 0; g < this._suggestiveItem['Buttons'].length; g++) {
                const expr = this._suggestiveItem['Buttons'][g];
                if (expr['Quantity'] > 0) {
                    this.checkForAutoComplete(<any>expr);

                    const selected = [];
                    if (expr['ModifiersPage'] && expr['ModifiersPage']['Modifiers']) {
                        for (let i = 0; i < expr['ModifiersPage']['Modifiers'].length; i++) {
                            const element = expr['ModifiersPage']['Modifiers'][i];
                            for (let j = 0; j < element['Buttons'].length; j++) {
                                selected.push(element['Buttons'][j]);
                            }
                        }
                    }
                    suggestions.push({item: expr, modifiers: selected});

                    // this.basketService.addProduct(<any>expr, selected);
                }
            }

            this.comboBuilderModifierService.suggestiveItem = null;
            this._suggestiveItem = null;
        }


        const extractedItem = this.extractFakeComBuilderWrapper(this.currentPersonalizationItem, this.allSelectedItems);
        this.currentPersonalizationItem = extractedItem.currentPersonalizationItem;

        const modifierSession = ConfigurationService.generateUUID();
        const totalProducts = (suggestions.length + 1);
        let productIndex = 0;
        if (!this.currentPersonalizationItem.History) {
            this.currentPersonalizationItem.History = {
                promo: null,
                sugestion: null,
                type: 'normal',
                ModifierSession: {index: productIndex, pieces: totalProducts, UUID: modifierSession}
            };
        } else {
            if (!this.currentPersonalizationItem.History.type) {
                this.currentPersonalizationItem.History.type = 'normal';
            }
            this.currentPersonalizationItem.History.ModifierSession = {index: productIndex, pieces: totalProducts, UUID: modifierSession};
        }
        // this.allSelectedItems = extractedItem.allSelectedItems;
        const allSelectedItems = extractedItem.allSelectedItems;
        this.basketService.addProduct(<any>this.currentPersonalizationItem, allSelectedItems);



        // actually send the suggestions to the basket
        suggestions.forEach(suggestion => {
            productIndex ++;
            if (!suggestion.item.History) {
                suggestion.item.History = {
                    promo: null,
                    sugestion: null,
                    type: 'suggestion',
                    ModifierSession: {index: productIndex, pieces: totalProducts, UUID: modifierSession}
                };
            } else {
                suggestion.item.History.type = 'suggestion';
                suggestion.item.History.ModifierSession = {index: productIndex, pieces: totalProducts, UUID: modifierSession};
            }
            this.basketService.addProduct(<any>suggestion.item, suggestion.modifiers);
        });

    }

    private insertChildrenBackToParent(items) {

        const numChildren = this.currentPersonalizationItem['ModifiersPage']['Modifiers'].length;
        // tslint:disable-next-line: max-line-length
        const lastItem = this.currentPersonalizationItem['ModifiersPage']['Modifiers'][numChildren - 1];
        if (lastItem['PageInfo'] !== null && lastItem['PageInfo'] !== undefined &&
            lastItem['PageInfo']['ForceMandatory'] !== null &&
            lastItem['PageInfo']['ForceMandatory'] !== undefined) {
            // tslint:disable-next-line: max-line-length
            this.currentPersonalizationItem['ModifiersPage']['Modifiers'][numChildren - 1]['PageInfo']['ModifierTemplate'] = 'ComboBuilderSiblings';
            this.currentPersonalizationItem['ModifiersPage']['Modifiers'].pop();
        }
        for (let i = 0; i < items.length; i++) {
            const expresion = items[i];
            if (expresion['PageInfo'] !== null && expresion['PageInfo'] !== undefined) {
                if (expresion['PageInfo']['ForceMandatory'] !== null && expresion['PageInfo']['ForceMandatory'] !== undefined) {
                    this.joinSiblings(expresion);
                    items.splice(i, 1);
                    break;
                }
            }
        }

        return items;
    }

    private joinSiblings(itemsToBeJoined) {
        for (let i = 0; i < this.currentPersonalizationItem['ModifiersPage']['Modifiers'].length; i++) {
            const expresion = this.currentPersonalizationItem['ModifiersPage']['Modifiers'][i];
            if (expresion['Buttons'] !== null && expresion['Buttons'] !== undefined) {
                for (let j = 0; j < expresion['Buttons'].length; j++) {
                    // let smallExpr = expresion['Buttons'][j]['ModifiersPage']['Modifiers'][0];// should be new search
                    if (expresion['Buttons'][j]['ModifiersPage'] !== null && expresion['Buttons'][j]['ModifiersPage'] !== undefined) {
                        // tslint:disable-next-line: max-line-length
                        if (expresion['Buttons'][j]['ModifiersPage']['Modifiers'] !== null && expresion['Buttons'][j]['ModifiersPage']['Modifiers'] !== undefined) {
                            const smallExpr = expresion['Buttons'][j]['ModifiersPage']['Modifiers'][0];
                            if (smallExpr !== null && smallExpr !== undefined) {
                                // tslint:disable-next-line: max-line-length
                                if (smallExpr['PageInfo']['ForceMandatory'] !== null && smallExpr['PageInfo']['ForceMandatory'] !== undefined) {
                                    for (let b = 0; b < itemsToBeJoined.length; b++) {
                                        if (itemsToBeJoined[b]['Buttons'] !== null && itemsToBeJoined[b]['Buttons'] !== undefined) {
                                            for (let d = 0; d < itemsToBeJoined[b]['Buttons'].length; d++) {
                                                // tslint:disable-next-line: max-line-length
                                                if (itemsToBeJoined[b]['Buttons'][d]['Quantity'] !== null && itemsToBeJoined[b]['Buttons'][d]['Quantity'] !== undefined && itemsToBeJoined[b]['Buttons'][d]['Quantity'] > 0) {
                                                    // tslint:disable-next-line: max-line-length
                                                    if (smallExpr['Buttons'][d]['Quantity'] !== null && smallExpr['Buttons'][d]['Quantity'] !== undefined) {
                                                        // tslint:disable-next-line: max-line-length
                                                        smallExpr['Buttons'][d]['Quantity'] = Number(smallExpr['Buttons'][d]['Quantity']) + Number(itemsToBeJoined[b]['Buttons'][d]['Quantity']);
                                                    }
                                                }
                                            }
                                        }
                                    }
                                    break;
                                }
                            }
                        }
                    }
                }
            }
        }
    }

    public submitModifierTemplate(item) {
        if (this.comboBuilderModifierService.submitInfo === true) {
            this.addItemWithModifiers(item['ModifiersPage']['Modifiers']);
        } else {
            if (this.comboBuilderModifierService.suggestiveModifiersSelected === false) {
                this.comboBuilderModifierService.addModifiersToItem(item);
            } else {
                this.comboBuilderModifierService.addModifiersToSuggestiveItem(item);
            }
        }
    }

    private decodeQuantities() {
        for (let i = 0; i < this.itemCopy['ModifiersPage']['Modifiers'].length; i++) {
            let currentItem = this.itemCopy['ModifiersPage']['Modifiers'][i]['Buttons'];
            if (currentItem.length === 1) {
                const item = this.checkSelectedItemsFor(currentItem);
                if (item !== null) {
                    currentItem = item;
                }
            } else {
                currentItem = this.corelateMultipleItemsQtys(currentItem);
            }
        }
    }



    private checkSelectedItemsFor(item): Object {
        for (let i = 0; i < this.allSelectedItems.length; i++) {
            if (item.Link === this.allSelectedItems[i].Link) {
                return this.allSelectedItems[i];
            }
        }
        return null;
    }

    private corelateMultipleItemsQtys(item): Object {
        for (let i = 0; i < item.length; i++) {
            let currentItem = item[i];
            for (let j = 0; j < this.allSelectedItems.length; j++) {
                if (currentItem.Link === this.allSelectedItems[j].Link) {
                    Log.debug(currentItem.Caption + 'itemul');
                    currentItem = this.allSelectedItems[j];
                    currentItem['Quantity'] = this.allSelectedItems[j]['Quantity'];
                    Log.debug(currentItem.Quantity + ' ce qty are la final');
                }
            }
        }
        return item;
    }

    private checkForAutoComplete(product: Button): void {
        if (product && product['ModifiersPage'] && product['ModifiersPage']['Modifiers']) {
            const items = product['ModifiersPage']['Modifiers'];
            for (let i = 0; i < items.length; i++) {
                const item = items[i];
                this.autoCompleteModifier(item);
            }
        }
    }

    private autoCompleteModifier(modifier): void {
        const itemMaxQty = modifier['PageInfo']['MinQuantity'];
        let itemQty = 0;
        if (modifier['Buttons'] !== null && modifier['Buttons'] !== undefined) {
            itemQty = this.checkItemQuantities(modifier['Buttons']);
            if (itemQty < itemMaxQty) {
                modifier = this.fillAutoComplete(modifier, itemMaxQty, itemQty);
            }
        } else {
            if (modifier.length > 0) {
                // for split items max qty is always 1
                for (let b = 0; b < modifier.length; b++) {
                    itemQty += this.checkItemQuantities(modifier[b]['Buttons']);
                }
                if (itemQty < itemMaxQty) {
                    modifier = this.fillAutoComplete(modifier, itemMaxQty, itemQty);
                }
            }
        }


        if (itemQty > 0) {

            // also autocomplte his children if any
            // tslint:disable-next-line: max-line-length
            try {
                if (modifier['Buttons'] && modifier['Buttons'].length > 0) {
                    modifier['Buttons'].forEach(btn => {
                        this.checkForAutoComplete(btn as Button);
                    });
                }
            } catch (e) { }
        }
    }

    private checkItemQuantities(arr): any {
        let returnNr = 0;
        if (arr !== undefined) {
            if (arr.length === 1) {
                returnNr = arr[0]['Quantity'];
            } else if (arr.length > 1) {
                for (let i = 0; i < arr.length; i++) {
                    if (arr[i]['Quantity']) {
                        returnNr += arr[i]['Quantity'];
                    }
                }
            }
        }

        return returnNr;
    }

    private fillAutoComplete(item, maxQty, crtQty): Object {
        if (item['Buttons'] !== null && item['Buttons'] !== undefined) {
            for (let i = 0; i < item['Buttons'].length; i++) {
                const hasNoQuantity = this.checkItemQuantities(item['Buttons'][i]);
                if (hasNoQuantity > 0) {
                    continue;
                }
                /* cfe: added '!item['Buttons'][i].AllowQtyZero' so will
                ignore Pickup Modifiers as they should be allowed with Quantity == 0!*/
                // cfe: Check DOT19-191
                if (item['Buttons'][i]['AutoComplete'] === 1 && !item['Buttons'][i].AllowQtyZero) {
                    item['Buttons'][i]['Quantity'] = maxQty - crtQty;
                    break;
                }
            }
        } else {
            for (let j = 0; j < item.length; j++) {
                const currentItem = item[j];
                const hasNoQuantity = this.checkItemQuantities(currentItem['Buttons']);
                if (hasNoQuantity > 0) {
                    continue;
                }
                for (let b = 0; b < currentItem['Buttons'].length; b++) {

                    /* cfe: added '!item['Buttons'][i].AllowQtyZero' so will
                    ignore Pickup Modifiers as they should be allowed with Quantity == 0!*/
                    // cfe: Check DOT19-191
                    if (currentItem['Buttons'][b]['AutoComplete'] === 1 && !currentItem['Buttons'][b].AllowQtyZero) {
                        currentItem['Buttons'][b]['Quantity'] = 1;
                        break;
                    }
                }
            }
        }
        return item;
    }

    protected modifierScreen(screen) {
        this.modifierScreenSubject.next(screen);
    }

    private modifierClose(obj: any) {
        this.modifierScreenClose.next(obj);
    }

    private launchSubModifiers(objSubModifiers: any): void {
        // to be implemented
    }

    onModifierGroupClosed(): void {
        // to be implemented
    }

    private closeSubModifiers(): void {
        // to be implemented
    }

    public submit() {
        // code to submit the data
    }

    private forceClose() {

    }


    public get modifierData(): any { return this._modifierData; }
    public set modifierData(item: any) { this._modifierData = item; }

    public get modifierButtons(): Array<any> { return this._modifierButtons; }
    public set modifierButtons(item: Array<any>) { this._modifierButtons = item; }

    public get item(): Object { return this._item; }
    public set item(item: Object) { this._item = item; }

    public get itemInfo(): Object { return this._itemInfo; }
    public set itemInfo(item: Object) { this._itemInfo = item; }

    public get topButtons(): Array<any> { return this._topButtons; }
    public set topButtons(item: Array<any>) { this._topButtons = item; }

    public get groups(): any { return this._groups; }
    public set groups(item: any) { this._groups = item; }

    public get autoCompleteData(): Object { return this._autoCompleteData; }
    public set autoCompleteData(item: Object) { this._autoCompleteData = item; }

    public get selItems(): Array<any> { return this._selItems; }
    public set selItems(item: Array<any>) { this._selItems = item; }

    initModifierStepData(modifierData: Object, modifierButtons: Array<any>, itemInfo: Object) {
        this._modifierData = modifierData;
        this._modifierButtons = modifierButtons;
        this._itemInfo = itemInfo;
    }

    resetQuantitiesToDefault(): void {
        if (this._modifierButtons) {
            for (this.i = 0; this.i < this._modifierButtons.length; this.i++) {
                this._modifierButtons[this.i].Quantity = this._modifierButtons[this.i].DefaultQuantity;
                if (this._modifierButtons[this.i].Quantity > 0) {
                    for (let j = 0; j < this._modifierButtons[this.i].Quantity; j++) {
                        this.selItems.push(this._modifierButtons[this.i]);
                    }
                }
            }
        }
    }

    calculatePaidQuantities(): void {
        if (this._modifierButtons) {
            for (this.i = 0; this.i < this._modifierButtons.length; this.i++) {
                this._modifierButtons[this.i].QuantityChargeThreshold =
                    this._modifierButtons[this.i].Quantity - this._modifierButtons[this.i].FreeQuantity;
            }
        }
    }

    clearFreeQunatities(): void {
        if (this._modifierButtons) {
            for (this.i = 0; this.i < this._modifierButtons.length; this.i++) {
                this._modifierButtons[this.i].FreeQuantity = 0;
            }
            this._modifierButtons['FreeQuantity'] = 0;
        }
    }

    groupAndFilterButtons(): void {
        this.topButtons = [];
        this._groups = [];
        let i = 0;

        if (this._modifierButtons) {
            for (i = 0; i < this.modifierButtons.length; i++) {
                const button = this.modifierButtons[i];
                // top buttons are the elements that have Group 0 or ""
                if (button.Group == null) {
                    button.Group = 0;
                }
                if (Number(button.Group) === 0 /* && String(button.Parameters.Type).toLowerCase() == "group" */) {
                    this.topButtons.push(button);
                } else {
                    if (!this._groups[button.Group]) {
                        this._groups[button.Group] = [];
                    }
                    this._groups[button.Group].push(button);
                }

            }
        }

        // filter remainig buttons to remove AutoComplete button;
        for (i = this.topButtons.length - 1; i >= 0; i--) {
            const topButton = this.topButtons[i];

            if (i === 2) {
                if (topButton.AutoComplete && topButton.AutoComplete === true && topButton.Price === 0) {
                    this._autoCompleteData = topButton;
                    this.topButtons.splice(i, 1);
                    break;
                }
            } else {
                if (topButton.AutoComplete && topButton.AutoComplete === true) {
                    this._autoCompleteData = topButton;
                    this.topButtons.splice(i, 1);
                    break;
                }
            }


        }
    }

    autoCompleteItems(): void {
        if (this._autoCompleteData != null) {
            const diffToMin = this._modifierData.MinQuantity - this._selItems.length;
            this._autoCompleteData.Quantity = diffToMin;
        }
    }

    sortByPrice(): number {
        // this.selItems.sortOn("Price", Array.NUMERIC);
        let i: number;
        let buttonInfo: any;

        // first change all FreeQunatities to 0, they will be reevaluated by the loop
        this.modifierData.FreeQuantity = 0;
        for (i = 0; i < this.selItems.length; i++) {
            buttonInfo = this.selItems[i];
            buttonInfo.FreeQuantity = 0;
        }

        // change charge threshold to lowest items
        let totalPrice = 0;
        for (i = 0; i < this.selItems.length; i++) {
            buttonInfo = this.selItems[i];

            if (this.modifierData.FreeQuantity < this.modifierData.ChargeThreshold) {
                if (buttonInfo.FreeQuantity < buttonInfo.ChargeThreshold) {
                    buttonInfo.FreeQuantity += 1;
                    this.modifierData.FreeQuantity += 1;
                } else {
                    totalPrice += buttonInfo.Price;
                }
            } else {
                totalPrice += buttonInfo.Price;
            }
        }

        return totalPrice;
    }

    evalAutoSubmit(): void {
        if (this.modifierData.FType === 3) {
            if (this.modifierData.MaxQuantity === 0) {
                this.modifierData.MaxQuantity = 1000;
                this.modifierData.AutoSubmit = false;
            }
            if (!this.modifierData.MaxQuantity) {
                this.modifierData.MaxQuantity = 1;
            }
        } else if (this.modifierData.FType === 2) {
            this.modifierData.AutoSubmit = true;
        } else if (this.modifierData.FType === 1) {
            this.modifierData.AutoSubmit = true;
        }
    }

    purgeData() {
        Log.debug(' purging modifierService data');

        this._mealItem = null;
        this.allSelectedItems = [];
        this.modifierData = null;
        this.modifierButtons = null;
        this.item = null;
        this.itemInfo = null;
        this.selItems = [];
    }


    getTitle(numSelected: number, totalToSelect: number, initialText: string): string {
        let newText: string = initialText;
        let nextMsg;

        // ex: Title (String) = CHOISISSEZ LE {$INDEX#2014012201} SAUCE POUR ACCOMPAGNER VOS
        if (totalToSelect <= 1) {
            if (newText) {
                newText = newText.split(ModifiersService.MSG_TO_REMOVE).join('');
            }
        } else {

            // set index
            if (newText) {
                newText = newText.split('$INDEX#').join(String(numSelected + 1)).toString();

                // change index of message
                const nextMsgIndex = ModifiersService.MSG_INDEX_FOR_MULTIPLE_ITEMS + numSelected;
                nextMsg = this.internationalizationService.translate(String(nextMsgIndex)).toUpperCase();
                newText = newText.split(ModifiersService.MSG_INDEX_FOR_MULTIPLE_ITEMS.toString()).join(nextMsg);

                // remove brackets
                newText = newText.split('{').join('');
                newText = newText.split('}').join('');
            }


        }

        if (nextMsg) {
            newText = newText.split(nextMsg).join('<sup>' + nextMsg + '</sup>');
        }

        return newText;
    }



}
