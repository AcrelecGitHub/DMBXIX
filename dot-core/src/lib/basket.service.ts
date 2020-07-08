import { Injectable } from '@angular/core';
import { Subject, Observable } from 'rxjs';

import { Log } from './logger/log';
import { Hookable } from './decorators/hookable.decorator';
import { HooksIdentifiers } from './hook-manager/hooks-identifiers';

import { Combo, Basket, Button } from './models';
import { ConfigurationService } from './configuration.service';
import { LocalizationService } from './localization.service';
import { BasketItemType } from './enums';
import { ContentService } from './content.service';
import { Promo } from './models/promotions.model';
import { InternationalizationService } from './internationalization.service';

export enum OrderCloseCause {
    AppTimeout = 'APP_TIMEOUT',
    OrderFail = 'ORDER_FAIL',
    CancelOrder = 'CANCEL_ORDER',
    OrderSuccess = 'ORDER_SUCCESS'
}


@Injectable({
    providedIn: 'root'
})
export class BasketService {

    private _basket: Basket;
    private _personalizationHistory: Array<any>;
    private _serviceType: 'in' | 'out' = 'in';
    private _orderInProgress: boolean;
    private _orderTotal: number;
    private content: ContentService;

    private _basketChangedStream = new Subject<any>();
    private _setServiceTypeStream = new Subject<'in' | 'out'>();
    private _startOrderStream = new Subject<void>();
    private _cancelOrderStream = new Subject<OrderCloseCause>();
    private _completeOrderStream = new Subject<void>();
    private _validateOrderStream = new Subject<void>();

    private _confirmOrderStream = new Subject<void>();
    private _continueOrderStream = new Subject<void>();
    private _onBasketItemsRemoved = new Subject<Array<string>>();
    public _currentContainer: string;



    constructor(private localizationService: LocalizationService) {
        this.onBasketChangedStream.subscribe(() => this.updateTotals());
    }

    public get currentContainer(): string {
        return this._currentContainer;
    }

    public set currentContainer(screen: string ) {
        this._currentContainer = screen;
    }

    get onBasketItemsRemoved(): Observable<Array<string>> {
        return this._onBasketItemsRemoved.asObservable();
    }

    private createBasket(): void {
        // let refInt: number;
        // try {
        //     refInt = JSON.parse(localStorage.getItem('refInt'));
        //     refInt++;
        // } catch {
        //     Log.debug('Could not recover orderReference number from local storage.');
        // }

        // if (!refInt) {
        //     refInt = Math.round(1 + Math.random() * Math.pow(10, 6) - 2); // Max of 6 digits
        // }

        // if (refInt >= Math.pow(10, 6) - 1) {
        //     refInt = 1;
        // }

        this._basket = {
            Order: {
                BCSecurity: '',
                Closed: true,
                TotalInitialPrice: '',
                OrderExtID: '',
                OrderVer: '1500', // API elog, harcoded version, requested and approved by PNE
                OrderEnd: '',
                TotalTAX: '',
                TotalQty: 0,
                POSResult: 0,
                // OrderRefInt: refInt.pad(6),
                OrderRefInt: '0', // set this value from elog service
                POSDetails: 0,
                IntegrationStart: '',
                OrderStart: this.localizationService.formatDate(new Date(), 'hhmmss'),
                GrossAmount: '',
                OrderElogLocation: 0,
                DeliveryPointName: '',
                GrandTotalInteger: 0,
                DeliveryPointDesc: '',
                PromoUsed2: '',
                PAYDetails_txt: '',
                SvcCharge: {
                    OrderTenderItems: [],
                    OrderAmountStr: '',
                    OrderAmountInt: 0
                },
                OrderNr: -999,
                OrderTime: '',
                TotalPrice: '0.00',
                Amounts: {
                    OrderTenderItems: [],
                    OrderAmountStr: '0.00',
                    OrderAmountInt: 0
                },
                OrderNrStr: '',
                PAYDetails: 0,
                ComboGroups: [],
                TotalTAXInteger: 0,
                POSTovStatus: 0,
                TaxAmount: '',
                TotalInitialPriceInteger: 0,
                TableService: -1,
                PaymentStart: '',
                OrderKiosk: '1',
                PaymentDuration: '',
                BusinessDay: new Date(), // localizationService.formatDate(new Date(), 'yyMMdd'),
                Operations: [],
                POSTovDetails_txt: '',
                EndStatus: -1,
                POSStatus: 0,
                OrderInOut: 1,
                OrderStoreNo: '',
                PromoOfferTime: '',
                TotalPriceInteger: 0,
                Combos: [],
                BrandID: '',
                OrderStoreName: '',
                PromoBar: '',
                POSDetails_txt: '',
                IntegrationDuration: '',
                ReceiptText: '',
                PaidAmount: '',
                POSTovDetails: 0,
                GrandTotal: '0.00',
                PreOrder: false,
                CustomInfo: '',
                PAYStatus: 0,
                FirstItem: '',
                VATInfo: [],
                OrderSIM: ''
            },
            MsgInOut: 'Your order will be:',
            MsgQty: 'No items',
            MsgTotal: 'Total',
            Title: 'Your order'
        };

        // try {
        //     localStorage.setItem('refInt', JSON.stringify(refInt));
        // } catch {
        //     Log.debug('Could not write refInt number to local storage.');
        // }

        this._basketChangedStream.next( {item: null, action: 'BASKET_CREATE'} );
    }

