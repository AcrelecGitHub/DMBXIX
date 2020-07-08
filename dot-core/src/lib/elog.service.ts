import { Injectable } from '@angular/core';

import { ConfigurationService } from './configuration.service';
import { Combo } from './models';
import { BasketService } from './basket.service';
import { Log } from './logger/log';
import { LocalizationService } from './localization.service';
import { InternationalizationService } from './internationalization.service';
import { AtpFilesSystemService } from './atp-files-system.service';
import { HttpClient } from '@angular/common/http';
import { MBirdSdk } from '../externals/mbird-sdk';
import { PromoStatus, BasketItemType } from './enums';

@Injectable({
    providedIn: 'root'
})
export class ElogService {

    private deviceTypeNames: Array<string> = [];
    private _tranXML: XMLDocument;
    private orderElement: Element;

    constructor(private localizationService: LocalizationService,
        private internationalizationService: InternationalizationService,
        public configurationService: ConfigurationService,
        private basketService: BasketService,
        private atpFilesSystemService: AtpFilesSystemService,
        private http: HttpClient) {
        this.deviceTypeNames[0] = 'POS';
        this.deviceTypeNames[1] = 'PAY';
        this.deviceTypeNames[2] = 'PRN';
        this.deviceTypeNames[3] = 'SCN';
        this.deviceTypeNames[4] = 'KVS';
        this.deviceTypeNames[5] = 'PVS';
        this.deviceTypeNames[6] = 'FTUS';
        this.deviceTypeNames[7] = 'RPR';
        this.deviceTypeNames[8] = 'RCL';
    }
    private item: Element;

    get tranXML(): any {
        return this._tranXML;
    }
    set tranXML(newTRanXML: any) {
        this._tranXML = newTRanXML;
    }


