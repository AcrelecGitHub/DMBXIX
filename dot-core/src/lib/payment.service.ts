import { Injectable } from '@angular/core';
import { KioskService } from './kiosk.service';

import { MBirdSdk } from '../externals/mbird-sdk';
import { Log } from './logger/log';
import { LocalizationService } from './localization.service';
import { StoreConfigurationService } from './store-configuration.service';
import { BasketService } from './basket.service';
import { HooksIdentifiers } from './hook-manager/hooks-identifiers';
import { Hookable } from './decorators/hookable.decorator';

@Injectable({
    providedIn: 'root'
})
export class PaymentService {

    ScriptVer = '1.0.0.11';
    ScriptDsc = 'BK ES XV';

    // Global variables removed from DOT OrderEnd Config
    PrintOK = true;
    RemotePrintOK = true;
    PrintPAYFail = false;
    RemotePrintPAYFail = false;
    PrintPOSFail = false;
    RemotePrintPOSFail = false;

    // Message types
    mtWarning = 1;
    mtError = 2;
    mtInformation = 3;
    mtConfirmation = 4;
    mtCustom = 5;

    // Buttons | And their modal results
    mbYes = 1;  // mrYes
    mbNo = 2;  // mrNo
    mbOK = 3;  // mrOK
    mbCancel = 4;  // mrCancel
    mbAbort = 5;  // mrAbort
    mbRetry = 6;  // mrRetry
    mbIgnore = 7;  // mrIgnore
    mbAll = 8;  // mrAll
    mbNoToAll = 9;  // mrNoToAll
    mbYesToAll = 10; // mrYesToAll
    mbHelp = 11; // mrHelp

    ACTIV_LOG = 'ACT_';

    PLUG_RETOUR = 0;
    PLUG_CLOSE = 1;
    PLUG_CONTINUE = 2;

    MaxPaymentRetry = 4;
    MaxSelPayRetry = 99;

    MU_PayCancel = 0;   // Payment selector cancel
    MU_PayWithCard = 1; // Payment selector pay with card
    MU_PayWithCash = 2; // Payment selector pay with cash
    MU_PayTimeOut = -1; // Payment selector time out

    // CRLF = #13#10;

    // print receipt mode
    rcpStandard = 0; // Standard mode
    rcpPreorder = 1; // Preorder mode
    rcpPickUpLater = 2; // PickUpLater mode

    // Ext_Pos functions
    PSS_EXT_TEST = 1;
    PSS_EXT_KILL_PREV = 2;
    PSS_EXT_COMPLETE_ORDER = 3;
    PSS_EXT_OPEN_ORDER = 4;
    PSS_EXT_TENDER_ORDER = 5;
    PSS_EXT_VOID_ORDER = 6;
    PSS_EXT_LITEMDEF_FROM_POS = 7;
    PSS_EXT_LITEMDEF_FROM_FILE = 8;
    PSS_EXT_HELP_USE = 9;
    PSS_EXT_GET_VERS = 10;
    PSS_EXT_GET_CAPABILITIES = 11;
    PSS_EXT_INT_OFF_LINE = 12;
    PSS_EXT_GET_BUSINESS_DAY = 13;
    PSS_EXT_OPEN_DAY = 14;
    PSS_EXT_CLOSE_DAY = 15;
    PSS_EXT_RETRY_ORDERS = 16;
    PSS_EXT_IS_DAY_OPEN = 17;
    PSS_EXT_RESTART_POS = 18;
    PSS_EXT_GET_ITEMINFO = 21;
    PSS_EXT_GET_MENUINFO = 22;
    PSS_EXT_GET_PROMO_NP6 = 23;
    PSS_EXT_GET_LOCALS_NP6 = 24;
    PSS_EXT_TESTDIAG = 30;
    PSS_EXT_GETOPENTABLES = 31;
    PSS_EXT_UNLOCK_ORDER = 32;

    scrPayments = {
        ID: 0,
        IsPreorder: false
    };
    PaymentOK: Boolean;
    RequireCancelOrder: Boolean;
    OrderHasPromoItem: Boolean;
    BackToOrder: Boolean;
    TransactionRespClass: number;
    PrimaryPosID: number;
    Info: string;
    ServiceChargePayID: number;
    PickUpLaterID: string;
    iniFile: string;
    PayWithParams: Boolean;

    payWithCard: Boolean;
    payWithCash: Boolean;

    constructor(private kioskService: KioskService,
        private localizationService: LocalizationService,
        private storeConfigurationService: StoreConfigurationService,
        private basketService: BasketService) { }

    payMethod(): number {
        Log.debug('get paymethod');
        const paymentMode = this.storeConfigurationService.getValue('Acrelec', 'EFT', 'PaymentMode');
        if (paymentMode !== '') {
            return parseInt(paymentMode, 10);
        }
        return 0; // 0 - PayAfterPOS (Default), 1 - PayBeforePOS
    }