    public get basket(): Basket {
        if (!this._basket) {
            this.createBasket();
        }
        return this._basket;
    }

    public get items(): Combo[] {
        // return  this.deleteInvisibleItems( JSON.parse( JSON.stringify(this._basket.Order.Combos) ) );
        if (this._basket && this._basket.Order) {
            return  this._basket.Order.Combos;
        } else {
            return [];
        }
    }

    public get orderTotal(): number {
        return this._orderTotal;
    }

    public get onBasketChangedStream(): Observable<any> {
        return this._basketChangedStream.asObservable();
    }

    revalidateItems() {
        const items = this.items;
        const removed = [];
        for (let i = items.length - 1; i >= 0; i--) {
            const item = items[i];
            if (item.History && item.History.type === 'promo' && item.History.promo) {
                const stillValid = this.validateCondition(item.History.promo);
                if (stillValid === false) {
                    Log.debug( ' Product is invalid ' + item.LName );
                    this._basket.Order.Combos.remove(item);
                    removed.push(item.LName);
                }
            }
        }

        if (removed.length > 0) {
            this._onBasketItemsRemoved.next(removed);
        }
    }

    validateCondition(lPromo: Promo): boolean {
        let lResult = false;
        if (lPromo.Description.PromoButtonList) {
            const promoBtnFound = lPromo.Description.PromoButtonList.find( promoItem => promoItem.hasOwnProperty('IF'));
            if (promoBtnFound) {
                const ifCond = promoBtnFound.IF.split(' ').join('').split(','); // delete all spaces and send all values into Array
                for (let i = 0; i < this.basket.Order.Combos.length; i++) {
                    const combo = this.basket.Order.Combos[i];
                    if (combo.History && combo.History.type === 'promo') {
                        // promos can not validate other promos
                    } else {
                        if (ifCond.find(id => id === combo.ItemID)) {
                            lResult = true;
                        }
                    }
                }
            } else {
                lResult = true;
            }
        } else {
            lResult = true;
        }
        return lResult;
    }


