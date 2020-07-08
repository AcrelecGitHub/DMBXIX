import { Injectable } from '@angular/core';

import { MBirdSdk } from '../externals/mbird-sdk';
import { Log } from './logger/log';
import { BasketService } from './basket.service';
import { InternationalizationService } from './internationalization.service';
import { OrderCheckoutService } from './order-checkout.service';
import { ConfigurationService } from './configuration.service';
import { HooksIdentifiers } from './hook-manager/hooks-identifiers';
import { Hookable } from './decorators/hookable.decorator';

@Injectable({
    providedIn: 'root'
})
export class PrintService {

    private image = '<@Image>';
    private imageEnd = '<@ImageEnd>';
    private centerOn = '<@CenterOn>';
    private centerOff = '<@CenterOff>';
    private magnification2 = '<@Magnification2>';
    private magnificationOff = '<@MagnificationOff>';
    private partialCut = '<@PartialCut>';
    private payReceipt = '<@PaymentCustomerReceipt>';
    private defReceiptWidth = 40;
    private maxCharsPerRow: number;

    constructor(private configurationService: ConfigurationService,
            private basketService: BasketService,
            private internationalizationService: InternationalizationService,
            private orderCheckoutService: OrderCheckoutService) { }

    printTicket(ticketText: string, callbackSucces: Function) {

        // const priceStr = this.core.utils.formatDecimals( this.core.order.calculateTotals() / 100, 2 );

        const content = '\
    <@CenterOn><@DoubleOn><@BoldOn>WWW.ACRELEC.COM<@BoldOff><@DoubleOff><@CenterOff>\
    \n\n\n\
    <@CenterOn>Amout paid: ' + ticketText + ' EUR<@CenterOff>\
    \n\n\n\
    <@CenterOn>Thank you for your order!<@CenterOff>\
    \n\n\n\
    <@PartialCut>';

        const isConnected = MBirdSdk.isConnected();

        if (isConnected) {

            MBirdSdk.Printer.TagContent(content).then(function (result) {
                Log.debug(result);
                callbackSucces(result);
                // do something with the result
            }).catch(function (error) {
                // handle error
            });
        } else {
            callbackSucces('printer simulated');
        }
    }

    alignToRight(lStr: string, desiredLength: number, aTrim: boolean): string {
        if (aTrim) {
            lStr = lStr.trim();
        }
        if (lStr.length > desiredLength) {
            lStr = lStr.slice(0, desiredLength);
        } else {
            while (lStr.length < desiredLength) {
                lStr = ' ' + lStr;
            }
        }
        return lStr;
    }
    alignToLeft(lStr: string, desiredLength: number, aTrim: boolean): string {
        if (aTrim) {
            // lStr = lStr.replace(/\s/g, '');
            lStr = lStr.trim();
        }
        if (lStr.length > desiredLength) {
            lStr = lStr.slice(0, desiredLength);
        } else {
            while (lStr.length < desiredLength) {
                lStr += ' ';
            }
        }
        return lStr;
    }
    addReceiptHeader(printLogo: boolean = true): string {
        let lResult = '';
        if (printLogo) {
            lResult = this.image + 'assets/images/logo_print2.png' + this.imageEnd + '\n';
        }
        lResult += this.centerOn + '\n';

        // add order place; eatin = 1, takeout = 2
        // if (this.basketService.basket.Order.OrderInOut === 1) {  // EatIn
        if (this.basketService.serviceType() === 'in' ) {
            lResult += this.magnification2 + this.internationalizationService.translate('2019091001') + this.magnificationOff + '\n\n';
        } else {
            lResult += this.magnification2 + this.internationalizationService.translate('37') + this.magnificationOff + '\n\n';
        }
        // add order number
        lResult += this.magnification2 + this.internationalizationService.translate('5002') + this.magnificationOff + '\n';
        lResult += this.magnification2 + this.orderCheckoutService.orderNumber + this.magnificationOff + '\n';

        lResult += this.centerOff + '\n';
        lResult += this.centerOn + '\n\n';

        // add store name read from atp store settings
        lResult += this.configurationService.storeName + '\n';

        // add store address read from atp store settings
        let lAddress = this.configurationService.storeAddress;
        if (lAddress) {
            let addressLength = lAddress.length;
            // get maximum char per row from printer settings
            this.maxCharsPerRow = this.configurationService.printerMaxCharsPerRow;
            if (!this.maxCharsPerRow || this.maxCharsPerRow === 0) {
                this.maxCharsPerRow = this.defReceiptWidth;
            }
            while (addressLength > this.maxCharsPerRow) {
                const addrToPrint = lAddress.slice(0, this.maxCharsPerRow);
                lResult += addrToPrint + '\n';
                lAddress = lAddress.slice(this.maxCharsPerRow);
                addressLength -= this.maxCharsPerRow;
            }
            lResult += lAddress + '\n';
        }
        lResult += this.centerOff + '\n';

        Log.debug('PRINT lResult = {0}', lResult);


        return lResult;
    }

