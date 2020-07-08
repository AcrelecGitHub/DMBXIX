import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { timer, Observable, BehaviorSubject, Subscription, ReplaySubject } from 'rxjs';
import { switchMap } from 'rxjs/operators';

import { Log } from './logger/log';
import { CODOrderView, CODOrderState, ToastMessage, CODProduct } from './models';
import { CODConfigurationService } from './cod-configuration.service';
import { CODScannerService } from './cod-scanner.service';
import { CODPagesService } from './cod-pages.service';
import { CODParserService } from './cod-parser.service';
import { CODUpdateService } from './cod-update.service';
import { CODDataService } from './cod-data.service';

interface CODSettings {
    id: string;

    arisePath: string;

    currencySymbol: string;
    currencySymbolBefore: boolean;
    currencyDecimals: number;
    decimalSeparator: string;

    productsAnimationInterval: number;
    finishedOrderTimeout: number;
    idleTimeout: number;
}

@Injectable({
    providedIn: 'root'
})
export class CODService {

    private _statusSubscription: Subscription;
    private _idleTimeout: any;

    private _pageLink: {
        title: string;
        products: CODProduct[];
    }[];

    private _products: CODProduct[];

    private _orderView: CODOrderView = <CODOrderView>{};
    private _orderState = new BehaviorSubject<CODOrderState>(CODOrderState.Idle);

    private _message = new ReplaySubject<ToastMessage>(undefined, 500);

    constructor(private _http: HttpClient,
        private _scannerService: CODScannerService,
        private _pagesService: CODPagesService,
        private _parserService: CODParserService,
        private _updateService: CODUpdateService,
        private _dataService: CODDataService,
        private _configurationService: CODConfigurationService<CODSettings>) {
    }

    public get orderView(): CODOrderView {
        return this._orderView;
    }

    public get orderState(): Observable<CODOrderState> {
        return this._orderState.asObservable();
    }

    public get message(): Observable<ToastMessage> {
        return this._message.asObservable();
    }

    public get products(): CODProduct[] {
        return this._products;
    }

    public async initialize(): Promise<void> {
        Log.info('Initializing COD Service...');

        this._scannerService.start();
        this._scannerService.scan.subscribe((data) => this.onScan(data));

        await this.load();

        this._dataService.dataUpdated.subscribe(() => {
            this._updateService.require(() => this.load());
        });
    }

    public async load(): Promise<void> {
        Log.info('Loading COD Service...');

        await Promise.retry(() => this.loadPageLinks(), (retry) => Math.min(60, retry) * 1000);
        Log.info('COD Pages loaded!');

        await this.connectServer();

        Log.info('Customer Order Display Service initialized!');
    }

    private async connectServer(): Promise<void> {
        Log.info('Connecting to ARISE server...');
        await this.clear();

        if (this._statusSubscription) {
            this._statusSubscription.unsubscribe();
            this._statusSubscription = null;
        }

        const configuration = this._configurationService.configuration();
        const disconnectUrl = configuration.arisePath + 'rest/disconnect?appid=' + configuration.id;
        const connectUrl = configuration.arisePath + 'rest/connect?appid=' + configuration.id;
        const statusUrl = configuration.arisePath + 'rest/getlaststate/' + configuration.id;

        await Promise.retry(async () => {
            await this._http.get<any>(disconnectUrl).toPromise().catch(error => {
                if (error.status !== 409) {
                    throw error;
                }
            });

            await this._http.get<any>(connectUrl).toPromise();
            Log.info('Connected!');
        }, (retry) => Math.min(60, retry) * 1000);

        this._statusSubscription = timer(0, 200).pipe(
            switchMap(() => this._http.get<any>(statusUrl))
        ).subscribe(status => this.statusCheck(status), () => this.connectServer());
    }

    private async loadPageLinks(): Promise<void> {
        const url = '/data/configuration/cod_pages.json?t=' + Date.now();
        const data = await this._http.get<{ Title: string, Type: string, openChoice: string, value: string }[]>(url).toPromise();

        const pages = this._pagesService.pages;

        this._pageLink = data.filter(pageLink => !!pageLink.Title).map(pageLink => {
            const targetPage = pages.find(_ => _.id == pageLink.value);
            return {
                title: pageLink.Title,
                products: targetPage.products
            };
        });
    }