    public addCombo(combo: Button, selections: Button[]): void {
        Log.info('Adding combo to basket...');

        // Check if it is a modification of a previously added combo
        if (combo.UUID) {
            Log.info('This combo is a modification from a privously added combo.');
            const existingBasketItem = this.items.find(_ => _.UUID === combo.UUID);
            if (existingBasketItem.Qty > 1) {
                existingBasketItem.Qty--;
                this.updatePersonnalizationHistoryItem(existingBasketItem);
            } else {
                this.items.remove(existingBasketItem);
            }
        }

        const basketItem = this.generateItem(combo, BasketItemType.biCombo);

        for (const selection of selections) {
            const comboSelection = this.generateItem(selection, BasketItemType.biComboItem);

            if ( selection['ModifiersPage'] && selection['ModifiersPage']['Modifiers'] ) {
                selection['ModifiersPage']['Modifiers'].forEach(modifier => {
                    if (modifier && modifier['Buttons']) {
                        modifier['Buttons'].forEach(button => {
                            this.addModifierItems(button, comboSelection);
                        });
                    }
                });
            }
            basketItem.Combos.push(comboSelection);
        }

        basketItem.ComboPriceStr = this.calculateItemTotal(basketItem).toString();

        const index = this.findComboInList(basketItem);
        if (index >= 0) {
            this.incrementItem(this.basket.Order.Combos[index], 'PRODUCT_ADD');
            Log.info('Basket already contains the same combo. Quantity was increased.');
        } else {
            basketItem.Qty = 1;
            combo.Quantity = 1;
            this.basket.Order.Combos.push(basketItem);
            this.addToPersonalizationHistory(combo, undefined, basketItem.UUID);
            Log.info('New combo added to basket!');
        }

        this.updateTotals();
    }

    @Hookable(HooksIdentifiers.ADD_ITEM_TO_BASKET)
    async addProduct(product: Button, modifiers: any = null): Promise<void> {
        let orderItem = this.generateItem(product, BasketItemType.biItem);
        orderItem = this.addModifiersToItem(orderItem, modifiers);

        const isPromo = this.isPromoItem(product);

        // if item has UUID... we asume it's a repersonalization and update acordingly
        if ( product.UUID ) {
            this.updateItemWithModifiers(product, modifiers, this.getItemFromPersonalisationHistory(product.UUID) );
            this._basketChangedStream.next( {item: orderItem, action: 'PRODUCT_MODIFY'} );
        } else {
            const index = this.findComboInList(orderItem);
            // promos should never be incremented
            if (index >= 0 && isPromo === false) {
                this._basket.Order.Combos[index].History = orderItem.History;
                this.incrementItem(this._basket.Order.Combos[index], 'PRODUCT_ADD');
                // update history for this item
            } else {
                this._basket.Order.Combos.push(orderItem);
                this.addToPersonalizationHistory(product, modifiers, orderItem.UUID);
                this._basketChangedStream.next( {item: orderItem, action: 'PRODUCT_ADD'} );
            }
        }

        this.updateTotals();
        this.revalidateItems();
    }

    isPromoItem(item: Button): boolean {
        if (item.History && item.History.type === 'promo') {
            return true;
        }
        return false;
    }

    addModifiersToItem(orderItem, modifiers): any {
        if (modifiers) {
            for (let i = 0; i < modifiers.length; i++) {
                const currentModifier = modifiers[i];
                if (currentModifier.length != undefined && currentModifier.length > 1) {
                    for (let j = 0; j < currentModifier.length; j++) {
                        const currentItem = currentModifier[j];
                        this.addModifierItems(currentItem, orderItem);
                    }
                } else {
                    this.addModifierItems(currentModifier, orderItem);
                }
            }
        }
        orderItem.Price = this.calculateItemTotal(orderItem);

        return orderItem;
    }

