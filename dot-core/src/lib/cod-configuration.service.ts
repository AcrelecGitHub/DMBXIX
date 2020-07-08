import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';

import { Log } from './logger/log';
import { MBirdSdk } from '../externals/mbird-sdk';
import { CODUpdateService } from './cod-update.service';

@Injectable({
    providedIn: 'root'
})
export class CODConfigurationService<T> {

    private _configuration: any;

    constructor(private http: HttpClient,
        private _updateService: CODUpdateService) {
     }

    public configuration(): T {
        return <T>this._configuration;
    }

    public get<K extends keyof T>(propertyName: K): T[K] {
        return this._configuration[propertyName];
    }

    public async initialize(): Promise<void> {
        Log.info('Initializing Configuration Service...');

        await Promise.retry(async () => await this.load(), (retry) => Math.min(60, retry) * 1000);

        if (MBirdSdk.isConnected()) {
            MBirdSdk.BundleSettingsCallbacks.BundlesettingsChanged(() => {
                Log.info('Bundle Settings Changed. Update required!');
                this._updateService.require(() => this.initialize());
            });
        }
    }

    public async load(): Promise<void> {
        Log.info('Loading Configuration Service...');

        if (MBirdSdk.isConnected()) {
            this._configuration = await MBirdSdk.Settings.BundleSettings();
        } else {
            Log.warn('MBird not connected!');
            const url = './data/mock/app-bundle-settings.json?t=' + Date.now();
            this._configuration = await this.http.get(url).toPromise();
        }

        Object.freeze(this._configuration);
    }
}