    addReceiptFooter(): string {
        let lResult = '';
        lResult += this.centerOn + '\n';
        lResult += this.magnification2 + this.internationalizationService.translate('16') + this.magnificationOff + '\n\n';

        // add company name from settings
        let lStr = this.configurationService.companyName;
        if (lStr) {
            lResult += lStr + '\n';
        }
        // add store CIF from settings
        lStr = this.configurationService.companyCIF;
        if (lStr) {
            lResult += lStr + '\n';
        }

        if (this.configurationService.printerMessage) {
            const messageSplit = this.configurationService.printerMessage.split('|');
            if (messageSplit) {
                for (let i = 0; i < 10; i++) {
                    lResult += messageSplit[i] + '\n';
                }
            }
        }
        // add store WIFI from settings
        lStr = this.configurationService.storeWIFI;
        if (lStr) {
            lResult += lStr + '\n';
        }
        // add store WC code from settings
        lStr = this.configurationService.storeWC;
        if (lStr) {
            lResult += lStr + '\n';
        }
        lResult += this.centerOff + '\n';
        return lResult;
    }

    addPOReceiptFooter() {




        let lResult = this.centerOn + '\n';

        Log.debug('2016060102 = {0}', this.internationalizationService.translate('2016060102'));
        Log.debug(this.internationalizationService.translate('2016060107'));
        Log.debug(this.internationalizationService.translate('2016060108'));

        lResult += this.magnification2 + this.internationalizationService.translate('2016060102') + this.magnificationOff + '\n\n';
        lResult += this.internationalizationService.translate('2016060107') + '\n';
        lResult += this.internationalizationService.translate('2016060108') + '\n' + this.centerOff;
        return lResult;
    }


    // Add EFT (Payment receipt) receipt part
    addBankReceipt(): string {
        let lResult = '';
        if (this.basketService.basket.Order.PreOrder === false) {
            if (this.configurationService.printPaymentReceipt === true) {
                if (this.configurationService.partialCutCCReceipt === true) {
                    lResult += '\n' + this.partialCut + '\n';
                }
                lResult += this.payReceipt + '\n\n' + this.partialCut;
            }
        }
        return lResult;
    }

    addCombosChilds(combo: any, padding: number): string {
        let lResult = '';
        if (this.basketService.retrItemVisibility(combo.Visibility).bVisibleInPrinter) {
            lResult += this.alignToRight(' ', 3 + padding, false) + ' ' +
                this.alignToLeft(combo.SName, 23, false) + '\n';
        }
        for (let i = 0; i < combo.Combos.length; i++) {
            lResult += this.addCombosChilds(combo.Combos[i], padding + 2);
        }
        return lResult;
    }