    updateItemWithModifiers(item: Button, modifiers: any, initialItem: Combo): void {
        let orderItem = this.generateItem(item, BasketItemType.biItem);
        orderItem = this.addModifiersToItem(orderItem, modifiers);
        const isPromo = this.isPromoItem(item);
        let foundIndex = this.findComboInList(orderItem); // exist another item in order list similar with this one

        // never increment promos
        if (isPromo === true) {
            foundIndex = -1;
        }

        const lUUID = initialItem.UUID;
        const index = this.findByUUID(lUUID);

        // if the current item has 1 quantity
        if (initialItem.Quantity == null || initialItem.Quantity <= 1) {
            if (foundIndex !== -1 ) {
                if (this._basket.Order.Combos[foundIndex].UUID == lUUID) {
                    // item already exists and is identical, no need to do anything
                    this._basketChangedStream.next( {item: this._basket.Order.Combos[foundIndex], action: 'PRODUCT_REMOVE'} );
                    this._basketChangedStream.next( {item: this._basket.Order.Combos[foundIndex], action: 'PRODUCT_ADD'} );
                } else {
                    // another item is identical, increment that one and remove this one
                    this._basketChangedStream.next( {item: this._basket.Order.Combos[index], action: 'PRODUCT_REMOVE'} );
                    this.incrementItem( this._basket.Order.Combos[foundIndex], 'PRODUCT_ADD');

                    this._basket.Order.Combos.splice(index, 1);
                }
            } else {
                // notify items is removed, (hack for analitycs)
                this._basketChangedStream.next( {item: this._basket.Order.Combos[index], action: 'PRODUCT_REMOVE'} );

                orderItem.UUID = lUUID;
                this._basket.Order.Combos.splice(index, 1, orderItem);
                this.addToPersonalizationHistory(item, modifiers, orderItem.UUID);

                // notify items is added, (hack for analitycs)
                this._basketChangedStream.next( {item: orderItem, action: 'PRODUCT_ADD'} );
            }
        } else {
            this.decrementItem(this._basket.Order.Combos[index]);
            if (foundIndex !== -1 ) {
                this.incrementItem(this._basket.Order.Combos[foundIndex], 'PRODUCT_ADD');
            } else {
                // this._basketChangedStream.next( {item: orderItem, action: 'PRODUCT_REMOVE'} );
                this._basket.Order.Combos.splice(index + 1, 0, orderItem);
                orderItem.Qty = 1;
                item.Quantity = 1;
                this.addToPersonalizationHistory(item, modifiers, orderItem.UUID);
                this._basketChangedStream.next( {item: orderItem, action: 'PRODUCT_ADD'} );
            }
        }

        orderItem.History = item.History;
        this._basketChangedStream.next( {item: orderItem, action: 'MODIFY'} );
        this.revalidateItems();
    }


    async incrementItem(item: Combo, source: string = 'INCREMENT'): Promise<void> {
        if (!this._basket.Order.Combos.contains(item)) {
            return;
        }

        item.Qty++;
        this.updatePersonnalizationHistoryItem(item);
        this._basketChangedStream.next( {item: item, action: source} );
    }

    @Hookable(HooksIdentifiers.DECREMENT_ITEM_IN_BASKET)
    async decrementItem(item: Combo): Promise<void> {
        if (!this._basket.Order.Combos.contains(item)) {
            return;
        }

        if (item.Qty > 1) {
            item.Qty--;
            this.updatePersonnalizationHistoryItem(item);
            this._basketChangedStream.next( {item: item, action: 'DECREMENT'} );
        } else {
            this.removeItem(item);
        }
        this.revalidateItems();
    }

    @Hookable(HooksIdentifiers.REMOVE_ITEM_FROM_BASKET)
    async removeItem(item: Combo) {
        if (!this._basket.Order.Combos.contains(item)) {
            return;
        }

        this._basket.Order.Combos.remove(item);
        this._basketChangedStream.next( {item: item, action: 'PRODUCT_REMOVE'} );

        // only revalidate if removed item is not a promo
        if (item.History) {
            if ( item.History.type != 'promo') {
                this.revalidateItems();
            }
        } else {
            this.revalidateItems();
        }
    }

    public get onSetServiceType(): Observable<'in' | 'out'> {
        return this._setServiceTypeStream.asObservable();
    }

    @Hookable(HooksIdentifiers.SET_SERVICE_TYPE)
    async setServiceType(serviceType: 'in' | 'out'): Promise<void> {
        if (!this._orderInProgress) {
            this.startOrder();
        }

        Log.info('Setting service type: {0}', serviceType);
        this._serviceType = serviceType;
        this._setServiceTypeStream.next(serviceType);
    }

    public serviceType(): 'in' | 'out' {
        return this._serviceType;
    }

    public get onStartOrder(): Observable<void> {
        return this._startOrderStream.asObservable();
    }

    @Hookable(HooksIdentifiers.START_ORDER)
    async startOrder(): Promise<void> {
        Log.info('Starting new order...');
        this._orderInProgress = true;
        this.createBasket();

        this._startOrderStream.next();
    }