    saveTransactionHeader() {
        this._tranXML = document.implementation.createDocument('', '', null);
        this.orderElement = this._tranXML.createElement('Transaction');
        // ROOT
        this.orderElement.setAttribute('Ver', this.basketService.basket.Order.OrderVer);
        this.orderElement.setAttribute('SIM', this.basketService.basket.Order.OrderSIM);
        // this.orderElement.setAttribute('Kiosk', this.basketService.basket.Order.OrderKiosk);
        this.orderElement.setAttribute('Kiosk', this.configurationService.kioskId);
        this.orderElement.setAttribute('Day', this.localizationService.formatDate(this.basketService.basket.Order.BusinessDay, 'yyMMdd'));
        this.orderElement.setAttribute('ID', this.basketService.basket.Order.OrderNrStr);
        this.orderElement.setAttribute('ExtID', this.basketService.basket.Order.OrderExtID);
        this.orderElement.setAttribute('RefInt', this.basketService.basket.Order.OrderRefInt);
        this.orderElement.setAttribute('Lang', this.internationalizationService.currentLanguage.code);
        this.orderElement.setAttribute('PreOrder', <any>this.basketService.basket.Order.PreOrder);
        this.orderElement.setAttribute('Closed', <any>this.basketService.basket.Order.Closed);
        this.orderElement.setAttribute('StoreID', this.basketService.basket.Order.OrderStoreNo);
        this.orderElement.setAttribute('StoreName', this.basketService.basket.Order.OrderStoreName);
        this.orderElement.setAttribute('BrandID', this.basketService.basket.Order.BrandID);

        let lJSON: any;
        try {
            lJSON = JSON.parse(this.basketService.basket.Order.CustomInfo);
        } catch (e) {
            Log.debug(e instanceof SyntaxError); // true
            Log.debug(e.message);
        }
        if (lJSON) {
            if (lJSON.hasownProperty('ElogXMLOrderInfo') && (lJSON.ElogXMLOrderInfo) && (lJSON.ElogXMLOrderInfo !== '')) {
                try {
                    const lCustomInfoELog = document.implementation.createDocument('', '', null);
                    lCustomInfoELog.documentElement.appendChild(lJSON.S['ElogXMLOrderInfo']);
                    if (lCustomInfoELog.documentElement) {
                        this.orderElement.appendChild(lCustomInfoELog.documentElement.cloneNode(true));
                    }
                } catch (e) {
                    // No content response..
                    Log.debug('> Error on creating xml ', e.name);
                }
            }
        }

        // STAT
        const orderStatus = this._tranXML.createElement('Stat');
        orderStatus.setAttribute('EndStatus', <any>this.basketService.basket.Order.EndStatus);
        orderStatus.setAttribute('POSStatus', <any>this.basketService.basket.Order.POSStatus);
        orderStatus.setAttribute('POSDetail', <any>this.basketService.basket.Order.POSDetails);

        try {
            lJSON = JSON.parse(this.basketService.basket.Order.POSDetails_txt);
        } catch (e) {
            Log.debug(e instanceof SyntaxError); // true
            Log.debug(e.message);
        }
        if (lJSON) {
            orderStatus.setAttribute('PosDetail_txt', lJSON.S['ReturnMessage']);
        } else {
            orderStatus.setAttribute('PosDetail_txt', this.basketService.basket.Order.POSDetails_txt);
        }

        orderStatus.setAttribute('POSTovStatus', <any>this.basketService.basket.Order.POSTovStatus);
        orderStatus.setAttribute('POSTovDetail', <any>this.basketService.basket.Order.POSTovDetails);

        try {
            lJSON = JSON.parse(this.basketService.basket.Order.POSTovDetails_txt);
        } catch (e) {
            Log.debug(e instanceof SyntaxError); // true
            Log.debug(e.message);
        }
        if (lJSON) {
            orderStatus.setAttribute('POSTovDetail_txt', lJSON.S['ReturnMessage']);
        } else {
            orderStatus.setAttribute('POSTovDetail_txt', this.basketService.basket.Order.POSTovDetails_txt);
        }

        orderStatus.setAttribute('PAYStatus', <any>this.basketService.basket.Order.PAYStatus);
        orderStatus.setAttribute('PAYDetail', <any>this.basketService.basket.Order.PAYDetails);
        orderStatus.setAttribute('PAYDetail_txt', this.basketService.basket.Order.PAYDetails_txt);

        for (let i = 0; i < this.basketService.basket.Order.Operations.length; i++) {
            const operationStatus = this._tranXML.createElement(this.basketService.basket.Order.Operations[i].DeviceType);
            operationStatus.setAttribute('Time', this.basketService.basket.Order.Operations[i].Time);
            operationStatus.setAttribute('ID', this.basketService.basket.Order.Operations[i].ID);
            operationStatus.setAttribute('Name', this.basketService.basket.Order.Operations[i].Name);
            operationStatus.setAttribute('Operation', this.basketService.basket.Order.Operations[i].Operation);
            operationStatus.setAttribute('Status', this.basketService.basket.Order.Operations[i].Status);
            operationStatus.setAttribute('Code', this.basketService.basket.Order.Operations[i].Code);

            orderStatus.appendChild(operationStatus);
        }

        // TIMINGS
        const orderTimes = this._tranXML.createElement('Timing');
        /*orderTimes.setAttribute('T_InOut', this.basketService.basket.Order.OrderStart);
        orderTimes.setAttribute('T_FirstItem', this.basketService.basket.Order.FirstItem);
        orderTimes.setAttribute('T_StartPay', this.basketService.basket.Order.PaymentStart);
        orderTimes.setAttribute('T_EndPay', this.basketService.basket.Order.PaymentDuration);
        orderTimes.setAttribute('T_POS', this.basketService.basket.Order.IntegrationStart);
        orderTimes.setAttribute('T_EndPOS', this.basketService.basket.Order.IntegrationDuration);
        orderTimes.setAttribute('T_EndOrder', this.basketService.basket.Order.OrderEnd);*/

        orderTimes.setAttribute('T_InOut', this.basketService.basket.Order.OrderStart);
        const t = new Date();
        t.setSeconds(t.getSeconds() - 5);
        orderTimes.setAttribute('T_FirstItem', this.localizationService.formatDate(t, 'hhmmss'));
        t.setSeconds(t.getSeconds() + 1);
        orderTimes.setAttribute('T_StartPay', this.localizationService.formatDate(t, 'hhmmss'));
        t.setSeconds(t.getSeconds() + 1);
        orderTimes.setAttribute('T_EndPay', this.localizationService.formatDate(t, 'hhmmss'));
        t.setSeconds(t.getSeconds() + 1);
        orderTimes.setAttribute('T_POS', this.localizationService.formatDate(t, 'hhmmss'));
        t.setSeconds(t.getSeconds() + 1);
        orderTimes.setAttribute('T_EndPOS', this.localizationService.formatDate(t, 'hhmmss'));
        t.setSeconds(t.getSeconds() + 1);
        orderTimes.setAttribute('T_EndOrder', this.localizationService.formatDate(t, 'hhmmss'));


        orderTimes.setAttribute('BCString', this.basketService.basket.Order.BCSecurity);

        // TABLE INFO
        const tableInfo = this._tranXML.createElement('Service');
        // orderTimes.setAttribute('Location', <any>this.basketService.basket.Order.OrderElogLocation);
        tableInfo.setAttribute('Location', this.basketService.serviceType() === 'in' ? '0' : '1');
        tableInfo.setAttribute('Table', <any>this.basketService.basket.Order.TableService);
        // tableInfo.setAttribute('Delivery', this.basketService.basket.Order.DeliveryPointName);

        // AMOUNTS root node
        const amounts = this._tranXML.createElement('Amounts');
        amounts.setAttribute('Tax', <any>this.basketService.basket.Order.TotalTAXInteger);
        amounts.setAttribute('SubTotal', <any>this.basketService.basket.Order.TotalPriceInteger);
        amounts.setAttribute('Paid', <any>this.basketService.basket.Order.GrandTotalInteger);

        // TENDERed items
        const tender = this._tranXML.createElement('Tender');

        for (let i = 0; i < this.basketService.basket.Order.Amounts.OrderTenderItems.length; i++) {

            const tenderItem = this._tranXML.createElement('TenderItem');
            tenderItem.setAttribute('ID', this.basketService.basket.Order.Amounts.OrderTenderItems[i].PaymentMediaId);
            tenderItem.setAttribute('Type', this.basketService.basket.Order.Amounts.OrderTenderItems[i].tiType);
            tenderItem.setAttribute('Amount', this.basketService.basket.Order.Amounts.OrderTenderItems[i].PaidAmount);
            tenderItem.setAttribute('Paid', this.basketService.basket.Order.Amounts.OrderTenderItems[i].Paid);
            tenderItem.setAttribute('Details', this.basketService.basket.Order.Amounts.OrderTenderItems[i].TenderItemDetails);
            tenderItem.setAttribute('CustomInfo', this.basketService.basket.Order.Amounts.OrderTenderItems[i].CustomInfo);
            tender.appendChild(tenderItem);
        }
        amounts.appendChild(tender);

        // Service Charge(s)
        const service = this._tranXML.createElement('Service');
        for (let i = 0; i < this.basketService.basket.Order.SvcCharge.OrderTenderItems.length; i++) {

            const svcCharge = this._tranXML.createElement('SvcCharge');
            svcCharge.setAttribute('ID', this.basketService.basket.Order.SvcCharge.OrderTenderItems[i].PaymentMediaId);
            svcCharge.setAttribute('Type', this.basketService.basket.Order.SvcCharge.OrderTenderItems[i].TIType);
            svcCharge.setAttribute('Amount', this.basketService.basket.Order.SvcCharge.OrderTenderItems[i].PaidAmount);
            svcCharge.setAttribute('Paid', this.basketService.basket.Order.SvcCharge.OrderTenderItems[i].Paid);
            svcCharge.setAttribute('Details', this.basketService.basket.Order.SvcCharge.OrderTenderItems[i].TenderItemDetails);
            svcCharge.setAttribute('CustomInfo', this.basketService.basket.Order.SvcCharge.OrderTenderItems[i].CustomInfo);
            service.appendChild(svcCharge);
        }
        amounts.appendChild(service);

        // VAT
        const vats = this._tranXML.createElement('VATS');
        for (let i = 0; i < this.basketService.basket.Order.VATInfo.length; i++) {
            const vatNode = this._tranXML.createElement('VAT');
            vatNode.setAttribute('ID', this.basketService.basket.Order.VATInfo[i].ID);
            vatNode.setAttribute('AMOUNT', this.basketService.basket.Order.VATInfo[i].VAT);
            vatNode.setAttribute('NET', this.basketService.basket.Order.VATInfo[i].Price);
            vats.appendChild(vatNode);
        }
        amounts.appendChild(vats);

        const cVarsNode = this._tranXML.createElement('CVARS');
        this.orderElement.appendChild(orderStatus);
        this.orderElement.appendChild(orderTimes);
        this.orderElement.appendChild(tableInfo);
        this.orderElement.appendChild(amounts);
        this.orderElement.appendChild(cVarsNode);

        const receiptNode = this._tranXML.createElement('ReceiptText');
        receiptNode.setAttribute('Value', this.basketService.basket.Order.ReceiptText);
        if (receiptNode) {
            this.orderElement.appendChild(receiptNode);
        }
    }