    addCurrentOrder(): string {
        let lResult = '';
        if (this.internationalizationService.translate('2017071701')) {
            const messageSplit = this.internationalizationService.translate('2017071701').split('|');
            if (messageSplit) {
                for (let i = 0; i < messageSplit.length; i++) {
                    lResult += messageSplit[i] + '\n';
                }
            }
        }
        for (let i = 0; i < this.basketService.basket.Order.Combos.length; i++) {
            if (this.basketService.retrItemVisibility(this.basketService.basket.Order.Combos[i].Visibility).bVisibleInPrinter) {
                lResult += this.alignToRight(String(this.basketService.basket.Order.Combos[i].Qty), 3, true) + ' ' +
                    this.alignToLeft(this.basketService.basket.Order.Combos[i].SName, 22, false) + ' ' +
                    this.alignToRight(this.basketService.basket.Order.Combos[i].UnitPriceStr, 6, true) + ' ' +
                    this.alignToRight(this.basketService.basket.Order.Combos[i].ComboPriceStr, 7, true) + '\n';
                for (let j = 0; j < this.basketService.basket.Order.Combos[i].Combos.Count; j++) {
                    lResult += this.addCombosChilds(this.basketService.basket.Order.Combos[i].Combos[j], 2) + '\n';
                }
            }
        }
        lResult += '\n' + this.internationalizationService.translate('2016060103') + ' ' + this.basketService.orderTotal + ' ' +
            this.internationalizationService.translate('2016060104') + '\n';
        return lResult;
    }

    getStandardReceipt(sendToFront: boolean = false): string {
        let lResult = '\n';
        lResult += this.addReceiptHeader() +
            this.addCurrentOrder() +
            this.addReceiptFooter() + '\n\n' +
            this.addSendToFrontMessage(sendToFront) +
            this.partialCut +
            this.addBankReceipt();
        return lResult;
    }

    getPreorderReceipt(): string {

        Log.debug('PrinService. getPreorderReceipt!');


        let lResult = '\n';
        lResult += this.addReceiptHeader() +
            this.addPOReceiptFooter() + '\n\n' +
            this.partialCut;
        return lResult;

    }

    addSendToFrontMessage(sendToFront: boolean): string {
        return (sendToFront ? this.internationalizationService.translate('43') + '\n\n' : '');
    }

    /**
     * Using a specific tag
     */
    getCustomerPrintContent() {
        return `\n\n\n\<@PaymentCustomerReceipt>\n\n\n\n\n\n<@PartialCut>`;
    }
    /**
     * Using a specific tag
     */
    getMerchantPrintContent() {
        return `\n\n\n\<@PaymentMerchantReceipt>\n\n\n\n\n\n<@PartialCut>`;
    }

    @Hookable(HooksIdentifiers.PRINT)
    printContent(content: string, printerName: string = '') {
        if (!MBirdSdk || !MBirdSdk.isConnected()) {
            // (Check: https://developer.acrelec.com/resources/sdk/docs/5_0_0/index.html#initialization)
            return Promise.reject('MBirdSdk is not connected! Make sure you run this App with Pigeon or on an ATP Device');
        }
        return MBirdSdk.Printer.PrintTagContent(content, printerName);
        // (Check: https://developer.acrelec.com/resources/sdk/docs/5_0_0/index.html#printer)
    }

    printFiscalReceipt(content: string) {
        if (!MBirdSdk || !MBirdSdk.isConnected()) {
            // (Check: https://developer.acrelec.com/resources/sdk/docs/5_0_0/index.html#initialization)
            return Promise.reject('MBirdSdk is not connected! Make sure you run this App with Pigeon or on an ATP Device');
        }
        return MBirdSdk.FiscalPrinter.PrintFiscalTicket(content);
    }


    saveReceiptTagContent(content: string) {
        if (!MBirdSdk || !MBirdSdk.isConnected()) {
            // (Check: https://developer.acrelec.com/resources/sdk/docs/5_0_0/index.html#initialization)
            return Promise.reject('MBirdSdk is not connected! Make sure you run this App with Pigeon or on an ATP Device');
        }
        return MBirdSdk.Printer.SaveReceiptTagContent(content);
    }


}