    public get onCancelOrder(): Observable<OrderCloseCause> {
        return this._cancelOrderStream.asObservable();
    }

    @Hookable(HooksIdentifiers.CANCEL_ORDER)
    async cancelOrder(cancelCause: OrderCloseCause =  OrderCloseCause.CancelOrder): Promise<void> {
        Log.info('Cancelling current order...');
        this._orderInProgress = false;
        this._cancelOrderStream.next(cancelCause);
    }

    public get onCompleteOrder(): Observable<void> {
        return this._completeOrderStream.asObservable();
    }

    @Hookable(HooksIdentifiers.CLOSE_ORDER)
    async completeOrder(): Promise<void> {
        Log.info('Completing current order...');
        this._orderInProgress = false;
        this._completeOrderStream.next();
    }

    public get onValidateOrder(): Observable<void> {
        return this._validateOrderStream.asObservable();
    }

    // @Hookable(HooksIdentifiers.VALIDATE_ORDER)
    validateOrder() {
        this._validateOrderStream.next();
    }

    public get onConfirmOrder(): Observable<void> {
        return this._confirmOrderStream.asObservable();
    }

    async confirmOrder(): Promise<void> {
        this._confirmOrderStream.next();
    }

    public get onContinueOrder(): Observable<void> {
        return this._continueOrderStream.asObservable();
    }

    async continueOrder(): Promise<void> {
        this._continueOrderStream.next();
    }

    addToPersonalizationHistory(item: Button, modifiers: any, UUID: String): void {
        if (this._personalizationHistory == null) {
            this._personalizationHistory = [];
        }
        const backup = JSON.parse( JSON.stringify(item) );
        backup.UUID = UUID;

        // delete the item with the same UUID if exists
        this.deleteItemFromPersonnalizationHistory(UUID);
        this._personalizationHistory.push(backup);
    }

    updatePersonnalizationHistoryItem(item) {
        const historyItem = this.getItemFromPersonalisationHistory(item.UUID);
        historyItem.Quantity = item.Qty;
    }

    deleteItemFromPersonnalizationHistory(UUID) {
        if (this._personalizationHistory == null) {
            return;
        }
        for (let i = (this._personalizationHistory.length - 1) ; i >= 0; i--) {
            if ( this._personalizationHistory[i].UUID === UUID ) {
                this._personalizationHistory.splice(i, 1);
            }
        }
    }

    getItemFromPersonalisationHistory(UUID: String): any {
        if (this._personalizationHistory == null) {
            return;
        }
        for (let i = 0; i < this._personalizationHistory.length; i++) {
            if ( this._personalizationHistory[i].UUID === UUID ) {
                return this._personalizationHistory[i];
            }
        }

        return null;
    }

    public updateTotals(): void {
        const orderTotal = this._basket.Order.Combos.reduce((total, _) => total + (_.Price * _.Qty ), 0);
        this._orderTotal = orderTotal;
    }

    public calculateItemTotal(item: Combo): number {
        if (Number(item.Price) <= 0 || item.Price === undefined) {
            item.Price = 0;
        }

        if (Number(item.Qty) <= 0 || item.Qty === undefined) {
            item.Qty = 0;
        }

        let priceTouse = Number(item.Price);
        if (priceTouse <= 0 && Number(item.ComboPriceStr) > 0) {
            priceTouse = Number(item.ComboPriceStr) / 100;
        }

        // let total = item.Qty * priceTouse;
        let total = item.BasketElemType === BasketItemType.biItem ||
                    item.BasketElemType === BasketItemType.biCombo ? priceTouse : item.Qty * priceTouse;

        if (item.Combos) {
            for (let i = 0; i < item.Combos.length; i++) {
                total += this.calculateItemTotal(item.Combos[i]);
            }
        }

        return total;
    }

    registerProductsCatalog(content: ContentService) {
        this.content = content;
    }

