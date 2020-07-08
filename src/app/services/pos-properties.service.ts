import {
    PosTableService, PosConfig, PosOrderConfig, PosHeaderConfig
} from 'dotsdk';
import { Injectable } from '@angular/core';

export enum OrderTimingTypes {
    ORDER_START = 'orderStartTime',
    ORDER_END = 'orderEndTime',
    POS_START = 'posStartTime',
    POS_END = 'posEndTime',
    PAY_START = 'payStartTime',
    PAY_END = 'payEndTime',
    FIRST_ITEM_ADDED = 'firstItemAddedTime'
}

@Injectable({
    providedIn: 'root'
})
export class PosPropertiesService {

    public posConfig: PosConfig = new PosConfig({
        posHeader:  new PosHeaderConfig({
            posTovStatus: 0,
            posTovDetail: 0,
            posTovDetails: '',
            kioskId: 1234,
            currentLanguageCode: 'EN',
            isPreOrder: false,
            storeCode: '213456',
            storeName: 'BK FR Paris Store',

            tableLocation: PosTableService.NONE,

            operations: [], // operations will be added here later (pay, pos...)
            cvars: { theKey: 'the value' },
            receiptText: 'Bon Appetit!'
        }),
        posOrder: new PosOrderConfig([])
    });
    constructor() {

    }
}
