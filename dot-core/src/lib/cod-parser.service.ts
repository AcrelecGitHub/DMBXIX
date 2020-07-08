import { Injectable } from '@angular/core';

import { CODOrderView, CODOrderState, CODOrderItem, CODProduct } from './models';

interface AriseOrderItem {
    ItemCode: string;
    Quantity: number;
    UnitPrice: number;
    TotalPrice: number;
    Name: string;
    OfType: string;
    items: AriseOrderItem[];
}

interface AriseProduct {
    id: string;
    productCode: string;
    points: number;
    productImage: string;
    productName: string;
}

interface AriseExtraInfo {
    cardBalance: number;
    cardStatus: number;
    products: AriseProduct[];
    OpenChoices: CODProduct[];
}

interface AriseOrderView {
    OrderState: string;
    CurrentScreenName: string;
    TotalValue: number;
    TotalTax: number;
    TotalDue: number;
    items: AriseOrderItem[];
    ExtraInfoJson: AriseExtraInfo;
}

@Injectable({
    providedIn: 'root'
})
export class CODParserService {

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

    public parseOrderView(data: AriseOrderView): CODOrderView {

        const state = (function (stateCode: string): CODOrderState {
            switch (stateCode) {
                case '1':
                    return CODOrderState.InProgress;
                case '2':
                    return CODOrderState.Confirmation;
                case '3':
                case '4':
                case '5':
                    return CODOrderState.Completed;
                default:
                    return CODOrderState.Idle;
            }
        })(data.OrderState);

        const parseOrderItemProduct = (ariseProduct: AriseOrderItem): CODProduct => {
            const subItems: CODProduct[] = (ariseProduct.items || []).map(_ => parseOrderItemProduct(_));

            return <CODProduct>{
                code: ariseProduct.ItemCode,
                name: this._replacementTokens.reduce((name, token) =>
                    name.replace(new RegExp(token.searchPattern, 'g'), token.replaceValue), ariseProduct.Name || ''),
                quantity: ariseProduct.Quantity,
                price: {
                    value: ariseProduct.UnitPrice,
                    type: 'currency'
                },
                items: subItems,
                type: ariseProduct.OfType === 'OpenedChoice' ? 'choice' : 'product'
            };
        };

        const parseOrderItem = (ariseOrderItem: AriseOrderItem): CODOrderItem => {
            const product: CODOrderItem = Object.assign(parseOrderItemProduct(ariseOrderItem), {
                voided: ariseOrderItem.Quantity === 0,
                totalPrice: {
                    value: ariseOrderItem.TotalPrice,
                    type: <'points' | 'currency'>'currency'
                }
            });

            return product;
        };

        const items: CODOrderItem[] = (data.items || []).map(parseOrderItem);

        const customData: any = {};

        if (data.ExtraInfoJson && data.ExtraInfoJson.cardStatus !== 0) {
            const cardBalance = data.ExtraInfoJson.cardBalance;

            const products: CODProduct[] = [];

            if (data.ExtraInfoJson.products) {
                products.push(...data.ExtraInfoJson.products.map(_ => (<CODProduct>{
                    code: _.productCode,
                    media: '/data/items/' + _.productImage,
                    name: this._replacementTokens.reduce((name, token) =>
                        name.replace(new RegExp(token.searchPattern, 'g'), token.replaceValue), _.productName || ''),
                    price: {
                        value: _.points,
                        type: 'points'
                    }
                })));
            }

            customData.loyalty = {
                cardBalance,
                products
            };
        }

        if (data.ExtraInfoJson && data.ExtraInfoJson.OpenChoices instanceof Array) {
            const updateProduct = (product: CODProduct): void => {
                product.name = this._replacementTokens.reduce((name, token) =>
                    name.replace(new RegExp(token.searchPattern, 'g'), token.replaceValue), product.name || '');
                product.media = '/data/items/' + product.media;

                if (product.items instanceof Array) {
                    product.items.forEach(_ => updateProduct(_));
                }
            };

            const openChoices = <(CODProduct & { completed: boolean, level: number })[]>data.ExtraInfoJson.OpenChoices;
            openChoices.forEach(_ => {
                updateProduct(_);
                _.items.sort((a, b) => a.selected ? -1 : (b.selected ? 1 : 0));
            });

            while (openChoices.length > 4) {
                const target = openChoices.find(_ => _.completed && _.level > 1);
                if (!target) {
                    break;
                }
                openChoices.remove(target);
            }

            customData.openChoices = openChoices;
        }

        const orderView: CODOrderView = {
            state,
            currentScreen: data.CurrentScreenName,
            totals: {
                value: data.TotalValue,
                tax: data.TotalTax,
                due: data.TotalDue
            },
            items,
            customData
        };

        return orderView;
    }
}
