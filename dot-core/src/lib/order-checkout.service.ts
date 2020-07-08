import { Injectable } from '@angular/core';
import { Subject, Observable } from 'rxjs';

import { BasketService } from './basket.service';
import { ElogService } from './elog.service';
import { Log } from './logger/log';
import { PosInjectorService } from './pos-injector.service';
import { PosFunctions } from './enums/pos-functions.enum';
import { ConfigurationService } from './configuration.service';
import { PeripheralsCheckMode } from './enums';
import { PosSimulatedService } from './pos-simulated.service';

@Injectable({
    providedIn: 'root'
})
export class OrderCheckoutService {

    private _orderNumber: number;
    private _receiptContent: string;
    private _transaction: any;
    private _tax: number;
    private _transactionCoupon: string;

    public messages: string[];
    public messagesStyle: string;

    constructor(private basketService: BasketService,
        private elogService: ElogService,
        private posInjectorService: PosInjectorService,
        private configurationService: ConfigurationService,
        private posSimulatedService: PosSimulatedService) {
        this.receiptContent = '';

//        this.basketService.onCancelOrder.subscribe(() => this.voidOrderOnPOS());
//        this.basketService.onContinueOrder.subscribe(() => this.voidOrderOnPOS());
    }

    _onOpenCheckout: Subject<any> = new Subject();

    _onPayAfterPOS: Subject<any> = new Subject();
    _onPayWithCard: Subject<any> = new Subject();
    _onPayWithCash: Subject<any> = new Subject();
    _onPayWithQRCode: Subject<any> = new Subject();

    get orderNumber(): number {
        return this._orderNumber;
    }
    set orderNumber(newOrderNumber: number) {
        this._orderNumber = newOrderNumber;
    }
    get receiptContent(): any {
        return this._receiptContent;
    }
    set receiptContent(newReceiptContent: any) {
        this._receiptContent = newReceiptContent;
    }

    get tax(): number {
        return this._tax;
    }
    set tax(newTax: number) {
        this._tax = newTax;
    }

    get transaction(): any {
        return this._transaction;
    }

    onPayAfterPOS() {
        return this._onPayAfterPOS.asObservable();
    }

    payAfterPOS() {
        this._onPayAfterPOS.next();
    }

    onPayWithCard() {
        return this._onPayWithCard.asObservable();
    }

    payWithCard() {
        this._onPayWithCard.next();
    }

    onPayWithCash(): Observable<void> {
        return this._onPayWithCash.asObservable();
    }

    payWithCash() {
        this._onPayWithCash.next();
    }

    onPayWithQRCode() {
        return this._onPayWithQRCode.asObservable();
    }

    payWithQRCode() {
        this._onPayWithQRCode.next();
    }

    get posService() {
        if (this.configurationService.posCheckMode == PeripheralsCheckMode.Simulate) {
            return this.posSimulatedService;
        } else {
            return this.posInjectorService;
        }
    }

    async sendOrderToPOS(): Promise<string> {
        await this.elogService.processRefInt();
        await this.elogService.saveOrderInText(true);
        await this.elogService.addFunctionTypeToTransaction(PosFunctions.ExtSimphonyOrder);
        Log.debug('Send data to POS: ');
        Log.debug(new XMLSerializer().serializeToString(this.elogService.tranXML.documentElement));

        // tslint:disable-next-line:max-line-length
        const transaction = await this.posService.sendDataToPOS(new XMLSerializer().serializeToString(this.elogService.tranXML.documentElement))
            .catch(e => {
                Log.error('Send data to POS: Error: {0}', e ? JSON.stringify(e) : 'error not found');
                return null;
            });
        Log.debug(transaction);
        // check response from POS

        if (!transaction || transaction.ReturnCode !== 0) {
            return Promise.reject('sendOrderTransactionFail');
        } else {
            this.basketService.basket.Order.Closed = false;
            // check POS total
            const totalFromPos = (transaction.SubtotalCents + transaction.TaxCents).toFixed(2);
            const totalFromDot = (this.basketService.orderTotal).toFixed(2);
            Log.debug('total from POS: ' + totalFromPos);
            Log.debug('total from DOT: ' + totalFromDot);
            this._transaction = JSON.parse(JSON.stringify(transaction));
            if (totalFromPos !== totalFromDot) {
                return Promise.resolve('differentTotal');
            } else {
                this.orderNumber = transaction.OrderPOSNumber;
                this.tax = transaction.TaxCents;
                return Promise.resolve('goToPaymentSelection');
            }
        }
    }

