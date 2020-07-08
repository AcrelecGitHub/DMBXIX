import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';

import { Page, CODProduct, CODPage } from './models';
import { Log } from './logger/log';
import { CODUpdateService } from './cod-update.service';
import { CODDataService } from './cod-data.service';

@Injectable({
    providedIn: 'root'
})
export class CODPagesService {

    private _pages: CODPage[];

    private _replacementTokens = [
        { searchPattern: '\\r?\\n', replaceValue: '<br />' },
        { searchPattern: '\\\\s\\+(((?!\\\\s-).)*)(\\\\s-)?', replaceValue: '<sup>$1</sup>' },
        { searchPattern: '\\\\b\\+(((?!\\\\b-).)*)(\\\\b-)?', replaceValue: '<b>$1</b>' },
        {
            searchPattern: '\\\\fsize(\\+|-)(\\d{3})(((?!\\\\fsize(?!\\1)(\\+|-)).)*)(\\\\fsize(?!\\1)(\\+|-))?',
            replaceValue: '<span style="font-size: calc(100% $1 $2%);">$3</span>'
        },
        { searchPattern: '\\\\n', replaceValue: '<br />' },
        { searchPattern: '\\\\r', replaceValue: '&reg;' },
        { searchPattern: '\\\\t', replaceValue: '&trade;' },
        { searchPattern: '\\\\c', replaceValue: '&copy;' },
        { searchPattern: '\\\\s', replaceValue: ' ' }
    ];

    constructor(private _http: HttpClient,
        private _updateService: CODUpdateService,
        private _dataService: CODDataService) {
    }

    public get pages(): CODPage[] {
        return this._pages;
    }

    public async initialize(): Promise<void> {
        Log.info('Initializing COD Pages Service...');

        await Promise.retry(async () => await this.load(), (retry) => Math.min(60, retry) * 1000);

        this._dataService.dataUpdated.subscribe(() => {
            this._updateService.require(() => this.load());
        });
    }

    public async load(): Promise<void> {
        Log.info('Loading COD Pages Service...');
        await Promise.retry(() => this.loadPages(), 1000);
        Log.info('Pages loaded!');
    }

    private async loadPages(): Promise<void> {
        const url = '/data/configuration/pages.json?t=' + Date.now();
        const data = await this._http.get<any>(url).toPromise();

        const getInnerPages = (page: Page) => {
            const innerPages: Page[] = [];
            for (const button of page.Buttons) {
                if (button.Page) {
                    innerPages.push(button.Page, ...getInnerPages(button.Page));
                }
            }
            return innerPages;
        };

        const mainPage: Page = data.MainPage || data;

        const pages = [mainPage, ...getInnerPages(mainPage)];

        if (data.HiddenPages) {
            for (const hiddenPage of data.HiddenPages) {
                pages.push(hiddenPage, ...getInnerPages(hiddenPage));
            }
        }

        const timestamp = '?t=' + Date.now();

        this._pages = pages.map(page => {
            const codPage = <CODPage>{
                id: page.ID,
                products: page.Buttons.map(_ => {
                    const codProduct = <CODProduct>{
                        code: String(_.Link),
                        media: _.Picture ? '/data/items/' + _.Picture + timestamp : null,
                        name: this._replacementTokens.reduce((name, token) =>
                            name.replace(new RegExp(token.searchPattern, 'g'), token.replaceValue), _.Caption || ''),
                        price: {
                            value: (_.Price && typeof (Number((<any>_.Price).TakeOut)) === 'number') ?
                                Number((<any>_.Price).TakeOut) / 100 : 0,
                            type: 'currency'
                        }
                    };

                    Object.freeze(codProduct);
                    return codProduct;
                })
            };

            Object.freeze(codPage);
            return codPage;
        });
    }
}
