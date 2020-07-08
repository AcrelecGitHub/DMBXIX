import { Injectable } from '@angular/core';
import { Observable, Subject } from 'rxjs';

import { MBirdSdk } from '../externals/mbird-sdk';
import { Log } from './logger/log';

@Injectable({
  providedIn: 'root'
})
export class CODScannerService {

    private readonly _scannerEventId = 'Scanner_Scanned';

    private _scan = new Subject<string>();

    public get scan(): Observable<string> {
        return this._scan.asObservable();
    }

    public start(): void {
        if (!MBirdSdk || !MBirdSdk.isConnected()) {
            Log.warn('MBirdSdk is not connected! Scanner service will not be available');
            return;
        }

        MBirdSdk.EventTriggers.Register([this._scannerEventId]).then(() => {
            Log.info('Registration to ATP event {0} succeed!', this._scannerEventId);
        }).catch(() => {
            Log.error('Could not register listener ATP event {0}', this._scannerEventId);
        });

        MBirdSdk.EventTriggers.OnEventRaised((event: { EventName: string, Params: any }) => {
            Log.debug('ATP event {0} raised with paramers: {1}', event.EventName, event.Params);
            if (event.EventName !== this._scannerEventId) {
                return;
            }

            const data = <{ ScannedContent: string }>event.Params;

            this._scan.next(data.ScannedContent);
        });
    }

    public stop(): void {
        if (!this._scan) {
            return;
        }

        MBirdSdk.EventTriggers.Unregister([this._scannerEventId]);
    }

}