    async openOrderToPOS(): Promise<string> {
        await this.elogService.addFunctionTypeToTransaction(PosFunctions.ExtOpenOrder);
        // tslint:disable-next-line:max-line-length
        const transaction = await this.posService.sendDataToPOS(new XMLSerializer().serializeToString(this.elogService.tranXML.documentElement))
            .catch(e => {
                Log.error('Send data to POS: Error: {0}', e);
                return null;
            });
        Log.debug(transaction);
        if (!transaction || transaction.ReturnCode !== 0) {
            return Promise.reject('openOrderTransactionFail');
        } else {
            this.receiptContent = transaction.Receipt;
            return Promise.resolve('openOrderTransactionSucces');
        }
    }

    async unlockOrderToPOS() {
        await this.elogService.addFunctionTypeToTransaction(PosFunctions.ExtUnlockOrder);
        await this.elogService.addOrderPosNumberToTransaction(this.orderNumber);
        // tslint:disable-next-line:max-line-length
        await this.posService.sendDataToPOS(new XMLSerializer().serializeToString(this.elogService.tranXML.documentElement))
            .catch(e => {
                Log.error('Send data to POS: Error: {0}', e);
            });
    }

    async tenderOrderOnPOS(tenderMediaId: string): Promise<string> {
        await this.elogService.addFunctionTypeToTransaction(PosFunctions.ExtTenderOrder);
        await this.elogService.addOrderPosNumberToTransaction(this.orderNumber);
        await this.elogService.addTenderInfo(tenderMediaId);

        // tslint:disable-next-line:max-line-length
        const tenderOrderTransaction = await this.posService.sendDataToPOS(new XMLSerializer().serializeToString(this.elogService.tranXML.documentElement))
            .catch(e => {
                Log.error('Send data to POS: Error: {0}', e);
                return null;
            });
        Log.debug(tenderOrderTransaction);
        if (!tenderOrderTransaction || tenderOrderTransaction.ReturnCode !== 0) {
            return Promise.reject('tenderOrderTransactionFail');
        } else {
            if (tenderOrderTransaction.Receipt) {
                return Promise.resolve(tenderOrderTransaction.Receipt);
            } else {
                return Promise.resolve('');
            }
        }
    }

    async voidOrderOnPOS(): Promise<string> {
        await this.elogService.addFunctionTypeToTransaction(PosFunctions.ExtVoidOrder);
        await this.elogService.addOrderPosNumberToTransaction(this.orderNumber);
        // tslint:disable-next-line:max-line-length
        const transaction = await this.posService.sendDataToPOS(new XMLSerializer().serializeToString(this.elogService.tranXML.documentElement))
            .catch(e => {
                Log.error('Send data to POS: Error: {0}', e);
                return null;
            });
        Log.debug(transaction);
        if (!transaction || transaction.ReturnCode !== 0) {
            return Promise.reject('voidOrderTransactionFail');
        } else {
            return Promise.resolve('voidOrderTransactionSucces');
        }
    }

    async prepareOrder() {
        const tenders = <any>[];
        tenders.PaymentMediaId = -1;
        tenders.tiType = 1;
        tenders.PaidAmount = this.basketService.orderTotal;
        tenders.Paid = false;
        tenders.TenderItemDetails = '';
        tenders.CustomInfo = '';

        this.basketService.basket.Order.Amounts = {
            'OrderAmountStr': String(this.basketService.orderTotal),
            'OrderAmountInt': this.basketService.orderTotal,
            'OrderTenderItems': tenders
        };
    }
}

