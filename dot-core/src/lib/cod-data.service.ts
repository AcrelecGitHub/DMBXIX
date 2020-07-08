import { Injectable } from '@angular/core';
import { Observable, Subject } from 'rxjs';

import { MBirdSdk } from '../externals/mbird-sdk';
import { Log } from './logger/log';
import { CODUpdateService } from './cod-update.service';

@Injectable({
  providedIn: 'root'
})
export class CODDataService {

    private _context = 'cod-xix';

    private _dataUpdated = new Subject<void>();

    constructor(private _updateService: CODUpdateService) {
    }

    public async initialize(): Promise<void> {
        Log.info('Initializing Data Service...');

        if (!MBirdSdk.isConnected()) {
            Log.warn('MBird is not connected. Data service will not be available for data updates!');
            return;
        }

        MBirdSdk.SharingCallbacks.NewMessage((message: { Source: MBirdSdk.FoundFriendApp, Message: any, WaitForAnswer: boolean }) => {
            Log.info('New message received from app [{0}] running on node [{1}]. Message: {2}',
                message.Source.AppIdentifier, message.Source.EntityIp, message);

            if (message.Source.Context !== this._context) {
                return;
            }

            if (message.Message.action === 'data-available') {
                this._updateService.require(() => this.update(message.Source));
            }
        });

        // Wait once, so if the data importer is running, it will update the data, otherwise, it will keep trying in background
        await this.backgroundLoad();

        void await MBirdSdk.Tweet.Register(this._context, ['cod-xix_application']);
    }

    public async backgroundLoad() {
        let success = false;
        const subscription = this._dataUpdated.subscribe(() => success = true);

        const friendApps: MBirdSdk.FoundFriendApp[] = <any>await MBirdSdk.Tweet.DiscoverByTopic(['cod-xix_data-provider']);
        Log.debug('Found {0} friend app to request update...', friendApps.length);

        for (const friendApp of friendApps) {
            await this.update(friendApp);

            if (success) {
                break;
            }
        }

        subscription.unsubscribe();

        if (!success) {
            // Do not await here, to it will be loaded in background
            setTimeout(() => {
                this.backgroundLoad();
            }, 1000);
        }
    }

    public get dataUpdated(): Observable<void> {
        return this._dataUpdated.asObservable();
    }

    private async update(source: MBirdSdk.FoundFriendApp): Promise<void> {
        const appDetails: any = await MBirdSdk.Settings.AppDetails();
        const message = {
            action: 'update',
            targetPath: appDetails.AppFolderPath + '\\data'
        };

        Log.info('Sending update request message to {0} [node {1}]...', source.AppIdentifier, source.EntityIp);
        const resultMessage = <any>await MBirdSdk.Tweet.NewMessage(source, JSON.stringify(message), true);
        Log.info('Update result [{1}]: {0}', resultMessage, typeof resultMessage);

        const result = typeof resultMessage === 'string' ? JSON.parse(resultMessage) : resultMessage;

        if (result && result.success) {
            this._dataUpdated.next();

            // Create new promise give a chance to all dependent services that will need to be
            // updated to register for update before we finish the current cycle.
            return Promise.resolve();
        }

        return Promise.reject();
    }
}
