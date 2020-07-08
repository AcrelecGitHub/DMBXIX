/**
 * v1.0
 * This Service is used to check peripherals and, if anything is in error state to send a specific ATP Alert
 * There are 4 alerts: Printer, Payment, Scanner, POS
 *
 */

import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';

import { MBirdSdk } from '../externals/mbird-sdk';
import { Log } from './logger/log';
import { PeripheralsStatusDetails } from './models/peripheralsStatusDetails.model';
import { PosInjectorService } from './pos-injector.service';
import { ConfigurationService } from './configuration.service';
import { Subject, Observable } from 'rxjs';
import { PeripheralsCheckMode, PeripheralsErrorsTypes } from './enums';

export interface PeripheralStatus {
    PeripheralName: string;
    StatusCode: number;
    Status: boolean;
    Description: string;
}

@Injectable({
    providedIn: 'root'
})
export class SelfCheckService {

    private _peripheralsCheck: Subject<PeripheralStatus[]> = new Subject<PeripheralStatus[]>();
    private autoCheckTimeout: ReturnType<typeof setTimeout>;
    private atpAlertsSent: string[] = [];

    constructor(private http: HttpClient,
                private posInjector: PosInjectorService,
                private configurationService: ConfigurationService) {
    }

    public get onPeripheralsCheck(): Observable<PeripheralStatus[]> {
        return this._peripheralsCheck.asObservable();
    }

    public async startAutoCheck() {
        const peripheralsInError = await this.checkPeripherals();
        this._peripheralsCheck.next(peripheralsInError);
        this.autoCheckTimeout = setTimeout(() => this.startAutoCheck(), this.configurationService.peripheralsCheckTimer);
    }

    public stopAutoCheck() {
        if (this.autoCheckTimeout) {
            clearTimeout(this.autoCheckTimeout);
        }
    }

    public async checkPeripherals(): Promise<PeripheralStatus[]> {
        // get peripheralStatus ONLY if at least one peripheral is Mandatory or Optional
        const peripheralStatus = this.anyPeripheralIsMandatoryOrOptional() ?
            await this.getPeripheralsStatusDetails(this.configurationService.atpMocksPath).catch(e => null) :
            null;

        const peripheralsInError: PeripheralStatus[] = [];
        // return success
        if (peripheralStatus) {
            if (this.peripheralIsMandatoryOrOptional(this.configurationService.printerCheckMode)) {
                if (peripheralStatus.Printer.StatusCode !== 0) {
                    // Make sure to send the alert only once per failed session
                    if (this.atpAlertsSent.indexOf('printer') == -1) {
                        this.sendAtpAlert(PeripheralsErrorsTypes.PrinterError,
                            'Printer Error',
                            `Printer details ${JSON.stringify(peripheralStatus.Printer)}`,
                            JSON.stringify(peripheralStatus.Printer)).catch(e => null);
                        this.atpAlertsSent.push('printer');
                    }

                    // If this is Mandatory, push it in peripheralsInError (will be sent forward to UI so it can block the App):
                    if (this.configurationService.printerCheckMode == PeripheralsCheckMode.Mandatory) {
                        peripheralStatus.Printer.PeripheralName = 'Printer';
                        peripheralsInError.push(peripheralStatus.Printer);
                    }
                } else {
                    this.atpAlertsSent = this.atpAlertsSent.filter(x => x != 'printer');
                }
            }


            if (this.peripheralIsMandatoryOrOptional(this.configurationService.paymentCheckMode)) {
                if (peripheralStatus.Payment.StatusCode !== 0) {
                    // Make sure to send the alert only once per failed session
                    if (this.atpAlertsSent.indexOf('payment') == -1) {
                        this.sendAtpAlert(PeripheralsErrorsTypes.PaymentError,
                            'Payment Error',
                            `Payment details ${JSON.stringify(peripheralStatus.Payment)}`,
                            JSON.stringify(peripheralStatus.Payment)).catch(e => null);
                        this.atpAlertsSent.push('payment');
                    }

                    // If this is Mandatory, push it in peripheralsInError (will be sent forward to UI so it can block the App):
                    if (this.configurationService.paymentCheckMode == PeripheralsCheckMode.Mandatory) {
                        peripheralStatus.Payment.PeripheralName = 'Payment';
                        peripheralsInError.push(peripheralStatus.Payment);
                    }
                } else {
                    this.atpAlertsSent = this.atpAlertsSent.filter(x => x != 'payment');
                }
            }

            if (this.peripheralIsMandatoryOrOptional(this.configurationService.scannerCheckMode)) {
                if (peripheralStatus.Scanner.StatusCode !== 0) {
                    // Make sure to send the alert only once per failed session
                    if (this.atpAlertsSent.indexOf('scanner') == -1) {
                        this.sendAtpAlert(PeripheralsErrorsTypes.ScannerError,
                            'Scanner Error',
                            `Scanner details ${JSON.stringify(peripheralStatus.Scanner)}`,
                            JSON.stringify(peripheralStatus.Scanner)).catch(e => null);
                        this.atpAlertsSent.push('scanner');
                    }
                    // If this is Mandatory, push it in peripheralsInError (will be sent forward to UI so it can block the App):
                    if (this.configurationService.scannerCheckMode == PeripheralsCheckMode.Mandatory) {
                        peripheralStatus.Scanner.PeripheralName = 'Scanner';
                        peripheralsInError.push(peripheralStatus.Scanner);
                    }
                } else {
                    this.atpAlertsSent = this.atpAlertsSent.filter(x => x != 'scanner');
                }
            }
        }

        if (this.peripheralIsMandatoryOrOptional(this.configurationService.posCheckMode)) {
            const testResult = await this.posInjector.testConnect().catch(e => null);

            Log.debug(' testResult = {0}', testResult);

            if (!testResult || testResult.ReturnCode !== 0) {
                // Make sure to send the alert only once per failed session
                if (this.atpAlertsSent.indexOf('pos') == -1) {
                    this.sendAtpAlert(PeripheralsErrorsTypes.POSError,
                        'POS TestConnect Error',
                        `POS details ${JSON.stringify(testResult)}`).catch(e => null);
                    this.atpAlertsSent.push('pos');
                }

                // If this is mandatory, push it in peripheralsInError (will be sent forward to UI so it can block the App):
                if (this.configurationService.posCheckMode == PeripheralsCheckMode.Mandatory) {
                    peripheralsInError.push({
                        PeripheralName: 'POS Connect',
                        StatusCode: testResult ? testResult.ReturnCode : null,
                        Status: true,
                        Description: testResult ? '' : 'Could not connect to POS',
                    });
                }
            } else {
                this.atpAlertsSent = this.atpAlertsSent.filter(x => x != 'pos');
            }
        }

        return peripheralsInError;
    }

