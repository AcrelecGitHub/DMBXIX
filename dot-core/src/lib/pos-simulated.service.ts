import { Injectable } from '@angular/core';
import { BasketService } from './basket.service';

@Injectable({
    providedIn: 'root'
})
export class PosSimulatedService {

    constructor(private basketService: BasketService) { }

    sendDataToPOS(elog: any): Promise<any> {
        return Promise.resolve({
            Tax: '0',
            TableID: '2',
            FunctionNumber: 33,
            SubTotal: this.basketService.orderTotal.toString(),
            ReturnCode: 0,
            OrderPOSNumber: Math.round(1 + Math.random() * Math.pow(10, 3) - 2),
            SubtotalCents: this.basketService.orderTotal,
            CheckID: '754927340',
            Total: '5.40',
            Elog: '',
            ReturnMessage: '',
            TaxCents: 0,
            StoreDetails: []
        });
    }
}