    saveFeature(pNode: Element, cmpItem: Combo) {
        try {
            if (cmpItem.Qty && cmpItem.Qty > 0 ) {
                for (let t = 0; t < cmpItem.Qty; t++ ) {
                    const node = this._tranXML.createElement('Feature');
                    node.setAttribute('ID', cmpItem.ItemID);
                    node.setAttribute('RName', cmpItem.LName);
                    node.setAttribute('FeatureType', cmpItem.FeatureType);
                    node.setAttribute('Price', <any>cmpItem.UnitPrice);
                    node.setAttribute('Vis', <any>cmpItem.Visibility);
                    node.setAttribute('Qty', '1');
                    node.setAttribute('Quantity', '1');
                    node.setAttribute('FeatureGroupID', cmpItem.FeatureID);
                    node.setAttribute('ID', cmpItem.ItemID);
                    if (cmpItem.PrefixID !== '') {
                        node.setAttribute('Prefix', cmpItem.PrefixID);
                    }
                    if (cmpItem.PriceLevel >= 0) {
                        node.setAttribute('PLevel', <any>cmpItem.PriceLevel);
                    }
                    if (cmpItem.VatID > 0) {
                        node.setAttribute('VatID', <any>cmpItem.VatID);
                        node.setAttribute('PLevel', <any>cmpItem.VatAmount);
                    }
                    node.setAttribute('GroupType', cmpItem.GroupType);
                    node.setAttribute('DefaultQuantity', <any>cmpItem.DefaultQuantity);
                    for (let i = 0; i < cmpItem.Combos.length; i++) {
                        this.saveFeature(node, cmpItem.Combos[i]);
                    }
                    pNode.appendChild(node);
                }
            } else {
                Log.debug('Feature not added for item {0}, Qty property is 0', cmpItem.ItemID);
            }
        } catch {
            Log.debug('feature is not added');
        }
    }

