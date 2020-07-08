import { Injectable } from '@angular/core';
import { Observable, Subject } from 'rxjs';

import { MBirdSdk } from '../externals/mbird-sdk';
import { Log } from './logger/log';

export class ContinuouslyScanEvent {
    EventName: string;
    Params: any;
}


@Injectable({
  providedIn: 'root'
})
export class ScanService {

    constructor() {}

    private continuouslyScan: Subject<any> = new Subject();

    public onContinuouslyScan() {
        return this.continuouslyScan.asObservable();
    }

    startContinuouslyScan(): Observable<any> {
        if (!MBirdSdk || !MBirdSdk.isConnected()) {
            this.continuouslyScan.error('MBirdSdk is not connected! Make sure you run this App with Pigeon or on an ATP Device');
            this.continuouslyScan.complete();
            return;
        }

        MBirdSdk.EventTriggers.Register(['Scanner_Scanned']).then((x) => {
            // Registered with success
        }).catch(function (error) {
            this.continuouslyScan.error('Could not register listener for Continuously Scan');
            this.continuouslyScan.complete();
        });

        MBirdSdk.EventTriggers.OnEventRaised((eventRaised: ContinuouslyScanEvent) => {
            this.continuouslyScan.next(eventRaised);
        });

        return this.continuouslyScan.asObservable();
    }

    stopContinuouslyScan(): Promise<any> {
        if (!MBirdSdk || !MBirdSdk.isConnected()) {
            return new Promise(function(resolve, reject) {
                reject('MBirdSdk is not connected! Make sure you run this App with Pigeon or on an ATP Device');
            });
        }
        return MBirdSdk.EventTriggers.Unregister(['Scanner_Scanned']);
    }

    scan(seconds: number = 30): Promise<any> {
        if (seconds < 2 || seconds > 30) {
            return new Promise(function(resolve, reject) {
                reject('seconds value must be higher than 2 and lower than 120');
            });
        }
        return MBirdSdk.Scanner.Scan(seconds);
    }
}