    private async setOrderState(state: CODOrderState): Promise<void> {
        if (this._orderState.value === state) {
            return;
        }

        if (state !== CODOrderState.Idle) {
            await this._updateService.suspend();
        }

        this._orderState.next(state);

        if (state === CODOrderState.Idle) {
            await this._updateService.resume();
        }
    }

    private async statusCheck(status: any): Promise<void> {
        if (status.messages && status.messages.scanmessage instanceof Array) {
            for (const scanMessage of status.messages.scanmessage) {
                if (scanMessage.code === 101) {
                    this._message.next(null);
                } else if (scanMessage.code !== 100) {
                    const messageTimeout = 3000;

                    // Error
                    this._message.next({
                        type: 'error',
                        timeout: messageTimeout,
                        value: '2019030101'
                    });

                    if (this._orderState.value !== this._orderView.state) {
                        setTimeout(() => {
                            this.setOrderState(this._orderView.state || CODOrderState.Idle);
                        }, messageTimeout);
                    }
                }
            }
        }

        const configuration = this._configurationService.configuration();
        if (status.order || (status.messages && status.messages.scanmessage instanceof Array)) {
            if (this._idleTimeout) {
                clearTimeout(this._idleTimeout);
            }

            this._idleTimeout = setTimeout(() => {
                this.clear();
                Log.info('Timed out! COD state cleared.');
            }, configuration.idleTimeout || 60000);
        }

        if (!status.order) {
            return;
        }

        Log.info('Order changed! Recovering last order...');

        const orderUrl = configuration.arisePath + 'rest/getlastorder/' + configuration.id + '?format=json';
        const data = await this._http.get<any>(orderUrl).toPromise();
        Log.debug('Last order received!');
        const orderView = this._parserService.parseOrderView(data);
        Log.debug('Last order parsed!');

        this.updatePage(orderView.currentScreen);
        this.updateOrder(orderView);
        Log.debug('Order updated!');
    }

    private updatePage(pageTitle: string): void {
        const link = this._pageLink.find(_ => _.title === pageTitle);
        if (link) {
            this._products = link.products;
        } else {
            this._products = null;
            Log.info('Could not find page link for screen [{0}]', pageTitle);
        }
    }

    private async updateOrder(orderView: CODOrderView): Promise<void> {
        if (this._orderState.value != orderView.state) {
            Log.info('Order state changed to: {0}', orderView.state);
        }

        const finishedOrderTimeout = this._configurationService.get('finishedOrderTimeout');

        if (finishedOrderTimeout === 0 && orderView.state === CODOrderState.Completed) {
            await this.clear();
            return;
        }

        await this.setOrderState(orderView.state);
        this.updateObject(this._orderView, orderView);

        if (orderView.state === CODOrderState.Completed) {
            await new Promise(resolve => setTimeout(resolve, finishedOrderTimeout));
            await this.clear();
        }
    }

    private updateObject(target: any, source: any) {
        const targetKeys = Object.keys(target);
        const sourceKeys = Object.keys(source);

        const newKeys = sourceKeys.filter(_ => !targetKeys.contains(_));
        const oldKeys = targetKeys.filter(_ => !sourceKeys.contains(_));
        const commonKeys = targetKeys.filter(_ => sourceKeys.contains(_));

        // Update common Keys
        for (const key of commonKeys) {
            if (typeof(target[key]) === 'object' && typeof(source[key]) === 'object') {
                this.updateObject(target[key], source[key]);
            } else {
                target[key] = source[key];
            }
        }

        for (const key of newKeys) {
            target[key] = source[key];
        }

        for (const key of oldKeys) {
            delete target[key];
        }

        if (target instanceof Array && source instanceof Array) {
            target.length = source.length;
        }
    }

    private async onScan(data: string): Promise<void> {
        Log.info('Scaned data: {0}', data);

        const url = String.compositeFormat('{0}rest/sendmessage?appid={1}&message={2}&source=scanner',
            this._configurationService.get('arisePath'), this._configurationService.get('id'), data);

        try {
            await this._http.get(url).toPromise();

            this._message.next({ type: 'info', timeout: 0, value: '2019022704' });

            // Temporially go to 'in progress' state to show scan messages
            if (this._orderState.value === CODOrderState.Idle) {
                await this.setOrderState(CODOrderState.InProgress);
            }
        } catch {
            Log.error('Error sending scanner message to ARISE');
        }
    }

    private async clear(): Promise<void> {
        await this.setOrderState(CODOrderState.Idle);

        this.updateObject(this._orderView, {});
        this._products = null;
    }
}
