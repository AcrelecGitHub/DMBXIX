import { Injectable } from '@angular/core';

import { MBirdSdk } from '../externals/mbird-sdk';
import { Log } from './logger/log';
import { BiLogsService } from './bi-logs.service';
import { ConfigurationService } from './configuration.service';
import { BIMarketTypes } from './enums';

@Injectable({
    providedIn: 'root'
})
export class BiLogsConsumerService {

    constructor(biLogs: BiLogsService,
                private configurationService: ConfigurationService) {
        biLogs.onNewBiLog.subscribe(x => this.onNewBiLog(x));
    }

    private onNewBiLog(event) {
        // Log.info('BiLogsConsumerService.onNewBiLog: event = {0} ', event);
        if (MBirdSdk.isConnected() && this.configurationService.biMarket === BIMarketTypes.Enabled) {
            MBirdSdk.Trace.AddEvent(JSON.stringify(event).trim()).catch(e => {
                Log.error('BiLogsConsumerService.onNewBiLog: Error = {0}', e['message']);
            });
        }
    }
}
