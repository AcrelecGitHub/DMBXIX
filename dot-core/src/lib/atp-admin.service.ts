import { Injectable } from '@angular/core';

import { MBirdSdk } from '../externals/mbird-sdk';
import { Log } from './logger/log';


@Injectable({
    providedIn: 'root'
})
export class AtpAdminService {

    constructor() { }

    async openAdmin() {
        if (MBirdSdk.isConnected()) {
            return MBirdSdk.Admin.Open();
        }
        Log.warn('AtpAdminService.openAdmin: MBirdSdk is NOT Connected');
    }

    async hideBrowserCloseButton() {
        if (MBirdSdk.isConnected()) {
            return MBirdSdk.UserInterface.CloseButton(MBirdSdk.UIAlignment.Hide, '', 0, 0);
        }
        Log.warn('AtpAdminService.openAdmin: MBirdSdk is NOT Connected');
    }



}