    saveOrder(checkValidity: boolean) {
        let canAdd: Boolean;
        const orderDetail = this._tranXML.createElement('Order');
        this.orderElement.appendChild(orderDetail);
        for (let i = 0; i < this.basketService.basket.Order.Combos.length; i++) {
            const aCombo = this.basketService.basket.Order.Combos[i];
            Log.debug('validity for aCombo: ' + aCombo.IsValid);
            if (checkValidity) {
                canAdd = aCombo.IsValid;
            } else {
                canAdd = true;
            }
            if (canAdd) {
                const item = this._tranXML.createElement('DOTElement');
                switch (aCombo.BasketElemType) {
                    case 'combo': {
                        this.addMenu(item, aCombo, checkValidity);
                        break;
                    }
                    case 'item': {
                        this.addSingle(item, aCombo, checkValidity);
                        break;
                    }
                    case 'comboItem': {
                        break;
                    }
                    case 'addOn': {
                        break;
                    }
                    case 'modifier': {
                        break;
                    }
                }
                orderDetail.appendChild(item);
            }
        }

        this.orderElement.appendChild(orderDetail);
    }

    addSingle(item: Element, aCombo: Combo, checkValidity: boolean) {
        item.setAttribute('Type', 'Single');
        item.setAttribute('ID', aCombo.ItemID);
        item.setAttribute('RName', aCombo.LName);
        item.setAttribute('Qty', <any>aCombo.Qty);
        item.setAttribute('Promo', 'Single');
        item.setAttribute('UUID', aCombo.UUID);
        if (aCombo.PromoRef !== PromoStatus.noPromoRef) {
            item.setAttribute('Promo', '1');
        } else {
            item.setAttribute('Promo', '0');
        }
        item.setAttribute('Price', <any>aCombo.Price);
        item.setAttribute('Vis', <any>aCombo.Visibility);
        item.setAttribute('Grp', <any>aCombo.ComboGroup);
        if (aCombo.AuxID !== '') {
            item.setAttribute('Extra', aCombo.AuxID);
        }
        if (aCombo.PriceLevel >= 0) {
            item.setAttribute('PLevel', <any>aCombo.PriceLevel);
        }
        if (aCombo.VatID > 0) {
            item.setAttribute('VatID', <any>aCombo.VatID);
            item.setAttribute('VatAmount', <any>aCombo.VatAmount);
        }
        item.setAttribute('GroupType', <any>aCombo.GroupType);
        item.setAttribute('DefaultQuantity', <any>aCombo.DefaultQuantity);
        let canAdd = false;
        for (let i = 0; i < aCombo.Combos.length; i++) {
            const cb = aCombo.Combos[i];
            if (checkValidity) {
                canAdd = cb.IsValid;
            } else {
                canAdd = true;
            }
            if (canAdd) {
                if (cb.BasketElemType = BasketItemType.biModifier) {
                    this.saveFeature(item, cb);
                }
            }
        }
    }