    generateItem(item: any, itemType: string): Combo {

        const comboItem = <Combo>{};
        comboItem.Qty = item.Quantity >= 0 ? item.Quantity : 1;
        comboItem.Visibility = item.Visibility;
        comboItem.ComboPriceStr = this.localizationService.formatCurrency(item.Price);
        comboItem.LName = item.Caption;
        comboItem.DefaultQuantity = 1;
        comboItem.Price = item.Price || 0;
        comboItem.ComboPrice = item.Price;
        comboItem.Image = item.Picture;
        comboItem.UnitPriceStr = this.localizationService.formatCurrency(item.Price);
        comboItem.IsValid = true;
        comboItem.ItemID = item.Link;
        comboItem.Combos = [];
        comboItem.UUID = ConfigurationService.generateUUID();

        // set this UUID to be able to find later item to baksetItem
        item.RefUUID = comboItem.UUID;
        comboItem.SName = item.Caption;
        comboItem.BasketElemType = itemType;
        comboItem.BItem = item.BItem;
        comboItem.PrefixName = item.PrefixName;
        if (item.History) {
            comboItem.History = item.History;
        } else {
            comboItem.History = {type: 'normal'};
        }

        // use the name and image in the product definition if it exists
        // not the the button definition as that may be innapropriate for the basket
        const product = this.content ? this.content.findProductById( item.Link ) : null;
        if (product) {
            if (product.Caption && product.Caption.length > 1) {
                comboItem.LName = product.Caption;
            }
            if ( product.Picture ) {
                comboItem.Image = product.Picture;
            }
        }

        if (comboItem.Visibility == null) {
            comboItem.Visibility = 0;
        }

        if (item.AllowQtyZero) {
            comboItem.AllowQtyZero = true;
        } else {
            // if quantity is not allowed to be 0, we need to force it to 1
            if (comboItem.Qty == 0) {
                comboItem.Qty = 1;
            }
        }

        if (item.PickupModifier) {
            comboItem.PickupModifier = true;
        }
        if (item.IceModifier) {
            comboItem.IceModifier = true;
        }
        if (item.AddedFromMultiSelectPopupPage) {
            comboItem.AddedFromMultiSelectPopupPage = true;
        }

        if ( item.ModifiersPage ) {
            const activeModif = this.countNonSpecialModifiers(item);
            if (activeModif > 0) {
                comboItem.Modifiable = true;
            }
        }

        if (item.ComboPage) {
            comboItem.Modifiable = true;
        }

        if ( item.CombosPage ) {
            comboItem.Modifiable = true;
        }
        return comboItem;
    }

    private countNonSpecialModifiers(item): number {
        let count = 0;
        // tslint:disable-next-line: max-line-length
        if (item && item['ModifiersPage'] && item['ModifiersPage']['Modifiers'] && item['ModifiersPage']['Modifiers']) {

            for (let i = 0; i < item['ModifiersPage']['Modifiers'].length; i++) {
                const modifier = item['ModifiersPage']['Modifiers'][i];
                if ( modifier.PageInfo.ModifierTemplate != 'pickup' && modifier.PageInfo.ModifierTemplate != 'HiddenChild') {
                    count ++;
                }
            }
        }
        return count;
    }

    addModifierItems(currentItem, orderItem) {
        // cfe: added 'currentItem.AllowQtyZero' as Pickup Modifier should be allowed with Quantity == 0 (check DOT19-191)
        if (currentItem['Qty'] || currentItem['Quantity'] || currentItem['AllowQtyZero']) {
            const grillItem = this.generateItem(currentItem, BasketItemType.biModifier);
            if (currentItem.ModifiersPage && currentItem.ModifiersPage.Modifiers ) {

                for (let i = 0; i < currentItem.ModifiersPage.Modifiers.length; i++) {
                    const currentModifier = currentItem.ModifiersPage.Modifiers[i];
                    for (let j = 0; j < currentModifier.Buttons.length; j++) {
                        const subItem = currentModifier.Buttons[j];
                        this.addModifierItems(subItem, grillItem);
                    }
                }
            }
            orderItem.Combos.push(grillItem);
        }
    }