    paymentCount(): number {
        // getDriverNumber(); //return drivers number 0, 1 or greather
        return 2;
    }

    detectPayPosibilities() {
        switch (this.paymentCount()) {
            case 0:
                this.payWithCard = false;
                this.payWithCash = false;
                break;
            case 1:
                // if (hasPreOrder){
                this.payWithCard = false;
                this.payWithCash = true;
                break;
            /*} else {
              if (this.core.kiosk.paySta !== 0) {
                this.payWithCard = true;
                this.payWithCash = false;
                break;
              } else {
                this.payWithCard = false;
                this.payWithCash = false;
                break;
              }*/
            default:
                if (this.kioskService.configReq.paySta !== 0) {
                    this.payWithCard = true;
                    Log.debug('paysta= ' + this.kioskService.configReq.paySta);
                } else {
                    this.payWithCard = false;
                }
                // if (hasPreOrder){
                this.payWithCash = true;
            /* } else {
              this.payWithCash = false;
            }*/

        }
    }

    paymentSelection(): number {
        this.detectPayPosibilities();

        if (this.payWithCard && this.payWithCash) {
            return 3;
        } else
            if (this.payWithCard) {
                return 2;
            } else if (this.payWithCash) {
                return 1;
            } else {
                return 0;
            }
    }

    payOrder(callbackSucces: Function, callbackError: Function) {
        this.pay(callbackSucces, callbackError);
    }

    // @Hookable(HooksIdentifiers.PAY_START)
    async pay(callbackSucces: Function, callbackFail: Function) {
        if (MBirdSdk.isConnected()) {
            window['MBirdSdk'] = MBirdSdk;
            const priceStr = this.localizationService.formatNumber(this.basketService.orderTotal, 2);
            MBirdSdk.Payment.Pay(parseInt(priceStr, 10), '001').then(function (result) {
                Log.debug('Payment success!');
                Log.debug('result');
                callbackSucces(result);
            }).catch(function (error) {
                callbackFail(error);
            });
        } else {
            callbackFail('simulation');
        }
    }


    //   pay(callbackSucces: Function, callbackFail: Function) {
    //     try {
    //       // this.core.hookOrderCheckout.beforeStartPay(this.payCallback.bind(this), callbackSucces, callbackFail);
    //     } catch (e) {
    //       Log.debug('pay error: ');
    //       Log.debug(e.message);
    //       this.payCallback(callbackSucces, callbackFail);
    //     }
    //   }

    //   payCallback( callbackSucces: Function, callbackFail: Function ) {
    //     const isConnected = MBirdSdk.isConnected();

    //     if (isConnected) {
    //       // let _SEFLTHIS = this;
    //       // this.paymentMessage = '';

    //       window['MBirdSdk'] = MBirdSdk;
    //       // window['_SELFTHIS'] = this;
    //       const priceStr = this.localizationService.formatNumber(this.basketService.getTotalOrder() / 100, 2 );
    //       MBirdSdk.Payment.Pay(parseInt(priceStr, 10), '001').then(function (result) {
    //           // do something with the result
    //           // Log.debug("dedesupt e ceva smecher")
    //           // Log.debug(result);
    //           Log.debug('Payment success!');
    //           Log.debug('result');
    //           callbackSucces( result );
    //           // _SEFLTHIS.thankyou = true;
    //           // _SEFLTHIS.transactionStatus = false;
    //           // _SEFLTHIS.paymentRunning = false;
    //           // _SEFLTHIS.InjectOrder(data);
    //       }).catch(function (error) {
    //         callbackFail( error );
    //           // handle error
    //           // _SEFLTHIS.transactionStatus = false;
    //           // _SEFLTHIS.paymentRunning = false;
    //           // _SEFLTHIS.showError("Payment error: " + error);
    //       });
    //     } else {
    //       callbackFail( 'simulation' );
    //     }
    //     try {
    //       // this.core.hookOrderCheckout.afterStartPay();
    //     } catch (e) {
    //       Log.debug(e.message);
    //     }
    //   }

    testPayment(paymentAvailable: boolean) {
        if (this.kioskService.configReq.paymentReq >= this.kioskService.reqActiveMandatory) {
            if (paymentAvailable) {
                this.kioskService.configReq.paymentSta = this.kioskService.stateOk;
                Log.debug(' PAYMENT ACTIVE ');
            } else {
                this.kioskService.configReq.paymentSta = this.kioskService.stateNok;
                Log.debug(' PAYMENT INACTIVE ');
            }
        } else if (this.kioskService.configReq.paymentReq == this.kioskService.reqSimulated) {
            this.kioskService.configReq.paymentSta = this.kioskService.stateSim;
            Log.debug(' PAYMENT SIMULATED ');
        } else {
            this.kioskService.configReq.paymentSta = this.kioskService.stateNok;
            Log.debug(' PAYMENT INACTIVE ');
        }

    }


}