    /**
     *  Called to retrive Peripherals Status
     * @param pathToMocks: path to ATP Mocks (you may find it in configurationService.atpMocksPath)
     * Check https://developer.acrelec.com/resources/sdk/docs/6_1_1/#status-details
     */
    private async getPeripheralsStatusDetails(pathToMocks: string): Promise<PeripheralsStatusDetails> {
        return (MBirdSdk.isConnected()) ?
                MBirdSdk.Peripherals.StatusDetails() :
                this.loadMockFile(`${pathToMocks}peripherals-status-details.mock.json`);
    }

    /**
     * Will check if any of printer, scanner OR payment is either Mandatory or Optional
     */
    private anyPeripheralIsMandatoryOrOptional() {
        return this.peripheralIsMandatoryOrOptional(this.configurationService.printerCheckMode) ||
               this.peripheralIsMandatoryOrOptional(this.configurationService.paymentCheckMode) ||
               this.peripheralIsMandatoryOrOptional(this.configurationService.scannerCheckMode);
    }

    /**
     * @param checkMode: status of a given peripheral
     */
    private peripheralIsMandatoryOrOptional(checkMode: PeripheralsCheckMode) {
        return checkMode === PeripheralsCheckMode.Mandatory ||
               checkMode === PeripheralsCheckMode.Optional;
    }

    /**
     * Used to actually call the ATP Alerts API
     * @param alertType: string, the exact alert name/type to send (It must be the same with one used in Market!)
     * @param emailSubject: requested by ATP API
     * @param emailBody: requested by ATP API
     * @param details: requested by ATP API
     * Check: https://developer.acrelec.com/resources/sdk/docs/6_1_1/#add-alert
     */
    private async sendAtpAlert(alertType: string, emailSubject: string, emailBody: string, details: string = '') {
        if (MBirdSdk.isConnected()) {
            return MBirdSdk.Trace.AddAlert(alertType, emailSubject, emailBody, details);
        }
    }

    /**
     * Used to load mocks files
     * @param path: string, path to mock file
     */
    private loadMockFile(path: string): Promise<any> {
        return this.http.get(path).toPromise();
    }
}