    addItemWithModifiers(product: any, modifiers: any): void {
        const orderItem = this.generateItem(product, BasketItemType.biItem);

        if (modifiers) {
            for (let i = 0; i < modifiers.length; i++) {
                const currentModifier = modifiers[i];
                if (currentModifier.length != undefined && currentModifier.length > 1) {
                    for (let j = 0; j < currentModifier.length; j++) {
                        const currentItem = currentModifier[j];
                        this.addModifierItems(currentItem, orderItem);
                    }
                } else {
                    this.addModifierItems(currentModifier, orderItem);
                }
            }
        }

        const index = this.findComboInList(orderItem); // exist another item in order list similar with this one
        if (index !== -1) {
            this._basket.Order.Combos[index].Qty++;
        } else {
            orderItem.Price = this.calculateItemTotal(orderItem);
            this._basket.Order.Combos.push(orderItem);
        }
        this.updateTotals();
        this._basketChangedStream.next( {item: orderItem, action: 'MODIFY'} );
    }


    private findByUUID(uuid: string): number {
        return this._basket.Order.Combos.findIndex(_ => _.UUID === uuid);
    }

    retrItemVisibility(aValue: number): any {
        const aVISIBILITY_DEFAULT = 0;
        const aVISIBILITY_MENUCONFIRM = 1;
        const aVISIBILITY_BASKET = 2;
        const aVISIBILITY_CODVIEW = 4;
        const aVISIBILITY_KVS = 8;
        const aVISIBILITY_PRINTER = 16;
        const aVISIBILITY_POS = 32;
        const aVISIBILITY_REMPRINTER = 64;
        const aVISIBILITY_NONE = 127;

        const aVISIBILITY_PVS = 256;

        const aVisibility: any = {
            nPacked: 0,
            bVisibleInBasket: false,
            bVisibleInMenuConfirmation: false,
            bVisibleInCODView: false,
            bVisibleInKVS: false,
            bVisibleInPrinter: false,
            bVisibleInPOS: false,
            bVisibleInRemPrinter: false,
            bVisibleInPVS: false
        };
        aVisibility.nPacked = aValue;
        aVisibility.bVisibleInBasket = ((aValue & aVISIBILITY_BASKET) === 0);
        aVisibility.bVisibleInMenuConfirmation = ((aValue & aVISIBILITY_MENUCONFIRM) === 0);
        aVisibility.bVisibleInCODView = ((aValue & aVISIBILITY_CODVIEW) === 0);
        aVisibility.bVisibleInKVS = ((aValue & aVISIBILITY_KVS) === 0);
        aVisibility.bVisibleInPrinter = ((aValue & aVISIBILITY_PRINTER) === 0);
        aVisibility.bVisibleInPOS = ((aValue & aVISIBILITY_POS) === 0);
        aVisibility.bVisibleInRemPrinter = ((aValue & aVISIBILITY_REMPRINTER) === 0);
        aVisibility.bVisibleInPVS = ((aValue & aVISIBILITY_PVS) === 0);

        return aVisibility;
    }

    findComboInList(comboItem: Combo): number {
        let result = -1;

        for (let i = 0; i < this._basket.Order.Combos.length; i++) {

            if (comboItem.ItemID !== this._basket.Order.Combos[i].ItemID ||
                comboItem.PriceLevel !== this._basket.Order.Combos[i].PriceLevel) {
                Log.debug('different ItemId or different PromoRef');
                continue;
            }

            if (comboItem.PrefixID !== this._basket.Order.Combos[i].PrefixID) {
                continue;
            }

            if (!comboItem.hasOwnProperty('Price')) {
                comboItem.Price = 0;
            }
            if (!this._basket.Order.Combos[i].hasOwnProperty('Price')) {
                this._basket.Order.Combos[i].Price = 0;
            }
            if (comboItem.Price != this._basket.Order.Combos[i].Price) {
                continue;
            }

            if (this.equalCombos(comboItem, this._basket.Order.Combos[i]) === true) {
                result = i;
                break;
            }
        }
        return result;
    }

