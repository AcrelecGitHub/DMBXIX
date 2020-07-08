import { Injectable, NgZone } from '@angular/core';
import { Observable, Subject } from 'rxjs';

import { MBirdSdk } from '../externals/mbird-sdk';
import { Log } from './logger/log';


export class FoundFriendApp {
    AppIdentifier: string;
    Context: string;
    EntityIp: string;
}

@Injectable({
    providedIn: 'root'
})
export class AtpTweetService {

    constructor() {
        // Use this so MBirdSdk callbacks will work:
        window['MBirdSdk'] = MBirdSdk;
    }

    registerApp(appContext: string) {
        if (!MBirdSdk || !MBirdSdk.isConnected()) {
            return new Promise(function (resolve, reject) {
                reject('AtpTweetService. MBirdSdk is not connected! Make sure you run this App with Pigeon or on an ATP Device');
            });
        }
        return MBirdSdk.Tweet.Register(appContext);
    }

    registerListenerForMessages() {
        return new Observable(observer => {
            // Validate MBirdSdk.isConnected():
            if (!MBirdSdk || !MBirdSdk.isConnected()) {
                observer.error('MBirdSdk is not connected! Make sure you run this App with Pigeon or on an ATP Device');
                observer.complete();
                return;
            }
            // Listen for New Message Event:
            MBirdSdk.SharingCallbacks.NewMessage((response) => {
                Log.info('AtpTweetService.registerListenerForMessages: new message: {0}', response);
                observer.next(response);
            });
        });
    }
}
