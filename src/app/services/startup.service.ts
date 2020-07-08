import { Injectable } from '@angular/core';
import { CODConfigurationService } from '../../../dot-core/src/lib/cod-configuration.service'
import { CODBannersService } from '../../../dot-core/src/lib/cod-banners.service';
import { CODInternationalizationService } from '../../../dot-core/src/lib/cod-internationalization.service';
import { CODService } from '../../../dot-core/src/lib/cod.service';

import { Observable, Subject } from 'rxjs';

@Injectable({
    providedIn: 'root'
})
export class StartupService {

    private _startupStream: Subject<string>;

    constructor(private _configurationService: CODConfigurationService<any>,
        private _bannersService: CODBannersService,
        private _internationalizationService: CODInternationalizationService,
        private _codService: CODService) {
    }

    public get initialized(): boolean {
        if (!this._startupStream) {
            return false;
        }

        return this._startupStream.closed;
    }

    public get progressStream(): Observable<string> {
        if (!this._startupStream) {
            return null;
        }

        return this._startupStream.asObservable();
    }

    public async initialize(): Promise<void> {
        this._startupStream = new Subject<string>();
        this._startupStream.next('Initializing Configuration Service...');
        await this._configurationService.initialize();

        // TODO It should not initialize other services
        // await this.updateService.initialize();

        this._startupStream.next('Initializing Banners Service...');
        await this._bannersService.initialize();

        this._startupStream.next('Initializing Internationalization Service...');
        await this._internationalizationService.initialize();

        this._startupStream.next('Initializing Customer Order Display Service...');
        await this._codService.initialize();

        this._startupStream.next('Customer Order Display XIX initialized!');

        setTimeout(() => {
            this._startupStream.complete();
            this._startupStream.unsubscribe();
        }, 1000);
    }

}