    equalCombos(combo1: Combo, combo2: Combo): boolean {

        if (combo1.ComboGroup !== combo2.ComboGroup) {
            Log.debug('different ComboGroup');
            return false;
        }
        if (combo1.PromoRef !== combo2.PromoRef) {
            Log.debug('different PromoRef');
            return false;
        }

        if (combo1.hasOwnProperty('Combos') && !combo2.hasOwnProperty('Combos') ||
            combo2.hasOwnProperty('Combos') && !combo1.hasOwnProperty('Combos')) {
            return false;
        } else if (combo1.hasOwnProperty('Combos') && combo2.hasOwnProperty('Combos')) {

            if (combo1.Combos.length !== combo2.Combos.length) {
                Log.debug('different length for combos');
                return false;
            }

            for (let i = 0; i < combo1.Combos.length; i++) {
                if (combo1.Combos[i].ItemID !== combo2.Combos[i].ItemID || combo1.Combos[i].PriceLevel !== combo2.Combos[i].PriceLevel) {
                    Log.debug('different PromoRef');
                    return false;
                }

                if (combo1.Combos[i].PrefixID !== combo2.Combos[i].PrefixID) {
                    return false;
                }

                if (!combo1.Combos[i].hasOwnProperty('Price')) {
                    combo1.Combos[i].Price = 0;
                }
                if (!combo2.Combos[i].hasOwnProperty('Price')) {
                    combo2.Combos[i].Price = 0;
                }
                if (combo1.Combos[i].Price != combo2.Combos[i].Price) {
                    return false;
                }

                if (combo1.Combos[i].Qty != combo2.Combos[i].Qty) {
                    return false;
                }

                if (this.equalCombos(combo1.Combos[i], combo2.Combos[i]) === false) {
                    return false;
                }
            }
        }
        return true;
    }

    mergeDuplicateModifiers(combos: Array<any>): void {
        // this function relies on action script references, it modifies the object directly and that is why it does not return anything
        if (combos == null || combos.length < 1) {
            return;
        }

        const uniqueIds = {};

        for (let i = (combos.length - 1); i >= 0; i--) {
            const crtItem = combos[i];
            if (crtItem.Combos && crtItem.Combos.length > 0) {
                // if it has children do not merge, but the children can be merged
                this.mergeDuplicateModifiers(crtItem.Combos);
            } else if (crtItem.ComboGroup && crtItem.ComboGroup >= 0) {

            } else if (crtItem.BasketElemType == BasketItemType.biItem) {
                // if it is a root element do not merge
            } else {
                // if it does not have children we can start merging
                // first check if exists in uniqes array,
                // use a combo of item id and promo type to check uniqueness
                const uid = crtItem.ItemID;

                if (uniqueIds[uid] == null) {
                    // if its just one item for now, olny provide reference to it
                    uniqueIds[uid] = crtItem;
                } else {
                    // if the item already exists, update the reference's quantity
                    const reference = uniqueIds[uid];
                    if (!reference.Quantity) {
                        reference.Quantity = 0;
                    }
                    reference.Quantity++;
                    // now remove the crt item
                    combos.splice(i, 1);
                }
            }
        }

        // iterate through all the unique refreences and update the label base on quantity
        for (const k in uniqueIds) {
            if (uniqueIds[k] && uniqueIds[k].Quantity > 1) {
                uniqueIds[k].LName = uniqueIds[k].Quantity + ' ' + uniqueIds[k].LName;
            }
        }
    }

    deleteInvisibleItems(combos: Array<any>): Array<any> {
        if (combos == null || combos.length < 1) {
            return [];
        }
        for (let i = (combos.length - 1); i >= 0; i--) {
            const crtItem = combos[i];
            const lVisibility = this.retrItemVisibility(crtItem.Visibility);
            if ((lVisibility as any).bVisibleInBasket == true) {
                if (crtItem.Combos && crtItem.Combos.length > 0) {
                    // if it has children do not merge, but the children can be merged
                    this.deleteInvisibleItems(crtItem.Combos);
                    // if it is a root element do not merge
                }
            } else {
                combos.splice(i, 1);
            }
        }
        return combos;
    }
}