    addMenuItem(pNode: Element, cbItem: Combo, checkValidity: boolean) {

        let mnItem: Element;
        if (cbItem.IsVirtual) {
            mnItem = this._tranXML.createElement('VirtualElement');
        } else {
            mnItem = this._tranXML.createElement('MenuElement');
        }
        if (cbItem.BasketElemType === BasketItemType.biAddon) {
            mnItem.setAttribute('Type', 'AddOn');
            mnItem.setAttribute('Extra', cbItem.AuxID); // all add-ons are extra
        } else {
            mnItem.setAttribute('Type', 'Component');
        }
        mnItem.setAttribute('ID', cbItem.ItemID);
        mnItem.setAttribute('RName', cbItem.LName);
        mnItem.setAttribute('Qty', <any>cbItem.Qty);
        mnItem.setAttribute('ComponentID', cbItem.ComponentID);
        mnItem.setAttribute('UUID', cbItem.UUID);
        mnItem.setAttribute('ID', cbItem.ItemID);
        mnItem.setAttribute('Price', <any>cbItem.UnitPrice);
        if (cbItem.Visibility) {
            mnItem.setAttribute('Vis', <any>cbItem.Visibility);
        }
        if (cbItem.PriceLevel >= 0) {
            mnItem.setAttribute('PLevel', <any>cbItem.PriceLevel);
        }
        if (cbItem.VatID > 0) {
            mnItem.setAttribute('VatID', <any>cbItem.VatID);
            mnItem.setAttribute('VatAmount', <any>cbItem.VatAmount);
        }
        mnItem.setAttribute('GroupType', cbItem.GroupType);
        mnItem.setAttribute('DefaultQuantity', <any>cbItem.DefaultQuantity);
        let canAdd: Boolean;
        for (let j = 0; j < cbItem.Combos.length; j++) {
            const cbFeats = cbItem.Combos[j];
            if (checkValidity) {
                canAdd = cbFeats.IsValid;
            } else {
                canAdd = true;
            }
            if (canAdd) {
                if (cbFeats.BasketElemType = BasketItemType.biModifier) {
                    this.saveFeature(mnItem, cbFeats);
                }
            }
        }
        pNode.appendChild(mnItem);
    }

    addMenu(item: Element, aCombo: Combo, checkValidity: boolean) {
        Log.debug('menu added: ', aCombo);
        item.setAttribute('Type', 'Menu');
        item.setAttribute('Size', <any>aCombo.BasketSubType);
        item.setAttribute('ID', aCombo.ItemID);
        item.setAttribute('RName', aCombo.LName);
        if (aCombo.PromoRef !== PromoStatus.noPromoRef) {
            item.setAttribute('Promo', '1');
        } else {
            item.setAttribute('Promo', '0');
        }
        item.setAttribute('Grp', <any>aCombo.ComboGroup);
        item.setAttribute('UUID', aCombo.UUID);

        let canAdd: Boolean;
        for (let i = 0; i < aCombo.Combos.length; i++) {
            if (checkValidity) {
                canAdd = aCombo.Combos[i].IsValid;
            } else {
                canAdd = true;
            }
            if (canAdd) {
                if (aCombo.Combos[i].BasketElemType === BasketItemType.biModifier) {
                    this.saveFeature(item, aCombo.Combos[i]);
                // tslint:disable-next-line: max-line-length
                } else if (aCombo.Combos[i].BasketElemType === BasketItemType.biComboItem || aCombo.Combos[i].BasketElemType === BasketItemType.biAddon) {
                    this.addMenuItem(item, aCombo.Combos[i], checkValidity);
                }
            }
        }
    }

