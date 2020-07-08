import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { environment } from './environments/environment';
import { LocalizationService } from './localization.service';
import { BasketService } from './basket.service';

@Injectable({
    providedIn: 'root'
})
export class PaySimApiService {
    private token;
    private orderNbrChecked = 0;
    private callback: Function;


    constructor(private httpClient: HttpClient,
        private localizationService: LocalizationService,
        private basketService: BasketService) {
    }

    init(callback: Function) {
        this.callback = callback;
    }

    compute(): string {
        this.token = Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
        const priceStr = this.localizationService.formatNumber(this.basketService.orderTotal, 2);

        this.orderNbrChecked = 0;
        setTimeout(this.checkOrder.bind(this), 1000);
        return 'http://webdot.kpos.ro/xvapi/?ammount=' + priceStr + '&order=KFC&token=' + this.token;
    }

    checkOrder() {
        return this.getConfirmation(this.onOrderPaid.bind(this));
    }

    getConfirmation(calbackfunction: Function) {
        const orderJson = this.httpClient.get(
            environment.orderEndpoint + '?token=' + this.token
        );
        orderJson.subscribe(response => {
            calbackfunction(response);
        }, err => {
            calbackfunction(err);
        });
    }

    onOrderPaid(event) {
        if (event.hasOwnProperty('status')) {
            if (event['status'] == 1) {
                setTimeout(this.checkOrder.bind(this), 1000);
            } else if (event['status'] == 2) {
                this.callback('approved');
            } else if (event['status'] == 3) {
                this.callback('rejected');
            }
        } else if (this.orderNbrChecked < 60) {
            this.orderNbrChecked++;
            setTimeout(this.checkOrder.bind(this), 1000);
        } else {
            this.callback('rejected');
        }
    }
}
