import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';

import { MBirdSdk } from '../externals/mbird-sdk';
import { Log } from './logger/log';
import { HooksIdentifiers } from './hook-manager/hooks-identifiers';
import { Hookable } from './decorators/hookable.decorator';

@Injectable({
    providedIn: 'root'
})

export class AtpPaymentService {

    constructor() { }

    @Hookable(HooksIdentifiers.PAY_WITH_CARD)
    payWithCard(amount: number, transactionReference: string, paymentName: string = ''): Promise<any> {
        // Check if MBirdSdk Is Connected and wrap it in a Promise for uniform return:

        // in order to pass payWithCard step
        // return Promise.resolve({
        //         PaidAmount: 1290,
        //         TenderMediaId: 45,
        //         TenderMediaDetails: 'Visa',
        //         HasClientReceipt: true,
        //         HasMerchantReceipt: false
        //     });

        if (!Number.isInteger(amount) || amount < 0 || !transactionReference) {
            // (Check: https://developer.acrelec.com/resources/sdk/docs/5_0_0/index.html#initialization)
            return Promise.reject(!Number.isInteger(amount) || amount < 0 ?
                                 'amount value is not valid' :
                                 'transactionReference value is not valid');
        }

        // Check if MBirdSdk Is Connected and wrap it in a Promise for uniform return:
        if (!MBirdSdk || !MBirdSdk.isConnected()) {
            // (Check: https://developer.acrelec.com/resources/sdk/docs/5_0_0/index.html#initialization)
            return Promise.reject('MBirdSdk is not connected! Make sure you run this App with Pigeon or on an ATP Device');
        }

        // The actual pay call: (Check: https://developer.acrelec.com/resources/sdk/docs/5_0_0/index.html#pay)
        return MBirdSdk.Payment.Pay(amount, transactionReference, paymentName);
    }

    @Hookable(HooksIdentifiers.PAY_WITH_EPAY)
    payWithEPay(amount: number, transactionReference: string, paymentName: string = '') {
        // Check if MBirdSdk Is Connected and wrap it in a Promise for uniform return:
        if (!MBirdSdk || !MBirdSdk.isConnected()) {
            // (Check: https://developer.acrelec.com/resources/sdk/docs/5_0_0/index.html#initialization)
            return Promise.reject('MBirdSdk is not connected! Make sure you run this App with Pigeon or on an ATP Device');
        }
        // The Actual ePay Call: (Check https://developer.acrelec.com/resources/sdk/docs/5_0_0/index.html#electronic-pay)
        return MBirdSdk.Payment.ElectronicPay(amount, transactionReference, paymentName);
    }

    @Hookable(HooksIdentifiers.PAY_WITH_CASH)
    payWithCash(paymentName: string) {
        return new Observable(observer => {
            // Validate MBirdSdk.isConnected():
            if (!MBirdSdk || !MBirdSdk.isConnected()) {
                observer.error('MBirdSdk is not connected! Make sure you run this App with Pigeon or on an ATP Device');
                observer.complete();
                return;
            }

            // Add Listener for Pay Progress: (Check https://developer.acrelec.com/resources/sdk/docs/5_0_0/index.html#paymentcallbacks)
            MBirdSdk.PaymentCallbacks.PayProgress((json) => {
                // This Call back will get called after MBirdSdk.Payment.Pay is called
                observer.next(json); // Emit Progress
            });

            // Call StartAcceptMoney: (Check https://developer.acrelec.com/resources/sdk/docs/5_0_0/index.html#start-accept-money)
            MBirdSdk.Payment.StartAcceptMoney(paymentName).then(() => {
                Log.debug('MBirdSdk.Payment.StartAcceptMoney!');
            }).catch(function (error) {
                Log.debug('MBirdSdk.Payment.StartAcceptMoney!, Error = ' + error);
            });
        });
    }

    @Hookable(HooksIdentifiers.PAY_WITH_CASH_ENDED)
    endAcceptingMoney(amountToBeKept: number, paymentName: string) {
        return MBirdSdk.Payment.EndAcceptMoney(amountToBeKept, paymentName);
    }

    addTransaction(transactionWasSuccessful: boolean, transactionReference: string) {
        return MBirdSdk.Trace.AddTransaction(transactionWasSuccessful, transactionReference);
    }


}