    // saveOrderInText(checkValidity: boolean): XMLDocument {
    async saveOrderInText(checkValidity: boolean) {
        await this.saveTransactionHeader();
        await this.saveOrder(checkValidity);
        await this._tranXML.appendChild(this.orderElement);
        // return (this.tranXML);
    }

    async addFunctionTypeToTransaction(integrationFunction: number) {
        await this._tranXML.documentElement.setAttribute('FunctionNumber', String(integrationFunction));
    }

    async addOrderPosNumberToTransaction(orderPosNumber: number) {
        await this._tranXML.documentElement.setAttribute('ID', String(orderPosNumber));
    }

    addTenderInfo(tenderId: string) {
        let amountNode = null;
        const x = this.orderElement.childNodes;
        for (let i = 0; i < x.length; i++) {
            // Process only element nodes (type 1)
            if (x[i].nodeType !== 1 || x[i].nodeName !== 'Amounts') {
                continue;
            } else {
                amountNode = this.orderElement.childNodes[i];
                break;
            }
        }

        if (amountNode) {
            amountNode.setAttribute('SubTotal', this.basketService.orderTotal);
            amountNode.setAttribute('Paid', this.basketService.orderTotal);
            const y = amountNode.childNodes;
            let tenderNode = null;
            for (let i = 0; i < y.length; i++) {
                // Process only element nodes (type 1)
                if (y[i].nodeType !== 1 || y[i].nodeName !== 'Tender') {
                    continue;
                } else {
                    tenderNode = amountNode.childNodes[i];
                    break;
                }
            }
            if (tenderNode) {
                const tenderItem = this._tranXML.createElement('TenderItem');
                tenderItem.setAttribute('Amount', String(this.basketService.orderTotal));
                tenderItem.setAttribute('Paid', '1');
                tenderItem.setAttribute('ID', tenderId);
                tenderNode.appendChild(tenderItem);
            }
        }
    }

    async saveRefintToDisk(refInt: string) {
        await this.atpFilesSystemService.writeFile('shared\\refint.txt', refInt);
    }

    async deleteRefint() {
        await  this.atpFilesSystemService.deleteFile('shared\\refint.txt');
    }

    async setRefInt(): Promise<boolean> {
        let lRefInt: number;
        try {
            const url = this.configurationService.assetsPath + 'refint.txt?t=' + Date.now();
            const refIntResult = await this.http.get<number>(url).toPromise();
            Log.debug('read RefInt: ' + refIntResult);
            if (!refIntResult) {
                lRefInt = Math.round(1 + Math.random() * Math.pow(10, 6) - 2);
            } else {
                lRefInt = refIntResult + 1;
            }
        } catch {
            Log.debug('Could not recover orderReference number from file');
            lRefInt =  Math.round(1 + Math.random() * Math.pow(10, 6) - 2);
        }
        if (!lRefInt) {
            lRefInt = Math.round(1 + Math.random() * Math.pow(10, 6) - 2); // Max of 6 digits
        }
        if (lRefInt >= Math.pow(10, 6) - 1) {
            lRefInt = 1;
        }

        const sRefInt = '' + lRefInt;
        const pad = '000000';
        this.basketService.basket.Order.OrderRefInt = pad.substring(0, 6 - sRefInt.length) + sRefInt;
        // this.basketService.basket.Order.OrderRefInt = String(lRefInt);

        return true;
    }

    async processRefInt() {
        if (MBirdSdk.isConnected()) {
            await this.setRefInt();
            try {
                await this.deleteRefint();
            } catch (e) {
                Log.warn('deleteRefint() Error = {0}', e);
            }
            try {
                await this.saveRefintToDisk(this.basketService.basket.Order.OrderRefInt);
            } catch (e) {
                Log.warn('saveRefintToDisk() Error = {0}', e);
            }
        }
    }
}
